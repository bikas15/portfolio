import mongoose from 'mongoose'

const contactMessageSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100
    },
    email: {
      type: String,
      required: true,
      trim: true,
      lowercase: true,
      maxlength: 254
    },
    phone: {
      type: String,
      trim: true,
      maxlength: 30,
      default: ''
    },
    message: {
      type: String,
      required: true,
      trim: true,
      maxlength: 5000
    }
  },
  { timestamps: true }
)

export default mongoose.model('ContactMessage', contactMessageSchema, 'contactMessages')
