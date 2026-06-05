import mongoose from 'mongoose';

import { env } from './config.js';
import { log } from './logger.js';

let connected = false;

export async function connect(): Promise<void> {
  if (connected) return;
  mongoose.set('strictQuery', true);
  await mongoose.connect(env().MONGO_URI, { serverSelectionTimeoutMS: 10_000 });
  connected = true;
  log().info({ db: mongoose.connection.name }, 'mongo connected');
}

export async function disconnect(): Promise<void> {
  if (!connected) return;
  await mongoose.disconnect();
  connected = false;
}
