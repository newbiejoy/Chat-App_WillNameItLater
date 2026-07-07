/*
  Socket.IO client instance.
  
  We create ONE socket connection and export it.
  Every component that needs to talk to the server imports this same socket.
  
  Why a separate file?
  - So we don't accidentally create multiple connections
  - Any component can import { socket } from '../socket' and use it
  
  autoConnect: false
  - We don't connect immediately when the app loads
  - Instead, we connect manually after the user enters a username
  - This prevents anonymous socket connections
*/

import { io } from 'socket.io-client'

export const socket = io('http://localhost:5000', {
  autoConnect: false
})
