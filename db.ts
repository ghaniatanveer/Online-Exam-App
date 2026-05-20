import mongoose from 'mongoose';
import { env } from './env.js';

let memoryServer: { stop: () => Promise<boolean> } | null = null;

export async function connectDB(): Promise<void> {
  try {
    let uri = env.MONGODB_URI;

    if (env.USE_MEMORY_DB) {
      const { MongoMemoryServer } = await import('mongodb-memory-server');
      const server = await MongoMemoryServer.create();
      memoryServer = server;
      uri = server.getUri();
      console.log('Using in-memory MongoDB (no local install required)');
    }

    await mongoose.connect(uri);
    console.log('MongoDB connected');
  } catch (error) {
    console.error('MongoDB connection error:', error);
    process.exit(1);
  }
}

export async function disconnectDB(): Promise<void> {
  await mongoose.disconnect();
  if (memoryServer) {
    await memoryServer.stop();
    memoryServer = null;
  }
}
