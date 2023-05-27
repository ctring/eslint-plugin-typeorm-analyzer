import { ESLintUtils } from '@typescript-eslint/utils';
import findApi from '../../src/rules/find-api';
import { Attribute, MethodMessage } from '../../src/messages';

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
              [
                new Attribute('address', 8, 8, 8, 17),
                new Attribute('age', 7, 8, 7, 11),
                new Attribute('name', 6, 8, 6, 12),
                new Attribute('occupation', 13, 10, 13, 22)
              ]
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
              [
                new Attribute('firstname', 9, 23, 9, 32),
                new Attribute('lastname', 9, 44, 9, 52)
              ]
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
              [new Attribute('name', 7, 10, 7, 14)]
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
              [
                new Attribute('firstname', 12, 10, 12, 19),
                new Attribute('lastname', 14, 10, 14, 18)
              ]
            )
          }
        }
      ]
    }
  ]
});
