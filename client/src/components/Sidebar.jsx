/*
  Sidebar component.
  Shows the app title and a list of online users.
  
  For now, we use hardcoded placeholder users just to see the layout.
  These will be replaced with real online users on Day 3-4.
*/

// Hardcoded users for layout preview only
const placeholderUsers = ['Alice', 'Bob', 'Charlie', 'Diana']

function Sidebar() {
  return (
    <aside className="w-72 bg-dark-900 border-r border-dark-700 flex flex-col h-full">
      {/* App header */}
      <div className="p-4 border-b border-dark-700">
        <h1 className="text-xl font-bold text-text-primary tracking-tight">
          QuickChat
        </h1>
      </div>

      {/* Online users section */}
      <div className="p-3">
        <p className="text-xs font-semibold text-text-muted uppercase tracking-wider px-2 mb-2">
          Online Users
        </p>
      </div>

      {/* User list */}
      <ul className="flex-1 overflow-y-auto px-2">
        {placeholderUsers.map((user) => (
          <li
            key={user}
            className="flex items-center gap-3 px-3 py-3 rounded-lg cursor-pointer
                       hover:bg-dark-800 transition-colors duration-150"
          >
            {/* Avatar circle with first letter */}
            <div className="w-10 h-10 rounded-full bg-accent-500 flex items-center justify-center
                            text-sm font-semibold text-white shrink-0">
              {user[0]}
            </div>

            {/* Username and status */}
            <div className="min-w-0">
              <p className="text-sm font-medium text-text-primary truncate">
                {user}
              </p>
              <p className="text-xs text-online">online</p>
            </div>
          </li>
        ))}
      </ul>
    </aside>
  )
}

export default Sidebar
