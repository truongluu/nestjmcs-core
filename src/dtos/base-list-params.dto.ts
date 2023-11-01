import { ApiProperty } from '@nestjs/swagger';

export class BaseListParamsDto {
  @ApiProperty({ type: String, required: false })
  name: String;

  @ApiProperty({ type: Number, required: false })
  pageSize: number;

  @ApiProperty({ type: String, required: false })
  fields: String;

  @ApiProperty({ type: String, required: false })
  sort: String;

  @ApiProperty({ type: String, required: false })
  populates: String;

  @ApiProperty({ type: Number, required: false })
  currentPage: number;

  @ApiProperty({ type: Number, required: false })
  status: number;

  @ApiProperty({ type: Number, required: false })
  deleted: number;

  @ApiProperty({ type: Number, required: false })
  startDate: number;

  @ApiProperty({ type: Number, required: false })
  endDate: number;
}
