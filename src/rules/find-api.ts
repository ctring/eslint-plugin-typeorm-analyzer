import {
  AST_NODE_TYPES,
  ESLintUtils,
  TSESTree
} from '@typescript-eslint/utils';
import { MethodMessage } from '../messages';
import { createMeta, createReport } from '../messages/utils';

const REPOSITORY_API_READ = [
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
  'findOneByOrFail'
];

const REPOSITORY_API_WRITE = [
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
  'clear'
];

const REPOSITORY_API_OTHER = ['createQueryBuilder', 'query'];

// Filters out all method calls that are not part of the Repository API.
function filterRepositoryApiMethods(
  method: TSESTree.PrivateIdentifier | TSESTree.Expression
): [string, 'read' | 'write' | 'other'] | undefined {
  let name: string | undefined;
  if (method.type === AST_NODE_TYPES.Identifier) {
    name = method.name;
  } else if (method.type === AST_NODE_TYPES.Literal) {
    name = method.value?.toString();
  }

  if (name === undefined) {
    return undefined;
  }

  if (REPOSITORY_API_READ.includes(name)) {
    return [name, 'read'];
  }

  if (REPOSITORY_API_WRITE.includes(name)) {
    return [name, 'write'];
  }

  if (REPOSITORY_API_OTHER.includes(name)) {
    return [name, 'other'];
  }

  return undefined;
}

const findApi = ESLintUtils.RuleCreator.withoutDocs({
  create(context) {
    return {
      CallExpression(node) {
        // Return if this is not a method call.
        if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
          return;
        }

        const obj = node.callee.object;
        const methodAndType = filterRepositoryApiMethods(node.callee.property);

        // Return if the method does not belong to the Repository API.
        if (methodAndType === undefined) {
          return;
        }

        const [method, methodType] = methodAndType;

        const parserServices = ESLintUtils.getParserServices(context);
        const checker = parserServices.program.getTypeChecker();
        const objType = checker.getTypeAtLocation(
          parserServices.esTreeNodeToTSNodeMap.get(obj)
        );

        // Get the type of the callee.
        let allTypes = [checker.typeToString(objType)];

        // Collect all base types.
        const symbol = objType.getSymbol();
        if (symbol !== undefined) {
          const baseTypes = checker
            .getDeclaredTypeOfSymbol(symbol)
            .getBaseTypes();
          if (baseTypes !== undefined) {
            for (const type of baseTypes) {
              allTypes.push(checker.typeToString(type));
            }
          }
        }

        context.report(
          createReport(node, new MethodMessage(method, methodType, allTypes))
        );
      }
    };
  },

  meta: createMeta('Reports all method calls of the repository API.'),

  defaultOptions: []
});

export default findApi;
