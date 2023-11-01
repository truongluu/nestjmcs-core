import { ApiProperty } from '@nestjs/swagger';
import { ArrayNotEmpty } from 'class-validator';

export class IdsCommonDto {
  @ApiProperty({ type: Array })
  @ArrayNotEmpty()
  readonly ids: string[];
}
