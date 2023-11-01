import { Injectable, NestMiddleware, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from 'nestjs-config';
import { get } from 'request-promise';

@Injectable()
export class DynamicAccountMiddleware implements NestMiddleware {
  constructor(private readonly configService: ConfigService) { }

  async use(req: Request, res: Response, next: Function) {
    const authApi = this.configService.get('endpoint.auth_api');
    let authSchemas = this.configService.get('auth.schemas') || '';
    if (!authApi || !authSchemas) {
      throw new UnauthorizedException();
    }

    const authroizationHeader = req.headers.authorization;
    if (!authroizationHeader) {
      throw new UnauthorizedException();
    }

    const headers = {
      'Content-type': 'application/json',
      'Authorization': authroizationHeader
    };
    const options = {
      headers,
      transform: (body, response) => response
    };

    authSchemas = typeof authSchemas === 'string' ? [authSchemas] : authSchemas;
    let lastError;
    for (const schema of authSchemas) {
      try {
        const result = await get(`${authApi}/${schema}/verify`, options);
        const userData = JSON.parse(result.body);
        req['user'] = userData;
        lastError = null;
        break;
      } catch (e) {
        lastError = e;
      }
    }
    if (lastError) {
      throw new UnauthorizedException();
    }
    next();
  }
}
