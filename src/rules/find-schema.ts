import { AST_NODE_TYPES, ESLintUtils } from '@typescript-eslint/utils';
import { EntityMessage, createMeta, createReport } from './message';

const findSchema = ESLintUtils.RuleCreator.withoutDocs({
  create(context) {
    return {
      // Select only class definitions.
      ClassDeclaration(node) {
        // Return if the class is not decorated.
        if (!node.decorators || !node.id) {
          return;
        }

        // Find the @Entity() decorator.
        for (const decorator of node.decorators) {
          if (
            decorator.expression.type === AST_NODE_TYPES.CallExpression &&
            decorator.expression.callee.type === AST_NODE_TYPES.Identifier &&
            decorator.expression.callee.name === 'Entity'
          ) {
            context.report(createReport(node, new EntityMessage(node.id.name)));
          }
          break;
        }
      }
    };
  },

  meta: createMeta(
    'Reports all class definitions that are decorated with @Entity().'
  ),

  defaultOptions: []
});

export default findSchema;
