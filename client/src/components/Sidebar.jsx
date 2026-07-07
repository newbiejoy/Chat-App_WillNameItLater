/*
  Sidebar component.
  Shows the app title, online user count, and a clickable user list.
  
  Props:
  - onlineUsers: Array of usernames currently online (from the server)
  - selectedUser: The username of the person we're chatting with (or null)
  - onSelectUser(username): Called when you click a user
  - currentUser: Our own username (so we can filter ourselves out)
  - unreadFrom: Set of usernames who have sent us unread messages
  - onLogout: Called when the user clicks the logout button
  
  The sidebar filters out our own username — you shouldn't see yourself
  in the list. It highlights the currently selected user and shows
  an unread indicator dot for users who've sent unread messages.
*/

function Sidebar({ onlineUsers, selectedUser, onSelectUser, currentUser, unreadFrom, onLogout }) {
  // Filter out ourselves from the online users list
  const otherUsers = onlineUsers.filter((user) => user !== currentUser)

  return (
    <aside className="w-72 bg-dark-900 border-r border-dark-700 flex flex-col h-full shrink-0">
      {/* App header with logout */}
      <div className="p-4 border-b border-dark-700 flex items-center justify-between">
        <div>
          <h1 className="text-xl font-bold text-text-primary tracking-tight">
            QuickChat
          </h1>
          <p className="text-xs text-text-muted mt-0.5">
            Logged in as <span className="text-accent-300">{currentUser}</span>
          </p>
        </div>
        <button
          id="logout-button"
          onClick={onLogout}
          title="Log out"
          className="text-text-muted hover:text-text-primary p-2 rounded-lg
                     hover:bg-dark-800 transition-colors duration-150 cursor-pointer"
        >
          {/* Logout icon */}
          <svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 20 20" fill="currentColor" className="w-4 h-4">
            <path fillRule="evenodd" d="M3 4.25A2.25 2.25 0 0 1 5.25 2h5.5A2.25 2.25 0 0 1 13 4.25v2a.75.75 0 0 1-1.5 0v-2a.75.75 0 0 0-.75-.75h-5.5a.75.75 0 0 0-.75.75v11.5c0 .414.336.75.75.75h5.5a.75.75 0 0 0 .75-.75v-2a.75.75 0 0 1 1.5 0v2A2.25 2.25 0 0 1 10.75 18h-5.5A2.25 2.25 0 0 1 3 15.75V4.25Z" clipRule="evenodd" />
            <path fillRule="evenodd" d="M19 10a.75.75 0 0 0-.75-.75H8.704l1.048-.943a.75.75 0 1 0-1.004-1.114l-2.5 2.25a.75.75 0 0 0 0 1.114l2.5 2.25a.75.75 0 1 0 1.004-1.114l-1.048-.943h9.546A.75.75 0 0 0 19 10Z" clipRule="evenodd" />
          </svg>
        </button>
      </div>

      {/* Online users section header */}
      <div className="p-3">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider px-2 mb-2">
          Online — {otherUsers.length}
        </p>
      </div>

      {/* User list */}
      <ul className="flex-1 overflow-y-auto px-2">
        {otherUsers.length === 0 ? (
          // Empty state — no other users online
          <li className="px-3 py-6 text-center">
            <p className="text-sm text-text-muted">No other users online</p>
            <p className="text-xs text-text-muted mt-1">
              Open another tab to test!
            </p>
          </li>
        ) : (
          otherUsers.map((user) => {
            const isSelected = user === selectedUser
            const hasUnread = unreadFrom.has(user)

            return (
              <li
                key={user}
                id={`user-${user}`}
                onClick={() => onSelectUser(user)}
                className={`flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer
                           transition-colors duration-150 relative
                           ${isSelected
                             ? 'bg-dark-800 border border-dark-700'
                             : 'hover:bg-dark-800 border border-transparent'
                           }`}
              >
                {/* Avatar circle with first letter */}
                <div className="w-10 h-10 rounded-full bg-accent-500 flex items-center justify-center
                                text-sm font-semibold text-white shrink-0 relative">
                  {user[0].toUpperCase()}

                  {/* Online dot on the avatar */}
                  <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-online
                                   rounded-full border-2 border-dark-900" />
                </div>

                {/* Username and status */}
                <div className="min-w-0 flex-1">
                  <p className="text-sm font-medium text-text-primary truncate">
                    {user}
                  </p>
                  <p className="text-xs text-online">online</p>
                </div>

                {/* Unread indicator dot */}
                {hasUnread && (
                  <span className="w-2.5 h-2.5 bg-accent-300 rounded-full shrink-0 animate-pulse" />
                )}
              </li>
            )
          })
        )}
      </ul>
    </aside>
  )
}

export default Sidebar
