import { applyDecorators, Type } from '@nestjs/common';
import {
  ApiOkResponse,
  ApiCreatedResponse,
  getSchemaPath,
  ApiExtraModels,
} from '@nestjs/swagger';

export class PaginatedResponseDto<T> {
  items: T[];
  meta: {
    total: number;
    page: number;
    limit: number;
    totalPages: number;
    hasNext: boolean;
    hasPrevious: boolean;
  };
}

export const ApiPaginatedResponse = <TModel extends Type<any>>(
  model: TModel,
) => {
  return applyDecorators(
    ApiExtraModels(model),
    ApiOkResponse({
      schema: {
        properties: {
          success: { type: 'boolean' },
          data: {
            type: 'array',
            items: { $ref: getSchemaPath(model) },
          },
          meta: {
            type: 'object',
            properties: {
              total: { type: 'number' },
              page: { type: 'number' },
              limit: { type: 'number' },
              totalPages: { type: 'number' },
              hasNext: { type: 'boolean' },
              hasPrevious: { type: 'boolean' },
              timestamp: { type: 'string' },
              path: { type: 'string' },
            },
          },
        },
      },
    }),
  );
};

export const ApiStandardResponse = <TModel extends Type<any>>(
  model: TModel,
  status: 'ok' | 'created' = 'ok',
) => {
  const decorator = status === 'created' ? ApiCreatedResponse : ApiOkResponse;
  
  return applyDecorators(
    ApiExtraModels(model),
    decorator({
      schema: {
        properties: {
          success: { type: 'boolean' },
          data: { $ref: getSchemaPath(model) },
          meta: {
            type: 'object',
            properties: {
              timestamp: { type: 'string' },
              path: { type: 'string' },
            },
          },
        },
      },
    }),
  );
};
