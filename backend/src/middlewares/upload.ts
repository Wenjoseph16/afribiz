import fs from 'fs';
import multer from 'multer';
import path from 'path';
import { v4 as uuidv4 } from 'uuid';
import type { Request, Response, NextFunction } from 'express';
import { config } from '../config/env';
import { AppError } from './errorHandler';

// Magic bytes signatures pour validation serveur (anti-MIME spoofing)
const MAGIC_BYTES: Record<string, { offset: number; bytes: number[]; mask?: number[] }[]> = {
  'image/jpeg': [{ offset: 0, bytes: [0xff, 0xd8, 0xff] }],
  'image/png': [{ offset: 0, bytes: [0x89, 0x50, 0x4e, 0x47, 0x0d, 0x0a, 0x1a, 0x0a] }],
  'image/gif': [{ offset: 0, bytes: [0x47, 0x49, 0x46] }],
  'image/webp': [
    { offset: 0, bytes: [0x52, 0x49, 0x46, 0x46] },
    { offset: 8, bytes: [0x57, 0x45, 0x42, 0x50] },
  ],
  'image/svg+xml': [{ offset: 0, bytes: [0x3c, 0x73, 0x76, 0x67] }],
  'image/avif': [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70, 0x61, 0x76, 0x69, 0x66] }],
  'application/pdf': [{ offset: 0, bytes: [0x25, 0x50, 0x44, 0x46] }],
  'video/mp4': [{ offset: 4, bytes: [0x66, 0x74, 0x79, 0x70] }],
  'video/webm': [{ offset: 0, bytes: [0x1a, 0x45, 0xdf, 0xa3] }],
};

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
  {
    mime: 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
    ext: '.docx',
    label: 'DOCX',
  },
  { mime: 'application/vnd.ms-excel', ext: '.xls', label: 'XLS' },
  {
    mime: 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    ext: '.xlsx',
    label: 'XLSX',
  },
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

/**
 * Validate file content by checking magic bytes (server-side)
 * This prevents MIME spoofing attacks (e.g. uploading a PHP file as image/jpeg)
 */
function validateMagicBytes(mimeType: string, buffer: Buffer): boolean {
  const signatures = MAGIC_BYTES[mimeType];
  if (!signatures || signatures.length === 0) return true; // unknown type, skip magic check

  return signatures.every(({ offset, bytes, mask }) => {
    if (offset + bytes.length > buffer.length) return false;
    for (let i = 0; i < bytes.length; i++) {
      const b = buffer[offset + i];
      const m = mask ? mask[i] : 0xff;
      if ((b & m) !== (bytes[i] & m)) return false;
    }
    return true;
  });
}

const fileFilter = (
  _req: Express.Request,
  file: Express.Multer.File,
  cb: multer.FileFilterCallback
) => {
  // Check MIME type
  if (!ALLOWED_MIME_SET.has(file.mimetype)) {
    cb(
      new AppError(
        `Type MIME non autorisé: ${file.mimetype}. Types acceptés: ${ALLOWED_LABELS}`,
        400
      )
    );
    return;
  }

  // Check file extension (defense against MIME spoofing)
  const ext = path.extname(file.originalname).toLowerCase();
  if (!ALLOWED_EXT_SET.has(ext)) {
    cb(
      new AppError(
        `Extension de fichier non autorisée: ${ext}. Extensions acceptées: ${ALLOWED_LABELS.toLowerCase()}`,
        400
      )
    );
    return;
  }

  cb(null, true);
};

/**
 * Multer middleware with magic bytes validation (post-receive)
 * Usage: app.post('/upload', uploadWithMagicBytes.single('file'), handler)
 */
const uploadWithMagic = multer({
  storage,
  fileFilter,
  limits: {
    fileSize: config.MAX_FILE_SIZE,
    files: 10,
  },
});

// Override the single/multiple methods to add magic bytes validation
const originalSingle = uploadWithMagic.single.bind(uploadWithMagic);
const originalArray = uploadWithMagic.array.bind(uploadWithMagic);

uploadWithMagic.single = (fieldName: string) => {
  const middleware = originalSingle(fieldName);
  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, (err: unknown) => {
      if (err) return next(err);
      if (req.file) {
        const buf = fs.readFileSync(req.file.path);
        if (!validateMagicBytes(req.file.mimetype, buf)) {
          fs.unlinkSync(req.file.path);
          return next(
            new AppError(`Contenu du fichier invalide pour le type ${req.file.mimetype}`, 400)
          );
        }
      }
      next();
    });
  };
};

uploadWithMagic.array = (fieldName: string, maxCount?: number) => {
  const middleware = originalArray(fieldName, maxCount);
  return (req: Request, res: Response, next: NextFunction) => {
    middleware(req, res, (err: unknown) => {
      if (err) return next(err);
      if (req.files && Array.isArray(req.files)) {
        for (const file of req.files) {
          const buf = fs.readFileSync(file.path);
          if (!validateMagicBytes(file.mimetype, buf)) {
            // Clean up all uploaded files on first failure
            for (const f of req.files as Express.Multer.File[]) {
              try {
                fs.unlinkSync(f.path);
              } catch {
                /* ignore */
              }
            }
            return next(
              new AppError(`Contenu du fichier invalide pour le type ${file.mimetype}`, 400)
            );
          }
        }
      }
      next();
    });
  };
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

export const ALLOWED_IMAGE_TYPES = ALLOWED_TYPES.filter((t) => t.mime.startsWith('image/')).map(
  (t) => t.mime
);

export const ALLOWED_DOCUMENT_TYPES = ALLOWED_TYPES.filter(
  (t) => t.mime.startsWith('application/') || t.mime.startsWith('text/')
).map((t) => t.mime);

/**
 * Upload a single file (field name: 'file') — avec validation magic bytes
 */
export const uploadSingle = uploadWithMagic.single('file');

/**
 * Upload multiple files (field name: 'files') — avec validation magic bytes
 */
export const uploadMultiple = uploadWithMagic.array('files', 10);

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
