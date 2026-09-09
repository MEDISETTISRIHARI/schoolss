import { Injectable, OnModuleInit, OnModuleDestroy } from '@nestjs/common';
import * as winston from 'winston';
import * as path from 'path';

const LOG_FORMAT = process.env.NODE_ENV === 'production'
  ? winston.format.combine(
      winston.format.timestamp({ format: 'ISO' }),
      winston.format.errors({ stack: true }),
      winston.format.json(),
    )
  : winston.format.combine(
      winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
      winston.format.colorize(),
      winston.format.printf(({ timestamp, level, message, context, ...meta }) => {
        const ctx = context ? `[${context}]` : '';
        const metaStr = Object.keys(meta).length ? JSON.stringify(meta) : '';
        return `${timestamp} ${level} ${ctx} ${message} ${metaStr}`.trim();
      }),
    );

const SENSITIVE_KEYS = new Set([
  'password', 'passwordHash', 'token', 'accessToken', 'refreshToken',
  'resetToken', 'authorization', 'jwt', 'secret', 'credentials',
]);

function redactSecrets(obj: unknown): Record<string, unknown> {
  if (!obj || typeof obj !== 'object') return {};
  if (Array.isArray(obj)) {
    return { items: obj.map(redactSecrets) };
  }
  const out: Record<string, unknown> = {};
  for (const [key, value] of Object.entries(obj as Record<string, unknown>)) {
    if (SENSITIVE_KEYS.has(key.toLowerCase())) {
      out[key] = '[REDACTED]';
    } else if (typeof value === 'object' && value !== null) {
      out[key] = redactSecrets(value);
    } else {
      out[key] = value;
    }
  }
  return out;
}

@Injectable()
export class WinstonLoggerService implements OnModuleInit, OnModuleDestroy {
  private logger: winston.Logger;

  constructor() {
    const transports: winston.transport[] = [
      new winston.transports.Console({
        format: LOG_FORMAT,
      }),
    ];

    if (process.env.NODE_ENV === 'production') {
      const logPath = process.env.LOG_FILE_PATH || path.join(process.cwd(), 'logs');
      transports.push(
        new winston.transports.File({
          filename: path.join(logPath, 'error.log'),
          level: 'error',
        }),
      );
      transports.push(
        new winston.transports.File({
          filename: path.join(logPath, 'combined.log'),
        }),
      );
    }

    this.logger = winston.createLogger({
      level: process.env.LOG_LEVEL || 'info',
      silent: process.env.NODE_ENV === 'test',
      transports,
    });
  }

  onModuleInit() {
    this.logger.info('Winston logger initialized');
  }

  onModuleDestroy() {
    this.logger.end();
  }

  log(message: string, context?: string, meta?: unknown) {
    this.logger.log('info', message, { context, ...redactSecrets(meta) });
  }

  info(message: string, context?: string, meta?: unknown) {
    this.logger.info(message, { context, ...redactSecrets(meta) });
  }

  warn(message: string, context?: string, meta?: unknown) {
    this.logger.warn(message, { context, ...redactSecrets(meta) });
  }

  error(message: string, trace?: string, context?: string, meta?: unknown) {
    this.logger.error(message, { trace, context, ...redactSecrets(meta) });
  }

  debug(message: string, context?: string, meta?: unknown) {
    this.logger.debug(message, { context, ...redactSecrets(meta) });
  }

  getLogger() {
    return this.logger;
  }
}
