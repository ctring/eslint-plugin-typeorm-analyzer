import { ESLintUtils } from '@typescript-eslint/utils';
import findSchema from '../../src/rules/find-schema';
import { EntityMessage } from '../../src/message';

const ruleTester = new ESLintUtils.RuleTester({
  parser: '@typescript-eslint/parser'
});

ruleTester.run('find-schema', findSchema, {
  valid: [
    {
      code: 'class User {}'
    }
  ],
  invalid: [
    {
      code: `
      @Entity()
      class User {
        @PrimaryGeneratedColumn()
        id: number;

        @Column()
        name: string;

        @Column()
        email: string;
      }
      `,
      errors: [
        {
          messageId: 'json',
          data: {
            message: new EntityMessage('User')
          }
        }
      ]
    }
  ]
});
