import {
  formatFileSize,
  ALLOWED_IMAGE_TYPES,
  ALLOWED_DOCUMENT_TYPES,
} from '../../middlewares/upload';

jest.mock('../../config/env', () => ({
  config: { UPLOAD_DIR: '/tmp/uploads', MAX_FILE_SIZE: 5 * 1024 * 1024 },
}));

jest.mock('fs', () => ({
  existsSync: jest.fn().mockReturnValue(true),
  mkdirSync: jest.fn(),
  readFileSync: jest.fn(),
  unlinkSync: jest.fn(),
}));

describe('formatFileSize', () => {
  it('should return "0 B" for zero bytes', () => {
    expect(formatFileSize(0)).toBe('0 B');
  });

  it('should format bytes', () => {
    expect(formatFileSize(500)).toBe('500.0 B');
  });

  it('should format kilobytes', () => {
    expect(formatFileSize(2048)).toBe('2.0 KB');
  });

  it('should format megabytes', () => {
    expect(formatFileSize(5 * 1024 * 1024)).toBe('5.0 MB');
  });

  it('should format gigabytes', () => {
    expect(formatFileSize(2 * 1024 * 1024 * 1024)).toBe('2.0 GB');
  });
});

describe('ALLOWED_IMAGE_TYPES', () => {
  it('should contain image MIME types', () => {
    expect(ALLOWED_IMAGE_TYPES).toContain('image/jpeg');
    expect(ALLOWED_IMAGE_TYPES).toContain('image/png');
    expect(ALLOWED_IMAGE_TYPES).toContain('image/webp');
    expect(ALLOWED_IMAGE_TYPES).not.toContain('application/pdf');
  });
});

describe('ALLOWED_DOCUMENT_TYPES', () => {
  it('should contain document MIME types', () => {
    expect(ALLOWED_DOCUMENT_TYPES).toContain('application/pdf');
    expect(ALLOWED_DOCUMENT_TYPES).toContain('text/plain');
    expect(ALLOWED_DOCUMENT_TYPES).not.toContain('image/jpeg');
  });
});
