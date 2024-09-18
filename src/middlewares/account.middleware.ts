import { UnauthorizedException } from '@nestjs/common';
import { ConfigService } from '@nestjs/config';
import { Request, Response } from 'express';
import { get } from 'request-promise';

export const createAccountMiddleware =
  (configService: ConfigService) =>
  async (req: Request, res: Response, next: Function) => {
    const path = req.path;
    if (path.indexOf('account/verify') > -1) {
      next();
    } else {
      const authApi = configService.get('endpoint.auth_api');

      if (!authApi) {
        throw new UnauthorizedException();
      }
      const headers = {
        'Content-type': 'application/json',
        Authorization: req.headers.authorization || '',
      };
      const options = {
        headers,
        transform: (body, response) => response,
      };
      try {
        const result = await get(`${authApi}/account/verify`, options);
        const userData = JSON.parse(result.body);
        req['user'] = userData;
      } catch (e) {
        throw new UnauthorizedException();
      }
      next();
    }
  };
