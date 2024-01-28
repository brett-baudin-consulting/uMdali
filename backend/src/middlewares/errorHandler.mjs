import { logger } from '../logger.mjs';

export default function errorHandler(err, req, res, next) {
  logger.error(err.stack);
  if (!err.status) err.status = 500;
  res.status(err.status).send({ error: err.message });
}