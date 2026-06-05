import mongoose from 'mongoose';

import { env } from '../config/env.js';
import { logger } from './logger.js';

let connected = false;

export async function connectMongo(uri = env().MONGO_URI): Promise<typeof mongoose> {
  if (connected) return mongoose;
  mongoose.set('strictQuery', true);
  await mongoose.connect(uri, {
    autoIndex: env().NODE_ENV !== 'production',
    serverSelectionTimeoutMS: 10_000,
  });
  connected = true;
  logger().info({ host: mongoose.connection.host, db: mongoose.connection.name }, 'mongo connected');
  return mongoose;
}

export async function disconnectMongo(): Promise<void> {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
}

export function mongoConnection() {
  return mongoose.connection;
}
