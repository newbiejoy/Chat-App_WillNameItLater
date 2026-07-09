/*
  Message model (Mongoose schema).
  
  Every message — whether private or global — is saved to this collection.
  
  Fields:
  - from: The username of the sender
  - to: The recipient username, OR "__global__" for global chat messages
  - text: The message content
  - time: Formatted time string (e.g., "2:30 PM") for display
  - createdAt: Actual Date object, used for sorting and querying
  
  We index on { from, to } and { to } to make history lookups fast.
*/

const mongoose = require('mongoose')

const messageSchema = new mongoose.Schema({
  from: {
    type: String,
    required: true
  },
  to: {
    type: String,
    required: true
  },
  text: {
    type: String,
    required: true
  },
  time: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})

/*
  Compound index for private message history lookups.
  When we want to find all messages between Alice and Bob,
  we query: { from: "Alice", to: "Bob" } OR { from: "Bob", to: "Alice" }
  This index makes those queries fast.
*/
messageSchema.index({ from: 1, to: 1 })
messageSchema.index({ to: 1 })

const Message = mongoose.model('Message', messageSchema)

module.exports = Message
