import {PipeTransform, ArgumentMetadata, BadRequestException, Injectable} from '@nestjs/common';
import { Types } from 'mongoose';

@Injectable()
export class ValidationObjectIdPipe implements PipeTransform<any> {
  async transform(value, metadata: ArgumentMetadata) {

    if (!value) {
      throw new BadRequestException('No data submitted');
    }

    if (!Types.ObjectId.isValid(value)) {
      throw new BadRequestException('Invalid ObjectId');
    }
    return value;
  }
}
