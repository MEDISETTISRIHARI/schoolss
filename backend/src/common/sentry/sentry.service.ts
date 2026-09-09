import { Injectable, Module } from '@nestjs/common';
import * as Sentry from '@sentry/node';
import { ConfigService } from '@nestjs/config';

@Injectable()
export class SentryService {
  private initialized = false;

  constructor(private readonly configService: ConfigService) {}

  init() {
    const dsn = this.configService.get<string>('SENTRY_DSN');
    if (!dsn || this.initialized) return;

    try {
      Sentry.init({
        dsn,
        environment: this.configService.get<string>('NODE_ENV', 'development'),
        tracesSampleRate: parseFloat(this.configService.get<string>('SENTRY_TRACES_SAMPLE_RATE', '0.1')),
      });
      this.initialized = true;
    } catch {
      // fail silently if Sentry is misconfigured
    }
  }

  captureException(error: Error) {
    if (!this.initialized) return;
    try {
      Sentry.captureException(error);
    } catch {
      // ignore
    }
  }

  captureMessage(message: string, level: Sentry.SeverityLevel = 'info') {
    if (!this.initialized) return;
    try {
      Sentry.captureMessage(message, level);
    } catch {
      // ignore
    }
  }

  setUserContext(user: { id: string; email?: string; role?: string }) {
    if (!this.initialized) return;
    try {
      Sentry.setUser({
        id: user.id,
        email: user.email,
        ...(user.role ? { role: user.role } : {}),
      });
    } catch {
      // ignore
    }
  }

  clearUserContext() {
    if (!this.initialized) return;
    try {
      Sentry.setUser(null);
    } catch {
      // ignore
    }
  }
}

@Module({
  providers: [SentryService],
  exports: [SentryService],
})
export class SentryModule {}
