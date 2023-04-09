import { ESLintUtils } from '@typescript-eslint/utils';
import { JsonMessage } from './message';
import { ReportDescriptor } from '@typescript-eslint/utils/dist/ts-eslint';

const findSchema = ESLintUtils.RuleCreator.withoutDocs({
  create(context) {
    return {
      // Select only class definitions.
      ClassDeclaration(node) {
        // Return if the class is not decorated.
        if (!node.decorators) {
          return;
        }
        // Find the @Entity() decorator.
        for (const decorator of node.decorators) {
          if (
            decorator.expression.type === 'CallExpression' &&
            decorator.expression.callee.type === 'Identifier' &&
            decorator.expression.callee.name === 'Entity'
          ) {
            context.report({
              messageId: 'entity',
              node: node,
              data: {
                name: node.id?.name
              }
            });
          }
        }
      }
    };
  },

  meta: {
    docs: {
      description:
        'Reports all class definitions that are decorated with @Entity().',
      recommended: 'warn'
    },
    messages: {
      entity: new JsonMessage('entity').toString()
    },
    type: 'suggestion',
    schema: []
  },

  defaultOptions: []
});

export default findSchema;
