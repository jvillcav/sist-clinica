import mongoose from 'mongoose';
import { config } from './env.js';

const conectarDB = async () => {
  mongoose.set('strictQuery', true);
  await mongoose.connect(config.mongoUri, {
    serverSelectionTimeoutMS: 10000
  });
  console.log('MongoDB conectado');
  return mongoose.connection;
};

export default conectarDB;
