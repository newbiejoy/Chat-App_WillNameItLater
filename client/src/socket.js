/*
  Socket.IO client instance.
  
  Uses VITE_SERVER_URL env variable for the server address.
  - In development: http://localhost:5000 (set in .env)
  - In production: your deployed server URL (set in Vercel dashboard)
*/

import { io } from 'socket.io-client'

const SERVER_URL = import.meta.env.VITE_SERVER_URL || 'http://localhost:5000'

export const socket = io(SERVER_URL, {
  autoConnect: false
})
