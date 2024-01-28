import { createLogger, format as _format, transports as _transports } from 'winston';

const logger = createLogger({
  level: 'info',
  format: _format.combine(
    _format.timestamp({
      format: 'YYYY-MM-DD HH:mm:ss'
    }),
    _format.json()
  ),
  defaultMeta: { service: 'user-service' },
  transports: [
    new _transports.File({ filename: process.env.ERROR_LOG_LOCATION || 'error.log', level: 'error' }),
    new _transports.File({ filename: process.env.COMBINED_LOG_LOCATION || 'combined.log' }),
  ],
});

if (process.env.NODE_ENV !== 'production') {
  logger.add(new _transports.Console({
    format: _format.combine(
      _format.timestamp({
        format: 'YYYY-MM-DD HH:mm:ss'
      }),
      _format.simple()
    ),
  }));
}

export { logger };