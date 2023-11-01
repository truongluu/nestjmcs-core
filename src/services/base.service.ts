import { Injectable } from '@nestjs/common';
import { DeleteResult, ObjectId } from 'mongodb';
import { FilterQuery, Model, UpdateQuery } from 'mongoose';
import * as slug from 'slug';
import { BaseListParamsDto } from '../dtos/base-list-params.dto';
import { IBaseSchema } from '../interfaces';
import { IdsCommonDto } from '../shared/dto/ids-common.dto';

interface IPopulate {
  path: string;
  select?: string[];
}

@Injectable()
export class BaseService<MT extends IBaseSchema = IBaseSchema>{
  protected baseModel: Model<MT>;
  
  async getAll<T extends BaseListParamsDto>(
    baseModel: Model<MT>,
    queries: T,
    returnQuery: boolean = false,
    searchFullField: string[] = ['slugName'],
  ) {
    
    let total = (baseModel || this.baseModel).countDocuments();
    let query = (baseModel || this.baseModel)
      .find({} as any)
      .skip((+queries.currentPage - 1) * +queries.pageSize)
      .limit(+queries.pageSize);
    if (queries.fields) {
      const selectedFields = queries.fields
        .split(',')
        .map(v => v.replace(/\s+/g, ''));
      query = query.select(selectedFields);
    }
    if (queries.name) {
      const slugName = slug(queries.name, { lower: true });
      if (searchFullField.length) {
        const searchOr = [];
        searchFullField.forEach(searchField => {
          searchOr.push({ [searchField]: { $regex: slugName, $options: 'i' } });
        });
        query = query.or(searchOr);
        total = total.or(searchOr);
      }
    }
    if (queries.status !== undefined) {
      query = query.where('status', +queries.status);
      total = total.where('status', +queries.status);
    }
    if (queries.deleted !== undefined) {
      query = query.where('deleted', +queries.deleted);
      total = total.where('deleted', +queries.deleted);
    }
    if (queries.sort) {
      query = query.sort(queries.sort);
    } else {
      query = query.sort('-createdAt');
    }
    let queryDate = { $gte: undefined, $lte: undefined };
    if (queries.startDate && typeof queries.startDate != 'undefined') {
      queryDate = { ...queryDate, $gte: new Date(+queries.startDate) };
    } else {
      delete queryDate.$gte;
    }
    if (queries.endDate && typeof queries.endDate != 'undefined') {
      queryDate = { ...queryDate, $lte: new Date(+queries.endDate) };
    } else {
      delete queryDate.$lte;
    }
    if (queryDate.$gte || queryDate.$lte) {
      query = query.where('createdAt', queryDate);
      total = total.where('createdAt', queryDate);
    }
    if (queries.populates) {
      const populateCaches = {};
      queries.populates
        .split(',')
        .map(v => v.replace(/\s+/g, ''))
        .forEach(populate => {
          if (populate) {
            const populateParts = populate.split('.');
            if (populateParts[0] && !populateCaches[populateParts[0]]) {
              populateCaches[populateParts[0]] = {
                path: populateParts[0],
                select: [],
              };
            }
            if (populateParts[1]) {
              populateCaches[populateParts[0]].select.push(populateParts[1]);
            }
          }
        });
      if (Object.keys(populateCaches).length) {
        const finalPopulates = [];
        Object.values(populateCaches).forEach((populateItem: IPopulate) => {
          const populateItemTemp = { path: populateItem.path, select: '' };
          if (populateItem.select.length) {
            populateItemTemp.select = populateItem.select.join(' ');
          } else {
            delete populateItemTemp.select;
          }
          finalPopulates.push(populateItemTemp);
        });

        if (finalPopulates.length) {
          query = query.populate(finalPopulates);
        }
      }
    }

    if (returnQuery) {
      return {
        query,
        total,
      };
    }
    return {
      list: await query.exec(),
      pagination: {
        total: await total.exec(),
        pageSize: +queries.pageSize,
        current: +queries.currentPage || 1,
      },
    };
  }

  async detail(baseModelId: string) {
    return await this.baseModel
      .findById(baseModelId)
      .lean()
      .exec();
  }

  
  async removeSingle(objectId: ObjectId):Promise<DeleteResult> {
    return await this.baseModel.deleteOne({ _id: objectId } as FilterQuery<MT>).exec();
  }
  
  
  async removeMultiple(ids: IdsCommonDto): Promise<DeleteResult> {
    return this.baseModel.deleteMany({ _id: ids} as FilterQuery<MT>).exec();
  }

  softRemoveSingle(objectId: ObjectId): Promise<{}> {
    return this.baseModel.updateOne({ _id: objectId} as FilterQuery<MT>, { deleted: true } as UpdateQuery<MT>).exec();
  }


  softRemoveMultiple(ids: IdsCommonDto): Promise<{}> {
    return this.baseModel.updateMany({ _id: ids.ids } as FilterQuery<MT>, { deleted: true } as UpdateQuery<MT>).exec();
  }
}