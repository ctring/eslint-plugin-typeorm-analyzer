import { ESLintUtils } from '@typescript-eslint/utils';

const findSchema = ESLintUtils.RuleCreator.withoutDocs({
  create(context) {
    return {
      ClassDeclaration(node) {
        if (!node.decorators) {
          return;
        }
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
      entity: '{ type: "entity", name: "{{ name }}" }'
    },
    type: 'suggestion',
    schema: []
  },

  defaultOptions: []
});

export default findSchema;
