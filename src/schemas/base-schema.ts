import { Query, Schema, SchemaDefinition, SchemaOptions, UpdateQuery } from 'mongoose';
import * as slug from 'slug';
import { BaseStatus } from '../constants/base-status';
import { IBaseSchema } from '../interfaces/base-schema.interface';

class BaseSchema extends Schema {
  constructor(definition?: SchemaDefinition, options?: SchemaOptions) {
    super(definition, options);
    if (definition) {
      if (!definition.status) {
        this.add({
          status: {
            type: Number,
            enum: [BaseStatus.Active, BaseStatus.InActive],
            default: BaseStatus.Active,
          },
        });
      }
      if (definition.deleted && !definition.deletedAt) {
        this.add({
          deletedAt: { type: Date, default: Date.now() },
        });
      }
    }
    this.pre<IBaseSchema>('save', async function(next) {
      try {
        if (definition.slugName) {
          this.slugName = slug(this.name, { lower: true });
        }
        next();
      } catch (err) {
        next(err);
      }
    });

    this.pre<IBaseSchema>('insertMany', async function(next) {
      try {
        if (definition.slugName) {
          this.slugName = slug(this.name, { lower: true });
        }
        next();
      } catch (err) {
        next(err);
      }
    });

    ['updateMany', 'updateOne'].forEach(method => {
      this.pre<Query<IBaseSchema, IBaseSchema>>(method, function(next) {
        try {
          let updateData;
          const updated = this.getUpdate() as UpdateQuery<IBaseSchema>;
          if (definition.slugName && updated.name) {
            updateData = { slugName: slug(updated.name, { lower: true }) };
          }
          if (updated.deleted) {
            updateData = { ...updateData, deletedAt: Date.now() };
          }
          if (updateData) {
            this.update(updateData);
          }
          next();
        } catch (err) {
          next(err);
        }
      });
    });

    this.pre('find', function() {
      const queries = this.getQuery();
      if (definition.deleted && queries.deleted === undefined) {
        this.where('deleted', false);
      }
    });

    this.pre('countDocuments', function() {
      const queries = this.getQuery();
      if (definition.deleted && queries.deleted === undefined) {
        this.where('deleted', false);
      }
    });

    this.set('toJSON', {
      transform: function(doc, ret, opt) {
        ret['key'] = ret['_id'];
        return ret;
      },
    });
    if (definition.slugName) {
      this.index({ slugName: 1 });
    }
  }
}

export { BaseSchema };
