import { logger } from "../logger.mjs";

export const errorHandler = (err, req, res, next) => {
  logger.error(`Error processing ${req.method} ${req.url}: ${err.message}`);
  logger.error(err.stack);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    errors: err.errors || null,
    ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
  });
};  