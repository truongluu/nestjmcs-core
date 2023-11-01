import { Injectable, UnauthorizedException } from '@nestjs/common';
import { ConfigService } from 'nestjs-config';
import * as request from 'request-promise';
import { HttpMethod } from '../constants/http-method';

@Injectable()
export class InternalService {
  constructor(private readonly congfigService: ConfigService) {

  }

  toQueryString(json) {
    return Object.keys(json)
      .map(k => `${k}=${encodeURIComponent(json[k])}`)
      .join('&');
  }

  getOptions() {
    const internalToken = this.congfigService.get('jwt.internal_token');
    if (!internalToken) {
      throw new UnauthorizedException();
    }
    const defaultOptions = {
      headers: {
        'Accept': 'application/json',
        'Authorization': `Bearer ${internalToken}`
      },
      json: true,
      transform: (body, response) => response
    };
    return defaultOptions;
  }

  fetch(uri, options, method = HttpMethod.GET) {
    let qs = '';
    options = options || {};
    const newOptions = { ...this.getOptions(), ...options };
    if (method === HttpMethod.POST || method === HttpMethod.PUT) {
      if (options.body) {
        newOptions.headers = {
          ...newOptions.headers,
          'Content-Type': 'application/json; charset=utf-8'
        };
      }
    } else if (method === 'GET') {
      const optionsClone = { ...options };
      qs = this.toQueryString(optionsClone);
    }
    return request[method.toLowerCase()](`${uri}${qs ? `?${qs}` : ''}`, newOptions);

  }

  async get(uri: string, options = {}) {
    let result;
    try {
      result = await this.fetch(uri, options, HttpMethod.GET);

    } catch (e) {
      return e.response.body;
    }
    return result.body;
  }

  async post(uri: string, options = {}) {
    let result;
    try {
      result = await this.fetch(uri, options, HttpMethod.POST);
    } catch (e) {
      return e.response.body;
    }
    return result.body;
  }

  async put(uri: string, options = {}) {
    let result;
    try {
      result = await this.fetch(uri, options, HttpMethod.PUT);
    } catch (e) {
      return e.response.body;
    }
    return result.body;
  }

  async delete(uri: string, options = {}) {
    let result;
    try {
      result = await this.fetch(uri, options, HttpMethod.DELETE);
    } catch (e) {
      return e.response.body;
    }
    return result.body;
  }
}
