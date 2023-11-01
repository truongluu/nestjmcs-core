import { SwaggerEnumType } from '@nestjs/swagger/dist/types/swagger-enum.type';
import { ApiImplicitQueries } from 'nestjs-swagger-api-implicit-queries-decorator';
import { defaultParamsField } from '../constants/field';

export const ApiImplicitParamsQueryDecorator = (fields?: {
  name: string;
  description?: string;
  required?: boolean;
  type?: any;
  isArray?: boolean;
  enum?: SwaggerEnumType;
  collectionFormat?: "csv" | "ssv" | "tsv" | "pipes" | "multi";
}[]) => {
  if (fields && fields.length) {
    return ApiImplicitQueries([
      ...fields,
      ...defaultParamsField
    ]);
  }
  return ApiImplicitQueries(defaultParamsField); 
};