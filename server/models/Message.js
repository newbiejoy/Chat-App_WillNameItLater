

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
    default: ''
  },
  time: {
    type: String,
    required: true
  },
  /*
    Optional file attachment.
    Only present when the message includes an uploaded file.
    - url: public URL to access the file (e.g., http://localhost:5000/uploads/abc.png)
    - name: original filename (e.g., "photo.jpg")
    - type: MIME type (e.g., "image/jpeg", "application/pdf")
  */
  file: {
    url: String,
    name: String,
    type: String
  },
  createdAt: {
    type: Date,
    default: Date.now
  }
})


messageSchema.index({ from: 1, to: 1 })
messageSchema.index({ to: 1 })

const Message = mongoose.model('Message', messageSchema)

module.exports = Message
