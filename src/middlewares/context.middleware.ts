import { Type, UnauthorizedException } from '@nestjs/common';
import { Request, Response } from 'express';
import { ConfigService } from 'nestjs-config';
import { get } from 'request-promise';

export const ContextMiddleware = (configService: any, schema: string) => async (
  req: Request,
  res: Response,
  next: Function,
) => {
  const path = req.path;
  const verifySchemaPath = `${schema}/verify`;
  if (path.indexOf(verifySchemaPath) > -1) {
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
      transform: (_body, response) => response,
    };
    try {
      const result = await get(`${authApi}/${verifySchemaPath}`, options);
      const userData = JSON.parse(result.body);
      req['user'] = userData;
    } catch (e) {
      throw new UnauthorizedException();
    }
    next();
  }
};
