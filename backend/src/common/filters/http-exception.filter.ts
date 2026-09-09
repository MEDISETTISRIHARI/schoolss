import { ExceptionFilter, Catch, ArgumentsHost, HttpException } from '@nestjs/common';
import { Response } from 'express';

@Catch()
export class AllExceptionsFilter implements ExceptionFilter {
  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();

    if (exception instanceof HttpException) {
      const status = exception.getStatus();
      const res = exception.getResponse();

      let message: string;
      if (typeof res === 'string') {
        message = res;
      } else {
        const msg = (res as { message?: string | string[] }).message;
        if (msg) {
          message = Array.isArray(msg) ? msg[0] : msg;
        } else {
          message = exception.message;
        }
      }

      response.status(status).json({
        success: false,
        data: null,
        meta: null,
        error: {
          message,
          statusCode: status,
          error: (res as { error?: string })?.error ?? exception.name,
        },
      });
    } else {
      const status = 500;
      response.status(status).json({
        success: false,
        data: null,
        meta: null,
        error: {
          message: 'Internal server error',
          statusCode: status,
          error: 'InternalServerError',
        },
      });
    }
  }
}
