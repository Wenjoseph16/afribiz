import sharp from 'sharp';
import path from 'path';
import fs from 'fs';
import { v4 as uuidv4 } from 'uuid';
import { config } from '../config/env';

const IMAGE_MAX_WIDTH = 1920;
const IMAGE_QUALITY = 80;
const AVATAR_SIZE = 256;

const IMAGE_MIME_MAP: Record<string, string> = {
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.png': 'image/png',
  '.webp': 'image/webp',
  '.avif': 'image/avif',
};

interface ProcessedImage {
  filename: string;
  mimetype: string;
  size: number;
  width: number;
  height: number;
}

export async function processImage(
  inputPath: string,
  originalname: string,
  options?: { avatar?: boolean }
): Promise<ProcessedImage> {
  const ext = path.extname(originalname).toLowerCase();
  const outputFilename = `${uuidv4()}.webp`;
  const outputPath = path.join(config.UPLOAD_DIR, outputFilename);

  let pipeline = sharp(inputPath).rotate();

  if (options?.avatar) {
    pipeline = pipeline.resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover', position: 'center' });
  } else {
    const metadata = await sharp(inputPath).metadata();
    if (metadata.width && metadata.width > IMAGE_MAX_WIDTH) {
      pipeline = pipeline.resize(IMAGE_MAX_WIDTH, undefined, { fit: 'inside', withoutEnlargement: true });
    }
  }

  const info = await pipeline
    .webp({ quality: IMAGE_QUALITY, effort: 4 })
    .toFile(outputPath);

  if (inputPath !== outputPath) {
    fs.unlink(inputPath, () => {});
  }

  return {
    filename: outputFilename,
    mimetype: 'image/webp',
    size: info.size,
    width: info.width,
    height: info.height,
  };
}

export async function processImageBuffer(
  buffer: Buffer,
  originalname: string,
  options?: { avatar?: boolean }
): Promise<ProcessedImage> {
  const outputFilename = `${uuidv4()}.webp`;
  const outputPath = path.join(config.UPLOAD_DIR, outputFilename);

  let pipeline = sharp(buffer).rotate();

  if (options?.avatar) {
    pipeline = pipeline.resize(AVATAR_SIZE, AVATAR_SIZE, { fit: 'cover', position: 'center' });
  } else {
    const metadata = await sharp(buffer).metadata();
    if (metadata.width && metadata.width > IMAGE_MAX_WIDTH) {
      pipeline = pipeline.resize(IMAGE_MAX_WIDTH, undefined, { fit: 'inside', withoutEnlargement: true });
    }
  }

  const info = await pipeline
    .webp({ quality: IMAGE_QUALITY, effort: 4 })
    .toFile(outputPath);

  return {
    filename: outputFilename,
    mimetype: 'image/webp',
    size: info.size,
    width: info.width,
    height: info.height,
  };
}
