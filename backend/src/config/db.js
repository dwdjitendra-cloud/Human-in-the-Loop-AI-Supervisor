import mongoose from 'mongoose';
import { logger } from '../utils/logger.js';

export const connectDB = async () => {
  try {
    const mongoUri = process.env.MONGO_URI || 'mongodb://localhost:27017/human-in-loop-ai';
    await mongoose.connect(mongoUri);
    logger.info('MongoDB connected successfully');
  } catch (error) {
    logger.error('MongoDB connection error:', error.message);
    if (process.env.ALLOW_NO_DB === '1' || process.env.NODE_ENV === 'development') {
      logger.warn('Proceeding without MongoDB connection (dev mode or ALLOW_NO_DB=1). Some routes will be unavailable.');
      return; // do not exit
    }
    process.exit(1);
  }
};
