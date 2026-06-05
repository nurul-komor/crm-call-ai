import { MongoMemoryReplSet } from 'mongodb-memory-server';

import { connectMongo, disconnectMongo } from '../src/lib/mongo.js';

let rs: MongoMemoryReplSet | undefined;

/** Start a single-node replica set so mongoose transactions work. */
export async function startInMemoryReplSet(): Promise<string> {
  rs = await MongoMemoryReplSet.create({ replSet: { count: 1 } });
  const uri = rs.getUri();
  await connectMongo(uri);
  return uri;
}

export async function stopInMemoryReplSet(): Promise<void> {
  await disconnectMongo();
  if (rs) {
    await rs.stop();
    rs = undefined;
  }
}
