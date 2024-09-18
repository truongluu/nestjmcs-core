import {
  CallHandler,
  ExecutionContext,
  HttpStatus,
  Injectable,
  NestInterceptor,
} from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request } from 'express';
import { post } from 'request-promise';
import { throwError } from 'rxjs';
import { catchError, finalize, tap } from 'rxjs/operators';

@Injectable()
export class LoggingInterceptor implements NestInterceptor {
  constructor(private readonly configService: ConfigService) {}

  async intercept(context: ExecutionContext, next: CallHandler): Promise<any> {
    const logApi = this.configService.get('endpoint.log_api');
    const internalToken = this.configService.get('app.internal_token', '');
    if (!logApi || !internalToken) {
      return await next.handle().toPromise();
    }
    const ctx = context.switchToHttp();
    const request = ctx.getRequest<Request>();
    const now = Date.now();
    const logData = {
      path: request.url,
      method: request.method,
      headers: request.headers,
      requestData: request.body,
      responseData: null,
    };
    let status;
    return next
      .handle()
      .pipe(
        tap((response) => {
          status = HttpStatus.OK;
          logData.responseData = response;
        }),
        catchError((exception) => {
          status = HttpStatus.INTERNAL_SERVER_ERROR;
          if (
            exception.getStatus &&
            typeof exception.getStatus === 'function'
          ) {
            status = exception.getStatus();
          }
          logData.responseData = {
            code: status || HttpStatus.INTERNAL_SERVER_ERROR,
            timestamp: new Date().toISOString(),
            path: request.url,
            method: request.method,
            message:
              exception['errmsg'] ||
              exception.message.message ||
              exception.message.error ||
              null,
          };
          return throwError(exception);
        }),
        finalize(async () => {
          if (status === HttpStatus.INTERNAL_SERVER_ERROR) {
            const headers = {
              'Content-type': 'application/json',
              Authorization: `Bearer ${internalToken}`,
            };
            const options = {
              headers,
              body: logData,
              json: true,
              transform: (body, response) => response,
            };
            try {
              await post(`${logApi}`, options);
            } catch (e) {}
          }
        }),
      )
      .toPromise();
  }
}
