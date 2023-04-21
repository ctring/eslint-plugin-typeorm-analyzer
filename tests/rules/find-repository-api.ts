import { ESLintUtils } from '@typescript-eslint/utils';
import findRepositoryApi from '../../src/rules/find-repository-api';
import { MethodMessage } from '../../src/messages';

const ruleTester = new ESLintUtils.RuleTester({
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'test-tsconfig.json',
    tsconfigRootDir: __dirname + '/..'
  }
});

ruleTester.run('find-repository-api', findRepositoryApi, {
  valid: [
    {
      code: 'repository.noFind()'
    }
  ],
  invalid: [
    {
      code: `
      user.save();
      `,
      errors: [
        {
          messageId: 'json',
          data: {
            message: new MethodMessage('save', 'any')
          }
        }
      ]
    },
    {
      code: `
      class Repository<T> {}
      class User {}
      let repository = new Repository<User>();
      repository.findOne();
      `,
      errors: [
        {
          messageId: 'json',
          data: {
            message: new MethodMessage('findOne', 'Repository<User>')
          }
        }
      ]
    }
  ]
});
