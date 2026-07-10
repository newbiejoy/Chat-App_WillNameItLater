
const dns = require('dns')
dns.setServers(['8.8.8.8', '8.8.4.4'])

require('dotenv').config()

const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const cors = require('cors')
const mongoose = require('mongoose')
const Message = require('./models/Message')

const app = express()
const PORT = 5000

const httpServer = createServer(app)

const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

app.use(cors())
app.get('/', (req, res) => {
  res.json({ message: 'QuickChat server is running' })
})

oUser: Map<socketId, username>

const onlineUsers = new Map()
const socketToUser = new Map()


function getOnlineUsersList() {
  return Array.from(onlineUsers.keys())
}


mongoose.connect(process.env.MONGODB_URI)
  .then(() => {
    console.log('Connected to MongoDB Atlas')
  })
  .catch((err) => {
    console.error('MongoDB connection error:', err.message)
    process.exit(1)
  })


io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`)


  socket.on('user:join', (username, callback) => {
    const trimmed = username?.trim()

    if (!trimmed || trimmed.length < 1 || trimmed.length > 20) {
      callback({ success: false, error: 'Username must be 1–20 characters.' })
      return
    }

    if (onlineUsers.has(trimmed) && onlineUsers.get(trimmed) !== socket.id) {
      callback({ success: false, error: 'Username is already taken.' })
      return
    }

    onlineUsers.set(trimmed, socket.id)
    socketToUser.set(socket.id, trimmed)

    socket.join('global')

    console.log(`User joined: ${trimmed} (${socket.id})`)
    io.emit('users:online', getOnlineUsersList())
    callback({ success: true })
  })

  
  socket.on('message:private', async (data) => {
    const senderUsername = socketToUser.get(socket.id)
    if (!senderUsername) return

    const recipientSocketId = onlineUsers.get(data.to)

    const message = {
      from: senderUsername,
      to: data.to,
      text: data.text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

  
    try {
      await Message.create(message)
    } catch (err) {
      console.error('Failed to save message:', err.message)
    }

    // Send to recipient (if online)
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('message:receive', message)
    }

    // Send back to sender
    socket.emit('message:receive', message)
  })

  /*
    "message:global" — A user sends a message to the global chat room.
    
    Data shape: { text: "message content" }
    
    Broadcasts to ALL connected users and saves to the database.
    We use to: "__global__" to distinguish global messages from private ones.
  */
  socket.on('message:global', async (data) => {
    const senderUsername = socketToUser.get(socket.id)
    if (!senderUsername) return

    const message = {
      from: senderUsername,
      to: '__global__',
      text: data.text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    // Save to MongoDB
    try {
      await Message.create(message)
    } catch (err) {
      console.error('Failed to save global message:', err.message)
    }

    // Broadcast to ALL connected users (including sender)
    io.emit('message:globalReceive', message)
  })

  /*
    "message:history" — Load past messages between two users.
    
    Data shape: { with: "otherUsername" }
    
    Returns the last 50 messages between the requesting user and the other user.
    We query for messages where (from=me, to=them) OR (from=them, to=me).
  */
  socket.on('message:history', async (data, callback) => {
    const myUsername = socketToUser.get(socket.id)
    if (!myUsername) {
      callback([])
      return
    }

    try {
      const messages = await Message.find({
        $or: [
          { from: myUsername, to: data.with },
          { from: data.with, to: myUsername }
        ]
      })
        .sort({ createdAt: 1 })  // Oldest first
        .limit(50)
        .lean()  // Return plain objects instead of Mongoose documents

      // Send back only the fields the client needs
      const cleaned = messages.map((msg) => ({
        from: msg.from,
        to: msg.to,
        text: msg.text,
        time: msg.time
      }))

      callback(cleaned)
    } catch (err) {
      console.error('Failed to load history:', err.message)
      callback([])
    }
  })

  /*
    "message:globalHistory" — Load past global chat messages.
    
    Returns the last 50 global messages (where to === "__global__").
  */
  socket.on('message:globalHistory', async (callback) => {
    try {
      const messages = await Message.find({ to: '__global__' })
        .sort({ createdAt: 1 })
        .limit(50)
        .lean()

      const cleaned = messages.map((msg) => ({
        from: msg.from,
        to: msg.to,
        text: msg.text,
        time: msg.time
      }))

      callback(cleaned)
    } catch (err) {
      console.error('Failed to load global history:', err.message)
      callback([])
    }
  })

  /*
    "disconnect" — Clean up when a user leaves.
  */
  socket.on('disconnect', () => {
    const username = socketToUser.get(socket.id)

    if (username) {
      onlineUsers.delete(username)
      socketToUser.delete(socket.id)
      console.log(`User left: ${username}`)
      io.emit('users:online', getOnlineUsersList())
    }

    console.log(`Socket disconnected: ${socket.id}`)
  })
})

// Start the HTTP server
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
