import multer from 'multer';
import path from 'node:path';
import crypto from 'node:crypto';
import { env } from '../config/env.js';
import { AppError } from '../utils/AppError.js';

const ALLOWED_TYPES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

const storage = multer.diskStorage({
  destination(_req, _file, cb) {
    cb(null, env.upload.dir);
  },
  filename(_req, file, cb) {
    const ext = path.extname(file.originalname).toLowerCase();
    const name = crypto.randomUUID() + ext;
    cb(null, name);
  },
});

function fileFilter(_req, file, cb) {
  if (ALLOWED_TYPES.includes(file.mimetype)) {
    cb(null, true);
  } else {
    cb(new AppError(400, 'INVALID_FILE_TYPE', `Allowed types: ${ALLOWED_TYPES.join(', ')}`));
  }
}

export const uploadSingle = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.upload.maxFileSizeMB * 1024 * 1024 },
}).single('image');

export const uploadMultiple = multer({
  storage,
  fileFilter,
  limits: { fileSize: env.upload.maxFileSizeMB * 1024 * 1024 },
}).array('images', 10);
