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

ruleTester.run('find-api', findApi, {
  valid: [
    {
      code: 'repository.noFind()'
    }
  ],
  invalid: [
    {
      code: `
      class Repository<T> {}
      class User {}
      let repository = new Repository<User>();
      repository.findOneBy({
        name: "John",
        age: 18,
        "address": {
          "street": "Main Street",
          "city": "New York"  
        },
        ...{
          "occupation": "Developer"
        }
      });
      `,
      errors: [
        {
          messageId: 'json',
          data: {
            message: new MethodMessage(
              'findOneBy',
              'read',
              ['Repository<User>'],
              ['address', 'age', 'name', 'occupation']
            )
          }
        }
      ]
    },
    {
      code: `
      class Repository<T> {}
      class User extends Repository<Person> {
        doSave() {
          return this.save();
        }
      }
      let user = new User();
      user.increment([{firstname: "John"}, {lastname: "Doe"}], "age", 1);
      `,
      errors: [
        {
          messageId: 'json',
          data: {
            message: new MethodMessage(
              'save',
              'write',
              ['this', 'Repository<Person>'],
              []
            )
          }
        },
        {
          messageId: 'json',
          data: {
            message: new MethodMessage(
              'increment',
              'write',
              ['User', 'Repository<Person>'],
              ['firstname', 'lastname']
            )
          }
        }
      ]
    },
    {
      code: `
      class Repository<T> {}
      class User {}
      let repository = new Repository<User>();
      repository.count({
        where: {
          name: "John",
        }
      });
      repository.findAndCount({
        where: [{
          firstname: "John",
        }, {
          lastname: "Doe",
        }]
      });
      `,
      errors: [
        {
          messageId: 'json',
          data: {
            message: new MethodMessage(
              'count',
              'read',
              ['Repository<User>'],
              ['name']
            )
          }
        },
        {
          messageId: 'json',
          data: {
            message: new MethodMessage(
              'findAndCount',
              'read',
              ['Repository<User>'],
              ['firstname', 'lastname']
            )
          }
        }
      ]
    }
  ]
});
