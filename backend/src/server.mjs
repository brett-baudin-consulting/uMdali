import express from 'express';
import cors from 'cors';
import passport from 'passport';
import LdapStrategy from 'passport-ldapauth';
import initDatabase from './initDatabase.mjs';
import { logger } from './logger.mjs';
import messageRoutes from './routes/messageRoutes.mjs';
import conversationRoutes from './routes/conversationRoutes.mjs';
import userRoutes from './routes/userRoutes.mjs';
import loginRoutes from './routes/loginRoutes.mjs';
import uploadRoutes from './routes/fileRoutes.mjs';
import dotenv from 'dotenv';
import errorHandler from './middlewares/errorHandler.mjs';
import ldapOpts from './config/ldapOpts.mjs';
import modelRoutes from './routes/modelRoutes.mjs';
import http from 'http';
import https from 'https';
import fs from 'fs'

dotenv.config();
const app = express();
const PORT = process.env.PORT || 3000; // Default value when PORT is not in env variable
const PROTOCOL = process.env.PROTOCOL || 'http'; // Default to 'http' if not specified

app.use(express.json());

const whitelist = process.env.WHITELIST ? process.env.WHITELIST.split(',') : [];
const corsOptions = {
  origin: function (origin, callback) {
    const isWhitelisted = whitelist.includes(origin);
    callback(null, whitelist.includes(origin)); //Instead of throwing an error, we just return false 
  }
}

app.use(cors(corsOptions));
if (process.env.DISABLE_AUTH !== 'true') {
  app.use(passport.initialize());
}

passport.use(new LdapStrategy(ldapOpts));

app.use((req, res, next) => {
  next();
});

app.use('/file', uploadRoutes);
app.use('/message', messageRoutes);
app.use('/login', loginRoutes);
app.use('/users', userRoutes);
app.use('/conversations', conversationRoutes);
app.use('/model', modelRoutes);
app.use('*', (req, res, next) => {
  const error = new Error('The route you tried does not exist');
  error.status = 404;
  next(error);
});

app.use(errorHandler); //Separate error-handler middleware

// Choose the server to run based on the PROTOCOL environment variable
if (PROTOCOL === 'https') {
  // Ensure the SSL_CERT_PATH and SSL_KEY_PATH are provided
  if (!process.env.SSL_CERT_PATH || !process.env.SSL_KEY_PATH) {
    logger.error('SSL_CERT_PATH and SSL_KEY_PATH must be set for HTTPS.');
    process.exit(1);
  }

  // Read the certificate and key files
  const sslOptions = {
    cert: fs.readFileSync(process.env.SSL_CERT_PATH),
    key: fs.readFileSync(process.env.SSL_KEY_PATH)
  };

  // Create an HTTPS server
  https.createServer(sslOptions, app).listen(PORT, '0.0.0.0', () => {
    logger.info(`HTTPS server running on port ${PORT}`);
  });
} else {
  // Create an HTTP server
  http.createServer(app).listen(PORT, '0.0.0.0', () => {
    logger.info(`HTTP server running on port ${PORT}`);
  });
}

initDatabase();

export default app;