import {
  ArgumentMetadata,
  BadRequestException,
  HttpStatus,
  Injectable,
  Optional,
  PipeTransform,
  ValidationPipeOptions
  } from '@nestjs/common';
import { HttpException } from '@nestjs/common/exceptions/http.exception';
import { classToPlain, ClassTransformOptions, plainToClass } from 'class-transformer';
import { validate, ValidatorOptions } from 'class-validator';
import { isNil } from '../shared/utils';

@Injectable()
export class ValidationPipe implements PipeTransform<any> {
  protected isTransformEnabled: boolean;
  protected validatorOptions: ValidatorOptions;
  protected transformOptions: ClassTransformOptions;
  protected validateCustomDecorators: boolean;

  constructor(@Optional() options?: ValidationPipeOptions) {
    options = options || {};
    const {
      transform,
      transformOptions,
      validateCustomDecorators,
      ...validatorOptions
    } = options;
    this.isTransformEnabled = !!transform;
    this.validatorOptions = validatorOptions;
    this.transformOptions = transformOptions;
    this.validateCustomDecorators = validateCustomDecorators || false;
  }
  async transform(value, metadata: ArgumentMetadata) {

    if (!value) {
      throw new BadRequestException('No data submitted');
    }
    value = this.toEmptyIfNil(value);

    const { metatype } = metadata;
    if (!metatype || !this.toValidate(metadata)) {
      return value;
    }
    const isPrimitive = this.isPrimitive(value)
    let object = plainToClass(metatype, value, this.transformOptions);
    const originalEntity = object;
    const isCtorNotEqual = object.constructor !== metatype;

    if (isCtorNotEqual && !isPrimitive) {
      object.constructor = metatype;
    } else if (isCtorNotEqual) {
      // when "entity" is a primitive value, we have to temporarily
      // replace the entity to perform the validation against the original
      // metatype defined inside the handler
      object = { constructor: metatype };
    }
    const errors = await validate(object, this.validatorOptions);
    if (errors.length > 0) {
      throw new HttpException({ message: 'Input data validation failed', errors: this.buildError(errors) }, HttpStatus.BAD_REQUEST);
    }
    if (isPrimitive) {
      // if the value is a primitive value and the validation process has been successfully completed
      // we have to revert the original value passed through the pipe
      object = originalEntity;
    }
    return this.isTransformEnabled
      ? object
      : Object.keys(this.validatorOptions).length > 0
        ? classToPlain(object, this.transformOptions)
        : value;
  }

  private buildError(errors) {
    const result = {};
    errors.forEach(el => {
      let prop = el.property;
      Object.entries(el.constraints).forEach(constraint => {
        result[prop + constraint[0]] = `${constraint[1]}`;
      });
    });
    return result;
  }

  private toValidate(metadata): boolean {
    const { metatype, type } = metadata;
    if (type === 'custom' && !this.validateCustomDecorators) {
      return false;
    }
    const types = [String, Boolean, Number, Array, Object];
    return !types.some(t => metatype === t) && !isNil(metatype);
  }

  private stripProtoKeys(value: Record<string, any>) {
    delete value.__proto__;
    const keys = Object.keys(value);
    keys
      .filter(key => typeof value[key] === 'object' && value[key])
      .forEach(key => this.stripProtoKeys(value[key]));
  }

  private toEmptyIfNil<T = any, R = any>(value: T): R | {} {
    return isNil(value) ? {} : value;
  }

  private isPrimitive(value: unknown): boolean {
    return ['number', 'boolean', 'string'].includes(typeof value);
  }
}
