import Sidebar from './components/Sidebar'
import ChatWindow from './components/ChatWindow'

/*
  App is the root layout component.
  It places the Sidebar and ChatWindow side by side using flexbox.
  
  Layout:
  ┌──────────┬────────────────────────┐
  │          │                        │
  │ Sidebar  │     ChatWindow         │
  │ (users)  │     (messages)         │
  │          │                        │
  └──────────┴────────────────────────┘
*/
function App() {
  return (
    <div className="flex h-screen">
      <Sidebar />
      <ChatWindow />
    </div>
  )
}

export default App
