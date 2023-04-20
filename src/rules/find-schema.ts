import { ESLintUtils } from '@typescript-eslint/utils';
import { JsonMessage, createMeta } from './message';

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
              messageId: 'json',
              node: node,
              data: {
                json: new JsonMessage('entity', node.id?.name).toString()
              }
            });
          }
        }
      }
    };
  },

  meta: createMeta('Reports all method calls of the repository API.'),

  defaultOptions: []
});

export default findSchema;
