import winston from 'winston';
import { config } from '../config/env';

const isVercel = !!process.env.VERCEL;

const transports: winston.transport[] = [];

if (isVercel) {
  transports.push(new winston.transports.Console({ format: winston.format.json() }));
} else {
  transports.push(new winston.transports.File({ filename: 'logs/error.log', level: 'error' }));
  transports.push(new winston.transports.File({ filename: 'logs/combined.log' }));
  if (config.NODE_ENV !== 'production') {
    transports.push(new winston.transports.Console({ format: winston.format.simple() }));
  }
}

export const logger = winston.createLogger({
  level: config.NODE_ENV === 'production' ? 'info' : 'debug',
  format: winston.format.json(),
  transports,
});

