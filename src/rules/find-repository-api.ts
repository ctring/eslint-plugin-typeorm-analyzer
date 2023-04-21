import {
  AST_NODE_TYPES,
  ESLintUtils,
  TSESTree
} from '@typescript-eslint/utils';
import { MethodMessage } from '../message';
import { createMeta, createReport } from '../message/utils';

const REPOSITORY_API = [
  'createQueryBuilder',
  'create',
  'merge',
  'preload',
  'save',
  'remove',
  'insert',
  'update',
  'upsert',
  'delete',
  'increment',
  'decrement',
  'count',
  'countBy',
  'sum',
  'average',
  'minimum',
  'maximum',
  'find',
  'findBy',
  'findAndCount',
  'findAndCountBy',
  'findOne',
  'findOneBy',
  'findOneOrFail',
  'findOneByOrFail',
  'query',
  'clear'
];

// Filters out all method calls that are not part of the Repository API.
function filterRepositoryApiMethods(
  method: TSESTree.PrivateIdentifier | TSESTree.Expression
) {
  let name: string | undefined;
  if (method.type === AST_NODE_TYPES.Identifier) {
    name = method.name;
  } else if (method.type === AST_NODE_TYPES.Literal) {
    name = method.value?.toString();
  }

  if (name !== undefined && !REPOSITORY_API.includes(name)) {
    name = undefined;
  }

  return name;
}

const findRepositoryApi = ESLintUtils.RuleCreator.withoutDocs({
  create(context) {
    return {
      CallExpression(node) {
        // Return if this is not a method call.
        if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
          return;
        }

        const obj = node.callee.object;
        const method = filterRepositoryApiMethods(node.callee.property);

        // Return if the method does not belong to the Repository API.
        if (method === undefined) {
          return;
        }

        // Collect type information of the callee.
        const parserServices = ESLintUtils.getParserServices(context);
        const checker = parserServices.program.getTypeChecker();
        const objType = checker.getTypeAtLocation(
          parserServices.esTreeNodeToTSNodeMap.get(obj)
        );

        context.report(
          createReport(
            node,
            new MethodMessage(method, checker.typeToString(objType))
          )
        );
      }
    };
  },

  meta: createMeta('Reports all method calls of the repository API.'),

  defaultOptions: []
});

export default findRepositoryApi;
