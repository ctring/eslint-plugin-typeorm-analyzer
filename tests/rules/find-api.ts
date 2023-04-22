import { ESLintUtils } from '@typescript-eslint/utils';
import findApi from '../../src/rules/find-api';
import { MethodMessage } from '../../src/messages';

const ruleTester = new ESLintUtils.RuleTester({
  parser: '@typescript-eslint/parser',
  parserOptions: {
    project: 'test-tsconfig.json',
    tsconfigRootDir: __dirname + '/..'
  }
});

ruleTester.run('find-repository-api', findApi, {
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
            message: new MethodMessage('save', 'write', ['any'])
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
            message: new MethodMessage('findOne', 'read', ['Repository<User>'])
          }
        }
      ]
    },
    {
      code: `
      class Repository<T> {}
      class Cat extends Repository<Animal> {
        doSave() {
          return this.save();
        }
      }
      let cat = new Cat();
      cat.create();
      `,
      errors: [
        {
          messageId: 'json',
          data: {
            message: new MethodMessage('save', 'write', [
              'this',
              'Repository<Animal>'
            ])
          }
        },
        {
          messageId: 'json',
          data: {
            message: new MethodMessage('create', 'write', [
              'Cat',
              'Repository<Animal>'
            ])
          }
        }
      ]
    }
  ]
});
