const winston = require('winston');
const Sentry = require('@sentry/node');

const logger = winston.createLogger({
    level: process.env.LOG_LEVEL || 'info',
    format: winston.format.combine(
        winston.format.timestamp(),
        process.env.NODE_ENV === 'production' ? winston.format.json() : winston.format.simple()
    ),
    transports: [
        new winston.transports.Console(),
    ],
});

// Custom transport or hook for Sentry could be added here if needed,
// but Sentry SDK usually captures unhandled exceptions automatically.
// We can also explicitly send errors to Sentry when logging 'error' level.
// For now, we'll keep it simple and rely on Sentry's automatic capture + manual calls if needed.

module.exports = logger;
