import mongoose from 'mongoose'

export const connectMongoDB = async () => {
  const uri = process.env.MONGODB_URI || 'mongodb://localhost:27017/rbi_compliance'
  await mongoose.connect(uri)
}