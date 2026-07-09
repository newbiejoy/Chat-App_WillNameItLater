/*
  ChatWindow component.
  Shows messages and the input bar for sending messages.
*/

import { useState, useEffect, useRef } from 'react'

function ChatWindow({ selectedUser, messages, onSendMessage, currentUser, isGlobal, loadingHistory }) {
  const [inputText, setInputText] = useState('')
  const messagesEndRef = useRef(null)

  // Auto-scroll to bottom when new messages come in
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' })
  }, [messages])

  function handleSend() {
    if (!inputText.trim()) return
    onSendMessage(inputText)
    setInputText('')
  }

  function handleKeyDown(e) {
    if (e.key === 'Enter') {
      e.preventDefault()
      handleSend()
    }
  }

  // No user selected — show empty state
  if (!selectedUser) {
    return (
      <main className="flex-1 flex items-center justify-center bg-dark-950">
        <div className="text-center text-text-muted">
          <p className="text-3xl mb-2">💬</p>
          <p className="text-sm">Select a chat to start messaging</p>
        </div>
      </main>
    )
  }

  const displayName = isGlobal ? '🌍 Global Chat' : selectedUser

  return (
    <main className="flex-1 flex flex-col bg-dark-950 h-full">
      {/* Chat header */}
      <div className="px-5 py-3 bg-dark-900 border-b border-dark-700 flex items-center gap-3">
        {!isGlobal && (
          <div className="w-8 h-8 rounded-full bg-accent-500 flex items-center justify-center
                          text-xs font-bold text-white">
            {selectedUser[0].toUpperCase()}
          </div>
        )}
        <p className="text-sm font-semibold text-text-primary">{displayName}</p>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-2">
        {loadingHistory && (
          <p className="text-center text-xs text-text-muted py-2">Loading messages...</p>
        )}

        {!loadingHistory && messages.length === 0 && (
          <p className="text-center text-sm text-text-muted mt-8">
            No messages yet. Say hi! 👋
          </p>
        )}

        {messages.map((msg, index) => {
          const isOwn = msg.from === currentUser

          return (
            <div
              key={index}
              className={`flex ${isOwn ? 'justify-end' : 'justify-start'}`}
            >
              <div
                className={`max-w-xs px-3 py-2 rounded-lg text-sm ${
                  isOwn
                    ? 'bg-bubble-own'
                    : 'bg-bubble-other'
                }`}
              >
                {/* Show sender name in global chat or for other people's messages */}
                {(isGlobal || !isOwn) && (
                  <p className="text-xs font-semibold text-accent-300 mb-0.5">
                    {isOwn ? 'You' : msg.from}
                  </p>
                )}
                <p className="text-text-primary">{msg.text}</p>
                <p className="text-[10px] text-text-muted mt-0.5 text-right">{msg.time}</p>
              </div>
            </div>
          )
        })}

        <div ref={messagesEndRef} />
      </div>

      {/* Input bar */}
      <div className="px-4 py-3 bg-dark-900 border-t border-dark-700">
        <div className="flex gap-2">
          <input
            id="message-input"
            type="text"
            value={inputText}
            onChange={(e) => setInputText(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Type a message..."
            className="flex-1 bg-dark-800 text-text-primary text-sm rounded-lg px-4 py-2.5
                       border border-dark-700 outline-none placeholder:text-text-muted
                       focus:border-accent-500 transition-colors"
          />
          <button
            id="send-button"
            onClick={handleSend}
            disabled={!inputText.trim()}
            className="bg-accent-500 hover:bg-accent-400 disabled:opacity-50
                       text-white text-sm px-4 py-2.5 rounded-lg
                       transition-colors cursor-pointer"
          >
            Send
          </button>
        </div>
      </div>
    </main>
  )
}

export default ChatWindow
