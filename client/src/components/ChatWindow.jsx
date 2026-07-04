/*
  ChatWindow component.
  Shows the chat area: header, messages, and input bar.
  
  For now, everything is static placeholder content.
  Real messaging will be wired up on Day 4-5.
*/

// Placeholder messages to preview the layout
const placeholderMessages = [
  { id: 1, sender: 'Alice', text: 'Hey! How are you?', time: '7:30 PM', isOwn: false },
  { id: 2, sender: 'You', text: "I'm doing great, thanks! Working on the chat app.", time: '7:31 PM', isOwn: true },
  { id: 3, sender: 'Alice', text: 'That sounds awesome! Can I see it?', time: '7:32 PM', isOwn: false },
  { id: 4, sender: 'You', text: "Sure, I'll share the link once it's deployed 🚀", time: '7:33 PM', isOwn: true },
]

function ChatWindow() {
  return (
    <main className="flex-1 flex flex-col bg-dark-950 h-full">
      {/* Chat header - shows who you're chatting with */}
      <div className="px-5 py-3 bg-dark-900 border-b border-dark-700 flex items-center gap-3">
        <div className="w-9 h-9 rounded-full bg-accent-500 flex items-center justify-center
                        text-sm font-semibold text-white">
          A
        </div>
        <div>
          <p className="text-sm font-semibold text-text-primary">Alice</p>
          <p className="text-xs text-online">online</p>
        </div>
      </div>

      {/* Messages area */}
      <div className="flex-1 overflow-y-auto px-5 py-4 space-y-3">
        {placeholderMessages.map((msg) => (
          <div
            key={msg.id}
            className={`flex ${msg.isOwn ? 'justify-end' : 'justify-start'}`}
          >
            <div
              className={`max-w-sm px-4 py-2 rounded-2xl ${
                msg.isOwn
                  ? 'bg-bubble-own rounded-br-sm'
                  : 'bg-bubble-other rounded-bl-sm'
              }`}
            >
              {/* Show sender name for messages from others */}
              {!msg.isOwn && (
                <p className="text-xs font-semibold text-accent-300 mb-1">
                  {msg.sender}
                </p>
              )}
              <p className="text-sm text-text-primary leading-relaxed">
                {msg.text}
              </p>
              <p className={`text-[10px] mt-1 ${
                msg.isOwn ? 'text-text-secondary text-right' : 'text-text-muted'
              }`}>
                {msg.time}
              </p>
            </div>
          </div>
        ))}
      </div>

      {/* Message input bar */}
      <div className="px-4 py-3 bg-dark-900 border-t border-dark-700">
        <div className="flex items-center gap-3">
          <input
            type="text"
            placeholder="Write a message..."
            className="flex-1 bg-dark-800 text-text-primary text-sm rounded-xl px-4 py-3
                       border border-dark-700 outline-none
                       placeholder:text-text-muted
                       focus:border-accent-500 transition-colors duration-200"
          />
          <button
            className="bg-accent-500 hover:bg-accent-400 text-white p-3 rounded-xl
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
