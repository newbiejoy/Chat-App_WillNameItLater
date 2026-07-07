/*
  App is the root component of the entire application.

  It manages all the "global" state:
  - username: Who is logged in (null = show the username screen)
  - onlineUsers: Array of currently online usernames from the server
  - selectedUser: Which user's chat is currently open
  - messages: Object mapping each conversation partner to their messages
  - unreadFrom: Set of usernames who have sent messages while not selected

  State flow:
  1. Check localStorage for a saved username
  2. If no username → show UsernameScreen
  3. If username exists → connect to Socket.IO, show Sidebar + ChatWindow
  4. Listen for "users:online" and "message:receive" events from the server
*/

import { useState, useEffect, useCallback } from 'react'
import { socket } from './socket'
import UsernameScreen from './components/UsernameScreen'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'

function App() {
  // ===== State =====

  // The logged-in username (null means not logged in yet)
  const [username, setUsername] = useState(() => {
    return localStorage.getItem('quickchat-username') || null
  })

  // Array of online usernames from the server
  const [onlineUsers, setOnlineUsers] = useState([])

  // The username of the person we're currently chatting with
  const [selectedUser, setSelectedUser] = useState(() => {
    return localStorage.getItem('quickchat-selected') || null
  })

  // Messages organized by conversation partner.
  // Shape: { "Alice": [{ from, to, text, time }, ...], "Bob": [...] }
  const [messages, setMessages] = useState({})

  // Track which users have sent us unread messages (a Set of usernames)
  const [unreadFrom, setUnreadFrom] = useState(new Set())

  // ===== Socket.IO Connection & Event Listeners =====

  /*
    This effect runs when "username" changes.
    If the user has a username, we connect to the server and set up listeners.
    If they log out, we disconnect.
  */
  useEffect(() => {
    if (!username) return // Not logged in, do nothing

    // Connect the socket if it's not already connected
    if (!socket.connected) {
      socket.connect()
    }

    // Once connected (or reconnected), re-register our username
    function handleConnect() {
      socket.emit('user:join', username, (response) => {
        if (!response.success) {
          // Username was taken during our absence — force re-login
          console.warn('Username taken on reconnect:', response.error)
          handleLogout()
        }
      })
    }

    // When we receive the online users list from the server
    function handleOnlineUsers(users) {
      setOnlineUsers(users)
    }

    // When we receive a private message
    function handleMessage(message) {
      // Figure out who the "conversation partner" is.
      // If I sent it, the partner is "to". If someone sent it to me, the partner is "from".
      const partner = message.from === username ? message.to : message.from

      // Add the message to the correct conversation
      setMessages((prev) => ({
        ...prev,
        [partner]: [...(prev[partner] || []), message]
      }))

      // If this message is from someone who is NOT currently selected, mark as unread.
      // We use a function ref to get the latest selectedUser (closure trick).
      setUnreadFrom((prev) => {
        // We'll check selectedUser via a ref later, for now we just mark it
        // and clear in the selection handler
        if (message.from !== username) {
          const newSet = new Set(prev)
          newSet.add(message.from)
          return newSet
        }
        return prev
      })
    }

    // Register all event listeners
    socket.on('connect', handleConnect)
    socket.on('users:online', handleOnlineUsers)
    socket.on('message:receive', handleMessage)

    // If the socket is already connected (e.g., hot reload), register immediately
    if (socket.connected) {
      handleConnect()
    }

    // Cleanup: remove listeners when this effect re-runs or component unmounts
    return () => {
      socket.off('connect', handleConnect)
      socket.off('users:online', handleOnlineUsers)
      socket.off('message:receive', handleMessage)
    }
  }, [username]) // Re-run whenever username changes

  // ===== Unread Tracking Fix =====

  /*
    The message handler above can't read the latest selectedUser from inside
    the closure (it would be stale). So instead, we clear unread status whenever
    selectedUser changes — if we're now looking at their chat, they're "read".
  */
  useEffect(() => {
    if (selectedUser) {
      setUnreadFrom((prev) => {
        if (prev.has(selectedUser)) {
          const newSet = new Set(prev)
          newSet.delete(selectedUser)
          return newSet
        }
        return prev
      })
    }
  }, [selectedUser])

  // ===== Event Handlers =====

  /**
   * Called when the user successfully joins from the UsernameScreen.
   */
  function handleJoin(name) {
    setUsername(name)
  }

  /**
   * Called when the user clicks a user in the sidebar.
   * Saves the selection to localStorage so it persists on reload.
   */
  function handleSelectUser(user) {
    setSelectedUser(user)
    localStorage.setItem('quickchat-selected', user)

    // Clear unread for this user since we're now viewing their chat
    setUnreadFrom((prev) => {
      const newSet = new Set(prev)
      newSet.delete(user)
      return newSet
    })
  }

  /**
   * Called when the user sends a message from the ChatWindow.
   * Emits the message to the server via Socket.IO.
   */
  const handleSendMessage = useCallback((text) => {
    if (!selectedUser || !text.trim()) return

    socket.emit('message:private', {
      to: selectedUser,
      text: text.trim()
    })
  }, [selectedUser])

  /**
   * Log out: clear everything and disconnect.
   */
  function handleLogout() {
    localStorage.removeItem('quickchat-username')
    localStorage.removeItem('quickchat-selected')
    setUsername(null)
    setSelectedUser(null)
    setMessages({})
    setOnlineUsers([])
    setUnreadFrom(new Set())
    socket.disconnect()
  }

  // ===== Render =====

  // Not logged in → show the username entry screen
  if (!username) {
    return <UsernameScreen onJoin={handleJoin} />
  }

  // Logged in → show the main chat layout
  return (
    <div className="flex h-screen">
      <Sidebar
        onlineUsers={onlineUsers}
        selectedUser={selectedUser}
        onSelectUser={handleSelectUser}
        currentUser={username}
        unreadFrom={unreadFrom}
        onLogout={handleLogout}
      />
      <ChatWindow
        selectedUser={selectedUser}
        messages={messages[selectedUser] || []}
        onSendMessage={handleSendMessage}
        currentUser={username}
      />
    </div>
  )
}

export default App
