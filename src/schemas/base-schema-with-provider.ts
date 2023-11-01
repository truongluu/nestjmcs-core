import { getConnectionToken, getModelToken } from '@nestjs/mongoose/dist/common/mongoose.utils';
import { Model, Schema } from 'mongoose';

const BaseSchemaProvider = (modelName: string, baseschema: Schema, injectModels: string[], schemaMiddleWareFunc: Function) => {
  if (!injectModels.length) {
    throw new Error('injectModels param must be defined');
  }
  const modelNameWithToken = getModelToken(modelName);
  const modelInjectTokens = injectModels.map(modelName => getModelToken(modelName));
  return {
    provide: modelNameWithToken,
    useFactory: (connection, ...injectModels: Model<any>[]): Model<any> => {
      schemaMiddleWareFunc(injectModels);
      return connection.model(modelName, baseschema);
    },
    inject: [getConnectionToken(), ...modelInjectTokens]
  };
}

export {
  BaseSchemaProvider
}