jest.mock('../../services/imageProcessingService', () => ({
  processImage: jest.fn(),
}));

jest.mock('../../utils/response', () => ({
  successResponse: jest.fn((d, m?) => ({ success: true, data: d, ...(m ? { message: m } : {}) })),
}));

import * as ctrl from '../../controllers/uploadController';
import { processImage } from '../../services/imageProcessingService';

function flush() {
  return new Promise((r) => setImmediate(r));
}
function mockRes() {
  const r: any = {};
  r.json = jest.fn().mockReturnValue(r);
  return r;
}
function req(overrides: any = {}) {
  return {
    get: jest.fn().mockReturnValue('localhost:3000'),
    protocol: 'http',
    body: {},
    ...overrides,
  } as any;
}

describe('upload controller', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  describe('uploadMedia', () => {
    it('should upload single file', async () => {
      (processImage as jest.Mock).mockResolvedValue({
        filename: 'abc.webp',
        mimetype: 'image/webp',
        size: 500,
      });
      const res = mockRes();
      const r = req({
        file: {
          path: '/tmp/test.jpg',
          originalname: 'test.jpg',
          mimetype: 'image/jpeg',
          size: 1000,
          filename: 'test.jpg',
        },
      });
      ctrl.uploadMedia(r, res, jest.fn());
      await flush();
      expect(processImage).toHaveBeenCalledWith('/tmp/test.jpg', 'test.jpg');
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: {
          url: 'http://localhost:3000/uploads/abc.webp',
          filename: 'abc.webp',
          mimetype: 'image/webp',
          size: 500,
        },
        message: 'Fichier uploadé',
      });
    });

    it('should return 400 if no file', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.uploadMedia(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });

  describe('uploadMultipleMedia', () => {
    it('should upload multiple files', async () => {
      (processImage as jest.Mock)
        .mockResolvedValueOnce({ filename: 'a.webp', mimetype: 'image/webp', size: 300 })
        .mockResolvedValueOnce({ filename: 'b.webp', mimetype: 'image/webp', size: 400 });
      const res = mockRes();
      const r = req({
        files: [
          {
            path: '/tmp/a.jpg',
            originalname: 'a.jpg',
            mimetype: 'image/jpeg',
            size: 600,
            filename: 'a.jpg',
          },
          {
            path: '/tmp/b.jpg',
            originalname: 'b.jpg',
            mimetype: 'image/png',
            size: 800,
            filename: 'b.jpg',
          },
        ],
      });
      ctrl.uploadMultipleMedia(r, res, jest.fn());
      await flush();
      expect(processImage).toHaveBeenCalledTimes(2);
      expect(res.json).toHaveBeenCalledWith({
        success: true,
        data: [
          {
            url: 'http://localhost:3000/uploads/a.webp',
            filename: 'a.webp',
            mimetype: 'image/webp',
            size: 300,
          },
          {
            url: 'http://localhost:3000/uploads/b.webp',
            filename: 'b.webp',
            mimetype: 'image/webp',
            size: 400,
          },
        ],
        message: '2 fichier(s) uploadé(s)',
      });
    });

    it('should return 400 if no files', async () => {
      const res = mockRes();
      const next = jest.fn();
      ctrl.uploadMultipleMedia(req(), res, next);
      await flush();
      expect(next).toHaveBeenCalledWith(expect.objectContaining({ statusCode: 400 }));
    });
  });
});
