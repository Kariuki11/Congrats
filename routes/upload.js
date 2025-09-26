const express = require('express');
const multer = require('multer');
const path = require('path');
const fs = require('fs').promises;
const { v4: uuidv4 } = require('uuid');
const { config } = require('../config');

const router = express.Router();

// Configure multer for file uploads
const storage = multer.diskStorage({
  destination: async (req, file, cb) => {
    const uploadDir = config.upload.directory;
    try {
      await fs.access(uploadDir);
    } catch (error) {
      await fs.mkdir(uploadDir, { recursive: true });
    }
    cb(null, uploadDir);
  },
  filename: (req, file, cb) => {
    const uniqueName = `${uuidv4()}${path.extname(file.originalname)}`;
    cb(null, uniqueName);
  }
});

// File filter to restrict file types
const fileFilter = (req, file, cb) => {
  const allowedTypes = [
    'image/jpeg',
    'image/png',
    'image/gif',
    'image/webp',
    'audio/ogg',
    'audio/mpeg',
    'audio/wav',
    'video/mp4',
    'video/3gpp',
    'application/pdf',
    'text/plain',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    'application/msword'
  ];

  if (allowedTypes.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new Error(`File type ${file.mimetype} is not allowed`), false);
  }
};

const upload = multer({
  storage: storage,
  fileFilter: fileFilter,
  limits: {
    fileSize: config.upload.maxFileSize,
    files: 10 // Maximum 10 files per request
  }
});

/**
 * Upload single file
 * POST /api/upload
 */
router.post('/', upload.single('file'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({
        success: false,
        error: 'No file uploaded'
      });
    }

    const fileInfo = {
      id: uuidv4(),
      originalName: req.file.originalname,
      fileName: req.file.filename,
      filePath: req.file.path,
      fileSize: req.file.size,
      mimeType: req.file.mimetype,
      uploadedAt: new Date().toISOString(),
      url: `/uploads/${req.file.filename}`
    };

    console.log(`File uploaded: ${fileInfo.originalName} (${fileInfo.fileSize} bytes)`);

    res.json({
      success: true,
      data: fileInfo
    });
  } catch (error) {
    console.error('Error uploading file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload file',
      message: error.message
    });
  }
});

/**
 * Upload multiple files
 * POST /api/upload/multiple
 */
router.post('/multiple', upload.array('files', 10), async (req, res) => {
  try {
    if (!req.files || req.files.length === 0) {
      return res.status(400).json({
        success: false,
        error: 'No files uploaded'
      });
    }

    const filesInfo = req.files.map(file => ({
      id: uuidv4(),
      originalName: file.originalname,
      fileName: file.filename,
      filePath: file.path,
      fileSize: file.size,
      mimeType: file.mimetype,
      uploadedAt: new Date().toISOString(),
      url: `/uploads/${file.filename}`
    }));

    console.log(`${filesInfo.length} files uploaded successfully`);

    res.json({
      success: true,
      data: {
        files: filesInfo,
        count: filesInfo.length
      }
    });
  } catch (error) {
    console.error('Error uploading files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to upload files',
      message: error.message
    });
  }
});

/**
 * Get file information
 * GET /api/upload/:filename
 */
router.get('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const uploadDir = config.upload.directory;
    const filePath = path.join(uploadDir, filename);

    try {
      const stats = await fs.stat(filePath);
      
      res.json({
        success: true,
        data: {
          fileName: filename,
          filePath: filePath,
          fileSize: stats.size,
          createdAt: stats.birthtime,
          modifiedAt: stats.mtime,
          url: `/uploads/${filename}`
        }
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
  } catch (error) {
    console.error('Error getting file info:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to get file information',
      message: error.message
    });
  }
});

/**
 * Delete file
 * DELETE /api/upload/:filename
 */
router.delete('/:filename', async (req, res) => {
  try {
    const { filename } = req.params;
    const uploadDir = config.upload.directory;
    const filePath = path.join(uploadDir, filename);

    try {
      await fs.unlink(filePath);
      console.log(`File deleted: ${filename}`);
      
      res.json({
        success: true,
        message: 'File deleted successfully'
      });
    } catch (error) {
      res.status(404).json({
        success: false,
        error: 'File not found'
      });
    }
  } catch (error) {
    console.error('Error deleting file:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to delete file',
      message: error.message
    });
  }
});

/**
 * List uploaded files
 * GET /api/upload
 */
router.get('/', async (req, res) => {
  try {
    const uploadDir = config.upload.directory;
    const { limit = 50, offset = 0 } = req.query;

    try {
      const files = await fs.readdir(uploadDir);
      const fileStats = await Promise.all(
        files.slice(parseInt(offset), parseInt(offset) + parseInt(limit))
          .map(async (filename) => {
            const filePath = path.join(uploadDir, filename);
            const stats = await fs.stat(filePath);
            return {
              fileName: filename,
              fileSize: stats.size,
              createdAt: stats.birthtime,
              modifiedAt: stats.mtime,
              url: `/uploads/${filename}`
            };
          })
      );

      res.json({
        success: true,
        data: {
          files: fileStats,
          total: files.length,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    } catch (error) {
      res.json({
        success: true,
        data: {
          files: [],
          total: 0,
          limit: parseInt(limit),
          offset: parseInt(offset)
        }
      });
    }
  } catch (error) {
    console.error('Error listing files:', error);
    res.status(500).json({
      success: false,
      error: 'Failed to list files',
      message: error.message
    });
  }
});

// Error handling middleware for multer
router.use((error, req, res, next) => {
  if (error instanceof multer.MulterError) {
    if (error.code === 'LIMIT_FILE_SIZE') {
      return res.status(400).json({
        success: false,
        error: 'File too large',
        message: `File size exceeds ${config.upload.maxFileSize} bytes limit`
      });
    }
    if (error.code === 'LIMIT_FILE_COUNT') {
      return res.status(400).json({
        success: false,
        error: 'Too many files',
        message: 'Maximum 10 files allowed per request'
      });
    }
  }
  
  if (error.message.includes('File type')) {
    return res.status(400).json({
      success: false,
      error: 'Invalid file type',
      message: error.message
    });
  }

  next(error);
});

module.exports = router;
