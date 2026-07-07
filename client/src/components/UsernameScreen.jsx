/*
  UsernameScreen component.
  
  This is the first thing the user sees when they open the app.
  It's a full-screen overlay with a centered card asking for a username.
  
  Props:
  - onJoin(username): Called when the user successfully joins with a username.
  
  Flow:
  1. User types a username
  2. User clicks "Join Chat" or presses Enter
  3. We emit "user:join" to the server via Socket.IO
  4. Server responds with success or error (via callback)
  5. On success → save to localStorage and call onJoin
  6. On error → show error message (e.g., "Username is already taken")
*/

import { useState } from 'react'
import { socket } from '../socket'

function UsernameScreen({ onJoin }) {
  // The text in the input field
  const [username, setUsername] = useState('')

  // Error message to show (e.g., "Username is already taken")
  const [error, setError] = useState('')

  // Whether we're currently trying to join (to disable the button)
  const [isLoading, setIsLoading] = useState(false)

  /**
   * Handle the form submission.
   * Connects the socket and emits "user:join" to the server.
   */
  function handleSubmit(e) {
    e.preventDefault() // Prevent page reload
    setError('')       // Clear any previous error

    const trimmed = username.trim()
    if (!trimmed) {
      setError('Please enter a username.')
      return
    }

    setIsLoading(true)

    // Connect the socket first (remember, autoConnect is false)
    if (!socket.connected) {
      socket.connect()
    }

    // Wait for the connection to be ready, then join
    // If already connected, this fires immediately
    socket.on('connect', () => {
      joinWithUsername(trimmed)
    })

    // If socket is already connected (e.g., reconnecting), join right away
    if (socket.connected) {
      joinWithUsername(trimmed)
    }
  }

  /**
   * Emit the "user:join" event and handle the server's response.
   * Socket.IO callbacks let us get a response from the server
   * without needing a separate event — it's like a function call.
   */
  function joinWithUsername(trimmed) {
    socket.emit('user:join', trimmed, (response) => {
      setIsLoading(false)

      if (response.success) {
        // Save username so we can restore it on page reload
        localStorage.setItem('quickchat-username', trimmed)
        onJoin(trimmed)
      } else {
        setError(response.error)
      }
    })
  }

  return (
    <div className="h-screen flex items-center justify-center bg-dark-950">
      {/* Centered card */}
      <div className="w-full max-w-sm mx-4">
        {/* Logo / Title */}
        <div className="text-center mb-8">
          <div className="w-16 h-16 bg-accent-500 rounded-2xl flex items-center justify-center mx-auto mb-4
                          shadow-lg shadow-accent-500/20">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor" className="w-8 h-8 text-white">
              <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 0 0-1.032-.211 50.89 50.89 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 20.97V18.03a48.527 48.527 0 0 1-1.087-.128C2.905 17.58 1.5 15.833 1.5 13.773V6.385c0-2.06 1.405-3.813 3.413-4.127Z" />
              <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 0 0 1.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0 0 15.75 7.5Z" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-text-primary tracking-tight">
            QuickChat
          </h1>
          <p className="text-sm text-text-muted mt-1">
            Enter a username to start chatting
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit}>
          <div className="space-y-4">
            <div>
              <input
                id="username-input"
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                placeholder="Choose a username..."
                maxLength={20}
                autoFocus
                className="w-full bg-dark-800 text-text-primary text-sm rounded-xl px-4 py-3
                           border border-dark-700 outline-none
                           placeholder:text-text-muted
                           focus:border-accent-500 transition-colors duration-200"
              />

              {/* Error message */}
              {error && (
                <p className="text-red-400 text-xs mt-2 px-1">
                  {error}
                </p>
              )}
            </div>

            <button
              id="join-button"
              type="submit"
              disabled={isLoading || !username.trim()}
              className="w-full bg-accent-500 hover:bg-accent-400 disabled:opacity-50
                         disabled:cursor-not-allowed text-white font-medium text-sm
                         py-3 rounded-xl transition-colors duration-200 cursor-pointer"
            >
              {isLoading ? 'Joining...' : 'Join Chat'}
            </button>
          </div>
        </form>
      </div>
    </div>
  )
}

export default UsernameScreen
