import { ESLintUtils } from '@typescript-eslint/utils';
import findSchema from '../../src/rules/find-schema';

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
          messageId: 'entity',
          data: {
            name: 'User'
          }
        }
      ]
    }
  ]
});
