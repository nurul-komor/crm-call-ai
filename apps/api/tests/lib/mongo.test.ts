import { describe, it, expect, afterAll, beforeAll } from 'vitest';
import { MongoMemoryServer } from 'mongodb-memory-server';
import mongoose from 'mongoose';

import { connectMongo, disconnectMongo } from '../../src/lib/mongo.js';

let mongod: MongoMemoryServer;

beforeAll(async () => {
  mongod = await MongoMemoryServer.create();
});

afterAll(async () => {
  await disconnectMongo();
  await mongod.stop();
});

describe('connectMongo', () => {
  it('connects to a given URI and reaches ready state', async () => {
    await connectMongo(mongod.getUri());
    expect(mongoose.connection.readyState).toBe(1);
  });
});
