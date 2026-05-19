import {
  ArgumentsHost,
  Catch,
  ExceptionFilter,
  HttpException,
  HttpStatus,
  Logger,
} from '@nestjs/common';
import { Prisma } from '@prisma/client';
import { Request, Response } from 'express';

@Catch()
export class GlobalExceptionFilter implements ExceptionFilter {
  private readonly logger = new Logger(GlobalExceptionFilter.name);

  catch(exception: unknown, host: ArgumentsHost) {
    const ctx = host.switchToHttp();
    const response = ctx.getResponse<Response>();
    const request = ctx.getRequest<Request>();

    let status = HttpStatus.INTERNAL_SERVER_ERROR;
    let message = 'Error interno del servidor.';
    let error = 'Internal Server Error';

    // ── NestJS HttpExceptions (most common) ──────────────────────────────
    if (exception instanceof HttpException) {
      status = exception.getStatus();
      const res = exception.getResponse();
      if (typeof res === 'string') {
        message = res;
      } else if (typeof res === 'object' && res !== null) {
        const r = res as Record<string, any>;
        message = Array.isArray(r.message)
          ? r.message.join(', ')
          : r.message ?? message;
        error = r.error ?? error;
      }
    }

    // ── Prisma Known Request Errors ───────────────────────────────────────
    else if (exception instanceof Prisma.PrismaClientKnownRequestError) {
      switch (exception.code) {
        case 'P2025': // Record not found
          status = HttpStatus.NOT_FOUND;
          message = 'Recurso no encontrado.';
          error = 'Not Found';
          break;
        case 'P2002': // Unique constraint violation
          status = HttpStatus.CONFLICT;
          message = 'Ya existe un registro con esos datos.';
          error = 'Conflict';
          break;
        case 'P2003': // FK constraint violation
          status = HttpStatus.CONFLICT;
          message = 'Operación no permitida: referencia inválida.';
          error = 'Conflict';
          break;
        case 'P2014': // Relation violation
          status = HttpStatus.BAD_REQUEST;
          message = 'Relación de datos inválida.';
          error = 'Bad Request';
          break;
        default:
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          message = `Error de base de datos [${exception.code}]: ${exception.message}`;
          error = 'Database Error';
          this.logger.error(
            `Unhandled Prisma error [${exception.code}]: ${exception.message}`,
          );
      }
    }

    // ── Prisma Validation Errors ─────────────────────────────────────────
    else if (exception instanceof Prisma.PrismaClientValidationError) {
      status = HttpStatus.BAD_REQUEST;
      message = 'Datos de entrada inválidos.';
      error = 'Bad Request';
    }

    // ── Unknown errors ────────────────────────────────────────────────────
    else {
      this.logger.error('Unhandled exception:', exception);
      if (exception instanceof Error) {
        message = `[DEBUG] ${exception.constructor.name}: ${exception.message}`;
      }
    }

    response.status(status).json({
      statusCode: status,
      error,
      message,
      path: request.url,
      timestamp: new Date().toISOString(),
    });
  }
}
