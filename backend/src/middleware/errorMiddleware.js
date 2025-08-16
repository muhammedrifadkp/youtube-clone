const { logger } = require('../utils/logger');

// Custom error class
class AppError extends Error {
  constructor(message, statusCode) {
    super(message);
    this.statusCode = statusCode;
    this.status = `${statusCode}`.startsWith('4') ? 'fail' : 'error';
    this.isOperational = true;

    Error.captureStackTrace(this, this.constructor);
  }
}

// Not found middleware
const notFound = (req, res, next) => {
  const error = new AppError(`Not found - ${req.originalUrl}`, 404);
  next(error);
};

// Global error handler
const errorHandler = (err, req, res, next) => {
  let error = { ...err };
  error.message = err.message;

  // Log error
  logger.logError(err, req);

  // Mongoose bad ObjectId
  if (err.name === 'CastError') {
    const message = 'Resource not found';
    error = new AppError(message, 404);
  }

  // Mongoose duplicate key
  if (err.code === 11000) {
    const message = 'Duplicate field value entered';
    error = new AppError(message, 400);
  }

  // Mongoose validation error
  if (err.name === 'ValidationError') {
    const message = Object.values(err.errors).map(val => val.message);
    error = new AppError(message, 400);
  }

  // PostgreSQL errors
  if (err.code) {
    switch (err.code) {
      case '23505': // unique_violation
        error = new AppError('Duplicate entry. This record already exists.', 409);
        break;
      case '23503': // foreign_key_violation
        error = new AppError('Referenced record does not exist.', 400);
        break;
      case '23502': // not_null_violation
        error = new AppError('Required field is missing.', 400);
        break;
      case '22001': // string_data_right_truncation
        error = new AppError('Input data is too long.', 400);
        break;
      case '42P01': // undefined_table
        error = new AppError('Database table not found.', 500);
        break;
      case '42703': // undefined_column
        error = new AppError('Database column not found.', 500);
        break;
      case '28P01': // invalid_password
        error = new AppError('Database authentication failed.', 500);
        break;
      case '3D000': // invalid_catalog_name
        error = new AppError('Database does not exist.', 500);
        break;
      default:
        error = new AppError('Database error occurred.', 500);
    }
  }

  // JWT errors
  if (err.name === 'JsonWebTokenError') {
    error = new AppError('Invalid token. Please log in again.', 401);
  }

  if (err.name === 'TokenExpiredError') {
    error = new AppError('Token expired. Please log in again.', 401);
  }

  // Multer errors (file upload)
  if (err.code === 'LIMIT_FILE_SIZE') {
    error = new AppError('File too large. Please upload a smaller file.', 400);
  }

  if (err.code === 'LIMIT_UNEXPECTED_FILE') {
    error = new AppError('Unexpected file field.', 400);
  }

  // Rate limiting errors
  if (err.status === 429) {
    error = new AppError('Too many requests. Please try again later.', 429);
  }

  // Send error response
  res.status(error.statusCode || 500).json({
    success: false,
    error: {
      message: error.message || 'Server Error',
      ...(process.env.NODE_ENV === 'development' && { stack: err.stack })
    }
  });
};

// Async error handler wrapper
const asyncHandler = (fn) => (req, res, next) => {
  Promise.resolve(fn(req, res, next)).catch(next);
};

// Validation error formatter
const formatValidationErrors = (errors) => {
  return errors.array().map(error => ({
    field: error.param,
    message: error.msg,
    value: error.value
  }));
};

// Success response helper
const sendSuccess = (res, statusCode = 200, data = null, message = 'Success') => {
  const response = {
    success: true,
    message
  };

  if (data !== null) {
    response.data = data;
  }

  res.status(statusCode).json(response);
};

// Paginated response helper
const sendPaginatedResponse = (res, data, page, limit, total, message = 'Success') => {
  const totalPages = Math.ceil(total / limit);
  const hasNextPage = page < totalPages;
  const hasPrevPage = page > 1;

  res.status(200).json({
    success: true,
    message,
    data,
    pagination: {
      currentPage: page,
      totalPages,
      totalItems: total,
      itemsPerPage: limit,
      hasNextPage,
      hasPrevPage,
      nextPage: hasNextPage ? page + 1 : null,
      prevPage: hasPrevPage ? page - 1 : null
    }
  });
};

module.exports = {
  AppError,
  notFound,
  errorHandler,
  asyncHandler,
  formatValidationErrors,
  sendSuccess,
  sendPaginatedResponse
};
