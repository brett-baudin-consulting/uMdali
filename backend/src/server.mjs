// Import necessary modules
import express from 'express';
import cors from 'cors';
import passport from 'passport';
import LdapStrategy from 'passport-ldapauth';
import dotenv from 'dotenv';
import fs from 'fs';
import http from 'http';
import https from 'https';

// Custom modules and routes
import initDatabase from './initDatabase.mjs';
import { logger } from './logger.mjs';
import errorHandler from './middlewares/errorHandler.mjs';
import ldapOpts from './config/ldapOpts.mjs';
import userRoutes from './routes/userRoutes.mjs';
import messageRoutes from './routes/messageRoutes.mjs';
import conversationRoutes from './routes/conversationRoutes.mjs';
import loginRoutes from './routes/loginRoutes.mjs';
import uploadRoutes from './routes/fileRoutes.mjs';
import modelRoutes from './routes/modelRoutes.mjs';
import { basicLimiter } from './rateLimit/rateLimitConfig.mjs';

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000;
const PROTOCOL = process.env.PROTOCOL || 'http';
const USE_BASIC_LIMITER = process.env.USE_BASIC_LIMITER === 'true';
let redisClient;

if (USE_BASIC_LIMITER) {
  // Apply basic rate limiting middleware
  app.use(basicLimiter);
}

app.use(express.json());
app.use(cors());

// Passport and authentication setup
if (process.env.DISABLE_AUTH !== 'true') {
  app.use(passport.initialize());
  passport.use(new LdapStrategy(ldapOpts));
}

// Route definitions, with per-user rate limiting applied as needed
app.use('/file', uploadRoutes);
app.use('/message', messageRoutes);
app.use('/login', loginRoutes);
app.use('/users', userRoutes); // Applying per-user rate limiter here
app.use('/conversations', conversationRoutes);
app.use('/model', modelRoutes);

// Error handling and 404
app.use('*', (req, res, next) => {
  const error = new Error('The route you tried does not exist');
  error.status = 404;
  next(error);
});
app.use(errorHandler);

// Server setup based on protocol
if (PROTOCOL === 'https') {
  if (!process.env.SSL_CERT_PATH || !process.env.SSL_KEY_PATH) {
    logger.error('SSL_CERT_PATH and SSL_KEY_PATH must be set for HTTPS.');
    process.exit(1);
  }
  const sslOptions = {
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
    key: fs.readFileSync(process.env.SSL_KEY_PATH),
  };
  https.createServer(sslOptions, app).listen(PORT, '0.0.0.0', () => {
    logger.info(`HTTPS server running on port ${PORT}`);
  });
} else {
  http.createServer(app).listen(PORT, '0.0.0.0', () => {
    logger.info(`HTTP server running on port ${PORT}`);
  });
}

initDatabase();

export default app;