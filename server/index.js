/*
  Server entry point.
  
  For Day 1, this is a minimal Express server that just starts up
  and confirms it's running. We'll add Socket.IO and routes later.
  
  Express is a lightweight web framework for Node.js.
  It handles HTTP requests and will serve as the backbone of our backend.
*/

const express = require('express')

const app = express()
const PORT = 5000

app.get('/', (req, res) => {
  res.json({ message: 'QuickChat server is running' })
})

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`)
})
