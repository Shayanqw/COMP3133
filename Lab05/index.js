import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';
import mongoose from 'mongoose';
import { ApolloServer } from '@apollo/server';
import { expressMiddleware } from '@as-integrations/express5';

import movieSchema from './schemas/schema.js';
import movieResolvers from './resolvers/resolvers.js';

// Load environment variables
dotenv.config();

const app = express();

// ✅ Connect to MongoDB using single MONGO_URI
const connectDB = async () => {
  try {
    await mongoose.connect(process.env.MONGO_URI);
    console.log('Connected to MongoDB Atlas');
  } catch (error) {
    console.error('MongoDB connection error:', error.message);
    process.exit(1);
  }
};

async function startServer() {

  const server = new ApolloServer({
    typeDefs: movieSchema,
    resolvers: movieResolvers
  });

  await server.start();

  app.use(
    '/graphql',
    cors(),
    express.json(),
    expressMiddleware(server)
  );

  const PORT = process.env.PORT || 4000;

  app.listen(PORT, async () => {
    console.log(`🚀 Server ready at http://localhost:${PORT}/graphql`);
    await connectDB();
  });
}

startServer();