const multer = require('multer');
const path = require('path');
const fs = require('fs');
const { v4: uuidv4 } = require('uuid');
const { AppError } = require('./errorMiddleware');
const { logger } = require('../utils/logger');

// Create upload directories if they don't exist
const createUploadDirs = () => {
  const dirs = [
    process.env.UPLOAD_PATH || './uploads',
    process.env.VIDEO_UPLOAD_PATH || './uploads/videos',
    process.env.THUMBNAIL_UPLOAD_PATH || './uploads/thumbnails',
    process.env.AVATAR_UPLOAD_PATH || './uploads/avatars'
  ];

  dirs.forEach(dir => {
    if (!fs.existsSync(dir)) {
      fs.mkdirSync(dir, { recursive: true });
      logger.info(`Created upload directory: ${dir}`);
    }
  });
};

// Initialize upload directories
createUploadDirs();

// File filter for videos
const videoFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'video/mp4',
    'video/mpeg',
    'video/quicktime',
    'video/x-msvideo', // .avi
    'video/x-ms-wmv',  // .wmv
    'video/webm'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only video files are allowed.', 400), false);
  }
};

// File filter for images (thumbnails, avatars)
const imageFileFilter = (req, file, cb) => {
  const allowedMimes = [
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/gif',
    'image/webp'
  ];

  if (allowedMimes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError('Invalid file type. Only image files are allowed.', 400), false);
  }
};

// Storage configuration for videos
const videoStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.VIDEO_UPLOAD_PATH || './uploads/videos');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Storage configuration for thumbnails
const thumbnailStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.THUMBNAIL_UPLOAD_PATH || './uploads/thumbnails');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Storage configuration for avatars
const avatarStorage = multer.diskStorage({
  destination: (req, file, cb) => {
    cb(null, process.env.AVATAR_UPLOAD_PATH || './uploads/avatars');
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// Video upload configuration
const uploadVideo = multer({
  storage: videoStorage,
  fileFilter: videoFileFilter,
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024, // 500MB default
    files: 1
  }
});

// Thumbnail upload configuration
const uploadThumbnail = multer({
  storage: thumbnailStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 5 * 1024 * 1024, // 5MB
    files: 1
  }
});

// Avatar upload configuration
const uploadAvatar = multer({
  storage: avatarStorage,
  fileFilter: imageFileFilter,
  limits: {
    fileSize: 2 * 1024 * 1024, // 2MB
    files: 1
  }
});

// Multiple file upload for video with thumbnail
const uploadVideoWithThumbnail = multer({
  storage: multer.diskStorage({
    destination: (req, file, cb) => {
      if (file.fieldname === 'video') {
        cb(null, process.env.VIDEO_UPLOAD_PATH || './uploads/videos');
      } else if (file.fieldname === 'thumbnail') {
        cb(null, process.env.THUMBNAIL_UPLOAD_PATH || './uploads/thumbnails');
      } else {
        cb(new AppError('Invalid field name', 400), false);
      }
    },
    filename: (req, file, cb) => {
      const uniqueName = `${uuidv4()}-${Date.now()}${path.extname(file.originalname)}`;
      cb(null, uniqueName);
    }
  }),
  fileFilter: (req, file, cb) => {
    if (file.fieldname === 'video') {
      videoFileFilter(req, file, cb);
    } else if (file.fieldname === 'thumbnail') {
      imageFileFilter(req, file, cb);
    } else {
      cb(new AppError('Invalid field name', 400), false);
    }
  },
  limits: {
    fileSize: parseInt(process.env.MAX_FILE_SIZE) || 500 * 1024 * 1024,
    files: 2
  }
});

// Error handling middleware for multer
const handleMulterError = (error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    switch (error.code) {
      case 'LIMIT_FILE_SIZE':
        return next(new AppError('File too large', 400));
      case 'LIMIT_FILE_COUNT':
        return next(new AppError('Too many files', 400));
      case 'LIMIT_UNEXPECTED_FILE':
        return next(new AppError('Unexpected file field', 400));
      case 'LIMIT_PART_COUNT':
        return next(new AppError('Too many parts', 400));
      case 'LIMIT_FIELD_KEY':
        return next(new AppError('Field name too long', 400));
      case 'LIMIT_FIELD_VALUE':
        return next(new AppError('Field value too long', 400));
      case 'LIMIT_FIELD_COUNT':
        return next(new AppError('Too many fields', 400));
      default:
        return next(new AppError('File upload error', 400));
    }
  }
  next(error);
};

// Clean up uploaded files on error
const cleanupFiles = (files) => {
  if (!files) return;

  const filesToDelete = [];
  
  if (Array.isArray(files)) {
    filesToDelete.push(...files);
  } else if (typeof files === 'object') {
    Object.values(files).forEach(fileArray => {
      if (Array.isArray(fileArray)) {
        filesToDelete.push(...fileArray);
      } else {
        filesToDelete.push(fileArray);
      }
    });
  }

  filesToDelete.forEach(file => {
    if (file && file.path && fs.existsSync(file.path)) {
      fs.unlink(file.path, (err) => {
        if (err) {
          logger.error(`Failed to delete file: ${file.path}`, err);
        } else {
          logger.info(`Cleaned up file: ${file.path}`);
        }
      });
    }
  });
};

// Middleware to clean up files on error
const cleanupOnError = (req, res, next) => {
  const originalSend = res.send;
  const originalJson = res.json;

  res.send = function(data) {
    if (res.statusCode >= 400) {
      cleanupFiles(req.files || req.file);
    }
    return originalSend.call(this, data);
  };

  res.json = function(data) {
    if (res.statusCode >= 400) {
      cleanupFiles(req.files || req.file);
    }
    return originalJson.call(this, data);
  };

  next();
};

// Get file URL helper
const getFileUrl = (req, filename, type = 'videos') => {
  const baseUrl = `${req.protocol}://${req.get('host')}`;
  return `${baseUrl}/uploads/${type}/${filename}`;
};

// Validate file existence
const validateFileExists = (filePath) => {
  return fs.existsSync(filePath);
};

// Get file info
const getFileInfo = (filePath) => {
  try {
    const stats = fs.statSync(filePath);
    return {
      size: stats.size,
      created: stats.birthtime,
      modified: stats.mtime
    };
  } catch (error) {
    return null;
  }
};

module.exports = {
  uploadVideo,
  uploadThumbnail,
  uploadAvatar,
  uploadVideoWithThumbnail,
  handleMulterError,
  cleanupFiles,
  cleanupOnError,
  getFileUrl,
  validateFileExists,
  getFileInfo
};
