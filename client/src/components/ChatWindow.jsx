/*
  ChatWindow component.
  Shows the chat area: header, messages, and input bar.

  Props:
  - selectedUser: The username of the person we're chatting with (or null)
  - messages: Array of message objects for this conversation
  - onSendMessage(text): Called when the user sends a message
  - currentUser: Our own username (to determine which messages are "ours")

  Each message object looks like: { from, to, text, time }

  Features:
  - Auto-scrolls to the bottom when new messages arrive
  - Shows an empty state when no user is selected
  - Input clears after sending
  - Send on Enter key or button click
*/

import { useState, useEffect, useRef } from 'react'

function ChatWindow({ selectedUser, messages, onSendMessage, currentUser }) {
  // The text in the message input
  const [inputText, setInputText] = useState('')

  // Ref to the messages container — used for auto-scrolling
  const messagesEndRef = useRef(null)

  // Ref to the input field — used for auto-focusing
  const inputRef = useRef(null)

  /*
    Auto-scroll to the bottom whenever messages change.
    This ensures the newest message is always visible.
  */
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  /*
    Focus the input field when the selected user changes.
    So you can start typing immediately after clicking a user.
  */
  useEffect(() => {
    if (selectedUser) {
      inputRef.current?.focus()
    }
  }, [selectedUser])

  /**
   * Handle sending a message.
   * Clears the input and calls the parent's onSendMessage.
   */
  function handleSend() {
    if (!inputText.trim()) return

    onSendMessage(inputText)
    setInputText('')
  }

  /**
   * Handle keyboard events in the input.
   * Send message on Enter (without Shift for multiline later).
   */
  function handleKeyDown(e) {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
  }

  // ===== Empty State: No user selected =====
  if (!selectedUser) {
    return (
      <main className="flex-1 flex flex-col items-center justify-center bg-dark-950 h-full">
        <div className="text-center">
          <div className="w-20 h-20 bg-dark-800 rounded-2xl flex items-center justify-center mx-auto mb-4">
            <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 24 24" fill="currentColor"
                 className="w-10 h-10 text-text-muted">
              <path d="M4.913 2.658c2.075-.27 4.19-.408 6.337-.408 2.147 0 4.262.139 6.337.408 1.922.25 3.291 1.861 3.405 3.727a4.403 4.403 0 0 0-1.032-.211 50.89 50.89 0 0 0-8.42 0c-2.358.196-4.04 2.19-4.04 4.434v4.286a4.47 4.47 0 0 0 2.433 3.984L7.28 21.53A.75.75 0 0 1 6 20.97V18.03a48.527 48.527 0 0 1-1.087-.128C2.905 17.58 1.5 15.833 1.5 13.773V6.385c0-2.06 1.405-3.813 3.413-4.127Z" />
              <path d="M15.75 7.5c-1.376 0-2.739.057-4.086.169C10.124 7.797 9 9.103 9 10.609v4.285c0 1.507 1.128 2.814 2.67 2.94 1.243.102 2.5.157 3.768.165l2.782 2.781a.75.75 0 0 0 1.28-.53v-2.39l.33-.026c1.542-.125 2.67-1.433 2.67-2.94v-4.286c0-1.505-1.125-2.811-2.664-2.94A49.392 49.392 0 0 0 15.75 7.5Z" />
            </svg>
          </div>
          <h2 className="text-lg font-semibold text-text-primary mb-1">
            Select a conversation
          </h2>
          <p className="text-sm text-text-muted">
            Click on a user in the sidebar to start chatting
          </p>
        </div>
      </main>
    )
  }

  // ===== Main Chat View =====
  return (
    <main className="flex-1 flex flex-col bg-dark-950 h-full">
      {/* Chat header - shows who you're chatting with */}
      <div className="px-5 py-3 bg-dark-900 border-b border-dark-700 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-accent-500 flex items-center justify-center
                        text-sm font-semibold text-white relative">
          {selectedUser[0].toUpperCase()}
          <span className="absolute -bottom-0.5 -right-0.5 w-2.5 h-2.5 bg-online
                           rounded-full border-2 border-dark-900" />
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">{selectedUser}</p>
          <p className="text-xs text-online">online</p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {messages.length === 0 ? (
          // No messages yet in this conversation
          <div className="flex items-center justify-center h-full">
            <p className="text-sm text-text-muted">
              No messages yet. Say hello! 👋
            </p>
          </div>
        ) : (
          messages.map((msg, index) => {
            const isOwn = msg.from === currentUser

            return (
              <div
                key={index}
                className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
              >
                <div
                  className={`max-w-sm px-4 py-2 rounded-2xl ${
                    isOwn
                      ? 'bg-bubble-own rounded-br-sm'
                      : 'bg-bubble-other rounded-bl-sm'
                  }`}
                >
                  {/* Show sender name for messages from others */}
                  {!isOwn && (
                    <p className="text-xs font-semibold text-accent-300 mb-1">
                      {msg.from}
                    </p>
                  )}
                  <p className="text-sm text-text-primary leading-relaxed">
                    {msg.text}
                  </p>
                  <p className={`text-[10px] mt-1 ${
                    isOwn ? 'text-text-secondary text-right' : 'text-text-muted'
                  }`}>
                    {msg.time}
                  </p>
                </div>
              </div>
            )
          })
        )}

        {/* Invisible element at the bottom — we scroll to this */}
        <div ref={messagesEndRef} />
      </div>

      {/* Message input bar */}
      <div className="px-4 py-3 bg-dark-900 border-t border-dark-700">
        <div className="flex items-center gap-3">
          <input
            id="message-input"
            ref={inputRef}
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder={`Message ${selectedUser}...`}
            className="flex-1 bg-dark-800 text-text-primary text-sm rounded-xl px-4 py-3
                       border border-dark-700 outline-none
                       placeholder:text-text-muted
                       focus:border-accent-500 transition-colors duration-200"
          />
          <button
            id="send-button"
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="bg-accent-500 hover:bg-accent-400 disabled:opacity-50
                       disabled:cursor-not-allowed text-white p-3 rounded-xl
                       transition-colors duration-200 cursor-pointer shrink-0"
          >
            {/* Send icon (SVG arrow) */}
            <svg
              xmlns="http://www.w3.org/2000/svg"
              viewBox="0 0 24 24"
              fill="currentColor"
              className="w-5 h-5"
            >
              <path d="M3.478 2.404a.75.75 0 0 0-.926.941l2.432 7.905H13.5a.75.75 0 0 1 0 1.5H4.984l-2.432 7.905a.75.75 0 0 0 .926.94 60.519 60.519 0 0 0 18.445-8.986.75.75 0 0 0 0-1.218A60.517 60.517 0 0 0 3.478 2.404Z" />
            </svg>
          </button>
        </div>
      </div>
    </main>
  )
}

export default ChatWindow
