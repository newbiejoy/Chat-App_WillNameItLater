/*
  Server entry point.
  
  Express handles HTTP requests.
  Socket.IO handles real-time WebSocket communication.
  
  How it works:
  - When a user connects, they emit "user:join" with their desired username.
  - The server checks if the username is already taken.
  - If available, the user is added to the online users map.
  - The server broadcasts the updated online users list to everyone.
  - When a user sends a private message, the server relays it to the recipient.
  - When a user disconnects, they are removed and the list is updated.
*/

const express = require('express')
const { createServer } = require('http')
const { Server } = require('socket.io')
const cors = require('cors')

const app = express()
const PORT = 5000

// Create an HTTP server from the Express app.
// Socket.IO needs an HTTP server — it can't attach directly to Express.
const httpServer = createServer(app)

// Create the Socket.IO server.
// We allow connections from our React dev server (localhost:5173).
const io = new Server(httpServer, {
  cors: {
    origin: 'http://localhost:5173',
    methods: ['GET', 'POST']
  }
})

// Health check route — useful for testing if the server is running
app.use(cors())
app.get('/', (req, res) => {
  res.json({ message: 'QuickChat server is running' })
})

/*
  In-memory storage for online users.
  
  onlineUsers: Map<username, socketId>
    - Maps each username to their socket ID
    - Used to look up a user's socket for private messaging
    
  socketToUser: Map<socketId, username>
    - Reverse mapping so we can find the username when a socket disconnects
*/
const onlineUsers = new Map()
const socketToUser = new Map()

/**
 * Get the list of online usernames as a plain array.
 * This is what we send to all clients whenever the list changes.
 */
function getOnlineUsersList() {
  return Array.from(onlineUsers.keys())
}

// ===== Socket.IO Event Handling =====

io.on('connection', (socket) => {
  console.log(`Socket connected: ${socket.id}`)

  /*
    "user:join" — A user wants to register a username.
    
    Flow:
    1. Check if the username is valid (not empty, reasonable length)
    2. Check if the username is already taken by someone else
    3. If available, store it and broadcast the updated user list
    4. Send back success or error to the requesting client
  */
  socket.on('user:join', (username, callback) => {
    // Trim whitespace and validate
    const trimmed = username?.trim()

    if (!trimmed || trimmed.length < 1 || trimmed.length > 20) {
      callback({ success: false, error: 'Username must be 1–20 characters.' })
      return
    }

    // Check if this username is already taken by a DIFFERENT socket
    if (onlineUsers.has(trimmed) && onlineUsers.get(trimmed) !== socket.id) {
      callback({ success: false, error: 'Username is already taken.' })
      return
    }

    // Register the user
    onlineUsers.set(trimmed, socket.id)
    socketToUser.set(socket.id, trimmed)

    console.log(`User joined: ${trimmed} (${socket.id})`)

    // Tell everyone about the updated online users list
    io.emit('users:online', getOnlineUsersList())

    // Tell the requesting client that they joined successfully
    callback({ success: true })
  })

  /*
    "message:private" — A user sends a private message to another user.
    
    Data shape: { to: "recipientUsername", text: "message content" }
    
    Flow:
    1. Find the sender's username from our reverse map
    2. Find the recipient's socket ID from the online users map
    3. Send the message to the recipient
    4. Also send it back to the sender (so their UI updates)
  */
  socket.on('message:private', (data) => {
    const senderUsername = socketToUser.get(socket.id)
    if (!senderUsername) return // Not registered, ignore

    const recipientSocketId = onlineUsers.get(data.to)

    // Build the message object that both sides will receive
    const message = {
      from: senderUsername,
      to: data.to,
      text: data.text,
      time: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })
    }

    // Send to recipient (if they're online)
    if (recipientSocketId) {
      io.to(recipientSocketId).emit('message:receive', message)
    }

    // Send back to sender so their chat window updates too
    socket.emit('message:receive', message)
  })

  /*
    "disconnect" — A user closed their tab or lost connection.
    
    Clean up their entries from both maps and broadcast the updated list.
  */
  socket.on('disconnect', () => {
    const username = socketToUser.get(socket.id)

    if (username) {
      onlineUsers.delete(username)
      socketToUser.delete(socket.id)
      console.log(`User left: ${username}`)

      // Tell everyone the user list changed
      io.emit('users:online', getOnlineUsersList())
    }

    console.log(`Socket disconnected: ${socket.id}`)
  })
})

// Start the HTTP server (not app.listen — because Socket.IO is attached to httpServer)
httpServer.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
