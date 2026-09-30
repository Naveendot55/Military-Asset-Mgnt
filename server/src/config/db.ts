import mongoose from 'mongoose';
import dotenv from 'dotenv';

dotenv.config();

const MONGO_URI = process.env.DATABASE_URL || 'mongodb://127.0.0.1:27017/military_assets';

export const connectDB = async () => {
  try {
    await mongoose.connect(MONGO_URI);
    console.log(`Connected to MongoDB at ${MONGO_URI}`);
  } catch (error) {
    console.error('MongoDB connection error:', error);
  }
};

export default mongoose;
