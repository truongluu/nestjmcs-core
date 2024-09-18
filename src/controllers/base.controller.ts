import { ConfigService } from '@nestjs/config';
import { BaseListParamsDto } from '../dtos/base-list-params.dto';

export class BaseController {
  constructor(private readonly configService: ConfigService) {}
  pageSize = 15;

  getParamsForList<T extends BaseListParamsDto>(queries: T) {
    if (this.configService.get('app.pageSize')) {
      this.pageSize = this.configService.get('app.pageSize');
    }
    const newQueries = { ...queries };
    if (!newQueries.currentPage) {
      newQueries.currentPage = 1;
    }
    if (!newQueries.pageSize) {
      newQueries.pageSize = this.pageSize;
    }
    return newQueries;
  }
}
