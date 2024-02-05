import Redis from 'ioredis';
import dotenv from 'dotenv';
import rateLimit from 'express-rate-limit';
import { RateLimiterRedis, RateLimiterRes } from 'rate-limiter-flexible';
import Joi from 'joi';

import { logger } from '../logger.mjs';

dotenv.config();

const envVarsSchema = Joi.object({
  USE_REDIS: Joi.boolean().default(false),
  REDIS_HOST: Joi.string().when('USE_REDIS', { is: true, then: Joi.required() }),
  REDIS_PORT: Joi.number().default(6379),
  REDIS_PASSWORD: Joi.string().allow('').optional(),
  BASIC_LIMIT_WINDOW_MS: Joi.number().default(900000),
  BASIC_LIMIT_MAX_REQUESTS: Joi.number().default(100),
  ADVANCED_LIMIT_POINTS: Joi.number().default(5),
  ADVANCED_LIMIT_DURATION: Joi.number().default(60),
}).unknown().required();

const { value: envVars, error } = envVarsSchema.validate(process.env);
if (error) {
  logger.error(`Config validation error: ${error.message}`);
  throw new Error(`Config validation error: ${error.message}`);
}

const {
  USE_REDIS, REDIS_HOST, REDIS_PORT, REDIS_PASSWORD,
  BASIC_LIMIT_WINDOW_MS, BASIC_LIMIT_MAX_REQUESTS,
  ADVANCED_LIMIT_POINTS, ADVANCED_LIMIT_DURATION,
} = envVars;

let redisClient, rateLimiter;
if (USE_REDIS) {
  const redisOptions = {
    host: REDIS_HOST,
    port: REDIS_PORT,
    retryStrategy: times => Math.min(times * 50, 2000),
  };
  if (REDIS_PASSWORD) redisOptions.password = REDIS_PASSWORD;

  redisClient = new Redis(redisOptions);

  rateLimiter = new RateLimiterRedis({
    storeClient: redisClient,
    points: ADVANCED_LIMIT_POINTS,
    duration: ADVANCED_LIMIT_DURATION,
    execEvenly: false,
    keyPrefix: 'rateLimiter',
  });
}

const basicLimiter = rateLimit({
  windowMs: BASIC_LIMIT_WINDOW_MS,
  max: BASIC_LIMIT_MAX_REQUESTS,
});

const rateLimiterMiddleware = async (req, res, next) => {
  if (!USE_REDIS) {
    return next();
  }

  try {
    await rateLimiter.consume(req.ip);
    next();
  } catch (rejRes) {
    if (rejRes instanceof RateLimiterRes) {
      res.status(429).send('Too Many Requests');
    } else {
      logger.error('RateLimiter error:', rejRes);
      res.status(500).send('Internal Server Error');
    }
  }
};

export { basicLimiter, rateLimiterMiddleware };