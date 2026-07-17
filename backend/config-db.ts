import { MongoClient, Db } from 'mongodb';

let db: Db;
let client: MongoClient;

export async function connectDB(): Promise<Db> {
  try {
    const mongoUri = process.env.MONGODB_URI;
    if (!mongoUri) {
      throw new Error('MONGODB_URI environment variable is not set');
    }

    client = new MongoClient(mongoUri);
    await client.connect();
    db = client.db('video_calling');

    // Create indexes for better query performance
    await createIndexes(db);

    console.log('[DB] Connected to MongoDB successfully');
    return db;
  } catch (error) {
    console.error('[DB] Failed to connect to MongoDB:', error);
    throw error;
  }
}

async function createIndexes(db: Db) {
  try {
    // Users collection indexes
    await db.collection('users').createIndex({ email: 1 }, { unique: true });

    // Calls collection indexes
    await db.collection('calls').createIndex({ initiatorId: 1 });
    await db.collection('calls').createIndex({ receiverId: 1 });
    await db.collection('calls').createIndex({ createdAt: -1 });

    // Chat messages indexes
    await db.collection('chat_messages').createIndex({ senderId: 1 });
    await db.collection('chat_messages').createIndex({ receiverId: 1 });
    await db.collection('chat_messages').createIndex({ callId: 1 });
    await db.collection('chat_messages').createIndex({ timestamp: -1 });

    // Call history indexes
    await db.collection('call_history').createIndex({ userId: 1 });
    await db.collection('call_history').createIndex({ timestamp: -1 });

    console.log('[DB] Indexes created successfully');
  } catch (error) {
    console.error('[DB] Error creating indexes:', error);
  }
}

export function getDB(): Db {
  if (!db) {
    throw new Error('Database not initialized. Call connectDB first.');
  }
  return db;
}

export async function closeDB() {
  if (client) {
    await client.close();
    console.log('[DB] Disconnected from MongoDB');
  }
}
