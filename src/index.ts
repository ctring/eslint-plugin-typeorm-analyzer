import findRepositoryApi from './rules/find-repository-api';
import findSchema from './rules/find-schema';

export = {
  rules: {
    'find-schema': findSchema,
    'find-repository-api': findRepositoryApi
  }
};
