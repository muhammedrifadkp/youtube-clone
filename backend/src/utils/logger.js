const winston = require('winston');
const path = require('path');
const fs = require('fs');

// Create logs directory if it doesn't exist
const logsDir = path.join(__dirname, '../../logs');
if (!fs.existsSync(logsDir)) {
  fs.mkdirSync(logsDir, { recursive: true });
}

// Define log levels
const levels = {
  error: 0,
  warn: 1,
  info: 2,
  http: 3,
  debug: 4
};

// Define colors for each level
const colors = {
  error: 'red',
  warn: 'yellow',
  info: 'green',
  http: 'magenta',
  debug: 'white'
};

// Tell winston that you want to link the colors
winston.addColors(colors);

// Define format for logs
const format = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.colorize({ all: true }),
  winston.format.printf(
    (info) => `${info.timestamp} ${info.level}: ${info.message}`
  )
);

// Define format for file logs (without colors)
const fileFormat = winston.format.combine(
  winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss:ms' }),
  winston.format.errors({ stack: true }),
  winston.format.json()
);

// Define which transports the logger must use
const transports = [
  // Console transport
  new winston.transports.Console({
    level: process.env.LOG_LEVEL || 'info',
    format: format
  }),
  
  // File transport for errors
  new winston.transports.File({
    filename: path.join(logsDir, 'error.log'),
    level: 'error',
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  }),
  
  // File transport for all logs
  new winston.transports.File({
    filename: path.join(logsDir, 'combined.log'),
    format: fileFormat,
    maxsize: 5242880, // 5MB
    maxFiles: 5
  })
];

// Create the logger
const logger = winston.createLogger({
  level: process.env.LOG_LEVEL || 'info',
  levels,
  format: fileFormat,
  transports,
  exitOnError: false
});

// Create a stream object for Morgan HTTP logging
logger.stream = {
  write: (message) => {
    logger.http(message.trim());
  }
};

// Add request logging helper
logger.logRequest = (req, res, next) => {
  const start = Date.now();
  
  res.on('finish', () => {
    const duration = Date.now() - start;
    const logData = {
      method: req.method,
      url: req.url,
      status: res.statusCode,
      duration: `${duration}ms`,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || 'Unknown'
    };
    
    if (res.statusCode >= 400) {
      logger.warn('HTTP Request', logData);
    } else {
      logger.http('HTTP Request', logData);
    }
  });
  
  next();
};

// Add error logging helper
logger.logError = (error, req = null) => {
  const errorData = {
    message: error.message,
    stack: error.stack,
    timestamp: new Date().toISOString()
  };
  
  if (req) {
    errorData.request = {
      method: req.method,
      url: req.url,
      ip: req.ip || req.connection.remoteAddress,
      userAgent: req.get('User-Agent') || 'Unknown'
    };
  }
  
  logger.error('Application Error', errorData);
};

// Add database logging helper
logger.logDatabase = (operation, table, duration, error = null) => {
  const logData = {
    operation,
    table,
    duration: `${duration}ms`,
    timestamp: new Date().toISOString()
  };
  
  if (error) {
    logData.error = error.message;
    logger.error('Database Operation Failed', logData);
  } else {
    logger.debug('Database Operation', logData);
  }
};

// Add authentication logging helper
logger.logAuth = (action, userId, success, details = {}) => {
  const logData = {
    action,
    userId,
    success,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  if (success) {
    logger.info('Authentication Success', logData);
  } else {
    logger.warn('Authentication Failed', logData);
  }
};

// Add video operation logging helper
logger.logVideo = (action, videoId, userId, details = {}) => {
  const logData = {
    action,
    videoId,
    userId,
    timestamp: new Date().toISOString(),
    ...details
  };
  
  logger.info('Video Operation', logData);
};

module.exports = { logger };
