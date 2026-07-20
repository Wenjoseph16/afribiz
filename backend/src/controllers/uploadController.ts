import { Response } from 'express';
import { AuthenticatedRequest } from '../middlewares/auth';
import { successResponse } from '../utils/response';
import { catchAsyncErrors, AppError } from '../middlewares/errorHandler';
import { processImage } from '../services/imageProcessingService';
import { logger } from '../lib/logger';

const IMAGE_MIME_PREFIXES = ['image/jpeg', 'image/png', 'image/webp', 'image/avif'];

function isImage(mimetype: string): boolean {
  return IMAGE_MIME_PREFIXES.some((p) => mimetype.startsWith(p));
}

async function processFile(
  file: Express.Multer.File
): Promise<{ filename: string; mimetype: string; size: number }> {
  if (isImage(file.mimetype) && file.path) {
    try {
      return await processImage(file.path, file.originalname);
    } catch (err) {
      logger.warn('Image processing failed, serving original:', err);
    }
  }
  return { filename: file.filename, mimetype: file.mimetype, size: file.size };
}

export const uploadMedia = catchAsyncErrors(async (req: AuthenticatedRequest, res: Response) => {
  if (!req.file) {
    throw new AppError('Aucun fichier fourni', 400);
  }

  const processed = await processFile(req.file);
  const fileUrl = `${req.protocol}://${req.get('host')}/uploads/${processed.filename}`;

  res.json(
    successResponse(
      {
        url: fileUrl,
        filename: processed.filename,
        mimetype: processed.mimetype,
        size: processed.size,
      },
      'Fichier uploadé'
    )
  );
});

export const uploadMultipleMedia = catchAsyncErrors(
  async (req: AuthenticatedRequest, res: Response) => {
    const files = req.files as Express.Multer.File[];
    if (!files || files.length === 0) {
      throw new AppError('Aucun fichier fourni', 400);
    }

    const results = await Promise.all(files.map(processFile));

    const urls = results.map((file) => ({
      url: `${req.protocol}://${req.get('host')}/uploads/${file.filename}`,
      filename: file.filename,
      mimetype: file.mimetype,
      size: file.size,
    }));

    res.json(successResponse(urls, `${urls.length} fichier(s) uploadé(s)`));
  }
);
