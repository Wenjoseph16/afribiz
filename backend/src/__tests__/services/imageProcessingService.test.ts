import { mockPrisma } from '../setup';

jest.mock('sharp', () => {
  const mockPipeline = {
    rotate: jest.fn().mockReturnThis(),
    resize: jest.fn().mockReturnThis(),
    webp: jest.fn().mockReturnThis(),
    metadata: jest.fn().mockResolvedValue({ width: 2000, height: 1500 }),
    toFile: jest.fn().mockResolvedValue({ size: 500, width: 200, height: 200 }),
  };
  return jest.fn(() => mockPipeline);
});

jest.mock('uuid', () => ({ v4: jest.fn(() => 'mock-uuid') }));

jest.mock('../../config/env', () => ({
  config: { UPLOAD_DIR: '/tmp/uploads' },
}));

import { processImage, processImageBuffer } from '../../services/imageProcessingService';

function flush() {
  return new Promise((r) => setImmediate(r));
}

describe('imageProcessingService', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('processImage', () => {
    it('should process image with sharp and return webp metadata', async () => {
      const result = await processImage('/tmp/input.jpg', 'photo.jpg');
      expect(result).toEqual({
        filename: 'mock-uuid.webp',
        mimetype: 'image/webp',
        size: 500,
        width: 200,
        height: 200,
      });
    });
  });

  describe('processImageBuffer', () => {
    it('should process buffer with sharp', async () => {
      const result = await processImageBuffer(Buffer.from('test'), 'photo.jpg');
      expect(result).toEqual({
        filename: 'mock-uuid.webp',
        mimetype: 'image/webp',
        size: 500,
        width: 200,
        height: 200,
      });
    });
  });
});
