/*
  App is the root component of the entire application.

  It manages all the "global" state:
  - username: Who is logged in (null = show the username screen)
  - onlineUsers: Array of currently online usernames from the server
  - selectedUser: Which user's chat is currently open ("__global__" for global chat)
  - messages: Object mapping each conversation partner to their messages
  - unreadFrom: Set of usernames (+ "__global__") who have unread messages
  - historyLoaded: Set of conversation keys whose history has been fetched from the DB

  State flow:
  1. Check localStorage for a saved username
  2. If no username → show UsernameScreen
  3. If username exists → connect to Socket.IO, show Sidebar + ChatWindow
  4. Listen for socket events: users:online, message:receive, message:globalReceive
  5. When selecting a user, load chat history from the database (once)
*/

import { useState, useEffect, useCallback, useRef } from 'react'
import { socket } from './socket'
import UsernameScreen from './components/UsernameScreen'
import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'

// Special key for the global chat conversation
const GLOBAL_KEY = '__global__'

function App() {
  // ===== State =====

  const [username, setUsername] = useState(() => {
    return localStorage.getItem('quickchat-username') || null
  })

  const [onlineUsers, setOnlineUsers] = useState([])

  const [selectedUser, setSelectedUser] = useState(() => {
    return localStorage.getItem('quickchat-selected') || null
  })

  // Messages organized by conversation partner (or "__global__" for global chat)
  const [messages, setMessages] = useState({})

  // Track which users have sent us unread messages
  const [unreadFrom, setUnreadFrom] = useState(new Set())

  // Track which conversations have had their history loaded from the database
  // So we don't re-fetch every time you click back and forth
  const [historyLoaded, setHistoryLoaded] = useState(new Set())

  // Whether chat history is currently being loaded (for showing a spinner)
  const [loadingHistory, setLoadingHistory] = useState(false)

  // Theme state: 'dark' (AMOLED) or 'light'
  const [theme, setTheme] = useState(() => {
    return localStorage.getItem('quickchat-theme') || 'dark'
  })

  // Apply theme to the <html> tag whenever it changes
  useEffect(() => {
    document.documentElement.setAttribute('data-theme', theme)
    localStorage.setItem('quickchat-theme', theme)
  }, [theme])

  function toggleTheme() {
    setTheme((prev) => (prev === 'dark' ? 'light' : 'dark'))
  }

  // Ref to track selectedUser inside event handlers (avoids stale closures)
  const selectedUserRef = useRef(selectedUser)
  useEffect(() => {
    selectedUserRef.current = selectedUser
  }, [selectedUser])

  // ===== Socket.IO Connection & Event Listeners =====

  useEffect(() => {
    if (!username) return

    function handleConnect() {
      socket.emit('user:join', username, (response) => {
        if (!response.success) {
          console.warn('Username taken on reconnect:', response.error)
          handleLogout()
        }
      })
    }

    function handleOnlineUsers(users) {
      setOnlineUsers(users)
    }

    // Private message received
    function handleMessage(message) {
      const partner = message.from === username ? message.to : message.from

      setMessages((prev) => ({
        ...prev,
        [partner]: [...(prev[partner] || []), message]
      }))

      // Mark as unread if the message is from someone else and not currently selected
      if (message.from !== username && message.from !== selectedUserRef.current) {
        setUnreadFrom((prev) => {
          const newSet = new Set(prev)
          newSet.add(message.from)
          return newSet
        })
      }
    }

    // Global message received
    function handleGlobalMessage(message) {
      setMessages((prev) => ({
        ...prev,
        [GLOBAL_KEY]: [...(prev[GLOBAL_KEY] || []), message]
      }))

      // Mark global as unread if we're not currently viewing it
      if (message.from !== username && selectedUserRef.current !== GLOBAL_KEY) {
        setUnreadFrom((prev) => {
          const newSet = new Set(prev)
          newSet.add(GLOBAL_KEY)
          return newSet
        })
      }
    }

    socket.on('users:online', handleOnlineUsers)
    socket.on('message:receive', handleMessage)
    socket.on('message:globalReceive', handleGlobalMessage)

    // handleConnect re-joins on reconnection or on page refresh
    socket.on('connect', handleConnect)

    // If socket isn't connected yet (e.g., page refresh with saved username), connect it
    if (!socket.connected) {
      socket.connect()
    }

    return () => {
      socket.off('connect', handleConnect)
      socket.off('users:online', handleOnlineUsers)
      socket.off('message:receive', handleMessage)
      socket.off('message:globalReceive', handleGlobalMessage)
    }
  }, [username])

  // ===== Load Chat History When Selecting a User =====

  useEffect(() => {
    if (!selectedUser || !socket.connected) return

    // Don't reload if we already fetched this conversation's history
    if (historyLoaded.has(selectedUser)) return

    setLoadingHistory(true)

    if (selectedUser === GLOBAL_KEY) {
      // Load global chat history — replace (not merge) to avoid duplicates
      socket.emit('message:globalHistory', (history) => {
        setMessages((prev) => ({
          ...prev,
          [GLOBAL_KEY]: history
        }))
        setHistoryLoaded((prev) => new Set(prev).add(GLOBAL_KEY))
        setLoadingHistory(false)
      })
    } else {
      // Load private chat history — replace (not merge) to avoid duplicates
      socket.emit('message:history', { with: selectedUser }, (history) => {
        setMessages((prev) => ({
          ...prev,
          [selectedUser]: history
        }))
        setHistoryLoaded((prev) => new Set(prev).add(selectedUser))
        setLoadingHistory(false)
      })
    }
  }, [selectedUser, username])

  // ===== Clear Unread When Selecting a User =====

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

  function handleJoin(name) {
    setUsername(name)
  }

  function handleSelectUser(user) {
    setSelectedUser(user)
    localStorage.setItem('quickchat-selected', user)

    setUnreadFrom((prev) => {
      const newSet = new Set(prev)
      newSet.delete(user)
      return newSet
    })
  }

  /**
   * Send a message — either private or global depending on selectedUser.
   * text: the message text (can be empty if sending a file only)
   * file: optional file object { url, name, type } from the upload
   */
  const handleSendMessage = useCallback((text, file) => {
    if (!selectedUser) return

    // Must have either text or a file
    const hasText = text && text.trim()
    if (!hasText && !file) return

    const payload = { text: hasText ? text.trim() : '' }
    if (file) {
      payload.file = file
    }

    if (selectedUser === GLOBAL_KEY) {
      socket.emit('message:global', payload)
    } else {
      socket.emit('message:private', {
        to: selectedUser,
        ...payload
      })
    }
  }, [selectedUser])

  function handleLogout() {
    localStorage.removeItem('quickchat-username')
    localStorage.removeItem('quickchat-selected')
    setUsername(null)
    setSelectedUser(null)
    setMessages({})
    setOnlineUsers([])
    setUnreadFrom(new Set())
    setHistoryLoaded(new Set())
    socket.disconnect()
  }

  // ===== Render =====

  if (!username) {
    return <UsernameScreen onJoin={handleJoin} />
  }

  return (
    <div className="flex h-screen">
      <Sidebar
        onlineUsers={onlineUsers}
        selectedUser={selectedUser}
        onSelectUser={handleSelectUser}
        currentUser={username}
        unreadFrom={unreadFrom}
        onLogout={handleLogout}
        theme={theme}
        onToggleTheme={toggleTheme}
      />
      <ChatWindow
        selectedUser={selectedUser}
        messages={messages[selectedUser] || []}
        onSendMessage={handleSendMessage}
        currentUser={username}
        isGlobal={selectedUser === GLOBAL_KEY}
        loadingHistory={loadingHistory}
      />
    </div>
  )
}

export default App
