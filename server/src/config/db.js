import mongoose from 'mongoose';
import env from './env.js';
import logger from './logger.js';

mongoose.set('strictQuery', true);

/** Connect to MongoDB with sane retry/backoff. */
export async function connectDB() {
  const uri = env.mongoUri;
  if (!uri) throw new Error('MONGODB_URI is not set');

  mongoose.connection.on('connected', () => logger.info('🗄️  MongoDB connected'));
  mongoose.connection.on('error', (err) => logger.error('MongoDB error:', err.message));
  mongoose.connection.on('disconnected', () => logger.warn('MongoDB disconnected'));

  await mongoose.connect(uri, {
    serverSelectionTimeoutMS: 10000,
    autoIndex: !env.isProd, // build indexes automatically in dev only
  });

  return mongoose.connection;
}

export async function disconnectDB() {
  await mongoose.connection.close();
}
