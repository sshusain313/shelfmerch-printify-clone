import mongoose from 'mongoose';

export const connectDB = async (): Promise<void> => {
  try {
    const mongoUrl = process.env.MONGO_URL;
    const dbName = process.env.DB_NAME;
    
    if (!mongoUrl) {
      throw new Error('MONGO_URL environment variable is not set');
    }
    
    const connectionString = dbName ? `${mongoUrl}/${dbName}` : mongoUrl;
    
    await mongoose.connect(connectionString);
    console.log('MongoDB connected successfully');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
};

