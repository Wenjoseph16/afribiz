import { Request, Response, NextFunction } from 'express';

const API_CURRENT_VERSION = 'v1';
const API_SUPPORTED_VERSIONS = ['v1'];

export function apiVersioning(req: Request, res: Response, next: NextFunction) {
  res.setHeader('X-API-Version', API_CURRENT_VERSION);
  res.setHeader('X-API-Supported-Versions', API_SUPPORTED_VERSIONS.join(', '));

  const requestVersion = req.headers['accept-version'] as string;
  if (requestVersion && !API_SUPPORTED_VERSIONS.includes(requestVersion)) {
    return res.status(400).json({
      success: false,
      error: `API version '${requestVersion}' not supported. Supported versions: ${API_SUPPORTED_VERSIONS.join(', ')}`,
    });
  }

  next();
}

export function apiDeprecationNotice(deprecationDate?: string, sunsetDate?: string) {
  return (req: Request, res: Response, next: NextFunction) => {
    if (deprecationDate) {
      res.setHeader('X-API-Deprecated-On', deprecationDate);
    }
    if (sunsetDate) {
      res.setHeader('X-API-Sunset-Date', sunsetDate);
    }
    res.setHeader(
      'X-API-Deprecation-Warning',
      'This API version is deprecated. Please migrate to /api/v1/'
    );
    next();
  };
}
