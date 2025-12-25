import {
  ExceptionFilter,
  Catch,
  ArgumentsHost,
  BadRequestException,
} from '@nestjs/common';
import { Response } from 'express';

@Catch(BadRequestException)
export class ValidationExceptionFilter implements ExceptionFilter {
  catch(exception: BadRequestException, host: ArgumentsHost): void {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest();
    const status = exception.getStatus();
    const exceptionResponse = exception.getResponse() as any;

    let errors: any[] = [];
    let message = 'Validation failed';

    if (Array.isArray(exceptionResponse.message)) {
      errors = exceptionResponse.message.map((msg: string) => ({
        message: msg,
      }));
      message = 'Validation failed';
    } else if (typeof exceptionResponse.message === 'string') {
      message = exceptionResponse.message;
    }

    response.status(status).json({
      success: false,
      statusCode: status,
      message,
      errors: errors.length > 0 ? errors : undefined,
      meta: {
        timestamp: new Date().toISOString(),
        path: request.url,
      },
    });
  }
}
