import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';
import { AppError } from './errorHandler';

// ============================================
// ALLOWED MIME TYPES & EXTENSIONS
// ============================================

interface MimeConfig {
  mime: string;
  ext: string;
  label: string;
}

const ALLOWED_TYPES: MimeConfig[] = [
  // Images
  { mime: 'image/jpeg', ext: '.jpg', label: 'JPEG' },
  { mime: 'image/jpeg', ext: '.jpeg', label: 'JPEG' },
  { mime: 'image/png', ext: '.png', label: 'PNG' },
  { mime: 'image/gif', ext: '.gif', label: 'GIF' },
  { mime: 'image/webp', ext: '.webp', label: 'WebP' },
  { mime: 'image/svg+xml', ext: '.svg', label: 'SVG' },
  { mime: 'image/avif', ext: '.avif', label: 'AVIF' },
  // Documents
  { mime: 'application/pdf', ext: '.pdf', label: 'PDF' },
  { mime: 'application/msword', ext: '.doc', label: 'DOC' },
  { mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document', ext: '.docx', label: 'DOCX' },
  { mime: 'application/vnd.ms-excel', ext: '.xls', label: 'XLS' },
  { mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet', ext: '.xlsx', label: 'XLSX' },
  { mime: 'text/plain', ext: '.txt', label: 'TXT' },
  { mime: 'text/csv', ext: '.csv', label: 'CSV' },
  // Media
  { mime: 'video/mp4', ext: '.mp4', label: 'MP4' },
  { mime: 'video/webm', ext: '.webm', label: 'WebM' },
  { mime: 'audio/mpeg', ext: '.mp3', label: 'MP3' },
  { mime: 'audio/ogg', ext: '.ogg', label: 'OGG' },
  { mime: 'audio/wav', ext: '.wav', label: 'WAV' },
];

const ALLOWED_MIME_SET = new Set(ALLOWED_TYPES.map((t) => t.mime));
const ALLOWED_EXT_SET = new Set(ALLOWED_TYPES.map((t) => t.ext));
const ALLOWED_LABELS = [...new Set(ALLOWED_TYPES.map((t) => t.label))].join(', ');

// ============================================
// ENSURE UPLOAD DIRECTORY EXISTS
// ============================================

if (!fs.existsSync(config.UPLOAD_DIR)) {
  fs.mkdirSync(config.UPLOAD_DIR, { recursive: true });
}

// ============================================
// STORAGE CONFIGURATION
// ============================================

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => {
    cb(null, config.UPLOAD_DIR);
  },
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname).toLowerCase() || '.bin';
    cb(null, `${uuidv4()}${ext}`);
  },
});

// ============================================
// FILE FILTER (MIME + EXTENSION VALIDATION)
// ============================================

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Check MIME type
  if (!ALLOWED_MIME_SET.has(file.mimetype)) {
    cb(new AppError(
      `Type MIME non autorisé: ${file.mimetype}. Types acceptés: ${ALLOWED_LABELS}`,
      400
    ));
    return;
  }

  // Check file extension (defense against MIME spoofing)
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXT_SET.has(ext)) {
    cb(new AppError(
      `Extension de fichier non autorisée: ${ext}. Extensions acceptées: ${ALLOWED_LABELS.toLowerCase()}`,
      400
    ));
    return;
  }

  cb(null, true);
};

// ============================================
// MULTER INSTANCE
// ============================================

const upload = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.MAX_FILE_SIZE, // 5MB default
    files: 10, // Max 10 files at once
  },
});

// ============================================
// EXPORTED HELPERS
// ============================================

export const ALLOWED_IMAGE_TYPES = ALLOWED_TYPES
  .filter((t) => t.mime.startsWith('image/'))
  .map((t) => t.mime);

export const ALLOWED_DOCUMENT_TYPES = ALLOWED_TYPES
  .filter((t) => t.mime.startsWith('application/') || t.mime.startsWith('text/'))
  .map((t) => t.mime);

/**
 * Upload a single file (field name: 'file')
 */
export const uploadSingle = upload.single('file');

/**
 * Upload multiple files (field name: 'files')
 */
export const uploadMultiple = upload.array('files', 10);

/**
 * Upload files with custom field names
 */
export const uploadFields = upload.fields.bind(upload);

/**
 * Upload any single file with custom field name
 */
export const uploadField = (name: string) => upload.single(name);

/**
 * Get human-readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const units = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(1)} ${units[i]}`;
}

export default upload;
