import {
  AST_NODE_TYPES,
  ESLintUtils,
  TSESTree,
  ParserServices
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

const REPOSITORY_API_TRANSACTION = ['transaction', 'startTransaction'];

// Filters out all method calls that are not part of the Repository API.
function filterRepositoryApiMethods(
  method: TSESTree.PrivateIdentifier | TSESTree.Expression
): [string, 'read' | 'write' | 'other' | 'transaction'] | undefined {
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

  if (REPOSITORY_API_TRANSACTION.includes(name)) {
    return [name, 'transaction'];
  }

  return undefined;
}

function getType(parserServices: ParserServices, node: TSESTree.Node) {
  return parserServices.program
    .getTypeChecker()
    .getTypeAtLocation(parserServices.esTreeNodeToTSNodeMap.get(node));
}

function parseCalleeTypes(
  parserServices: ParserServices,
  calleeObj: TSESTree.Expression
) {
  const objType = getType(parserServices, calleeObj);
  const checker = parserServices.program.getTypeChecker();
  const allTypes = [checker.typeToString(objType)];
  const symbol = objType.getSymbol();
  if (symbol !== undefined) {
    const baseTypes = checker.getDeclaredTypeOfSymbol(symbol).getBaseTypes();
    if (baseTypes !== undefined) {
      for (const type of baseTypes) {
        allTypes.push(checker.typeToString(type));
      }
    }
  }
  return allTypes;
}

function parseFindOptionsWhere(
  arg: TSESTree.Expression | TSESTree.SpreadElement
): Set<string> {
  const columns: string[] = [];
  switch (arg.type) {
    case AST_NODE_TYPES.SpreadElement:
      columns.push(...parseFindOptionsWhere(arg.argument));
      break;
    case AST_NODE_TYPES.ArrayExpression:
      for (const element of arg.elements) {
        if (element === null) {
          continue;
        }
        columns.push(...parseFindOptionsWhere(element));
      }
      break;
    case AST_NODE_TYPES.ObjectExpression:
      for (const property of arg.properties) {
        if (property.type === AST_NODE_TYPES.SpreadElement) {
          columns.push(...parseFindOptionsWhere(property));
        } else {
          if (property.key.type === AST_NODE_TYPES.Identifier) {
            columns.push(property.key.name);
          } else if (property.key.type === AST_NODE_TYPES.Literal) {
            if (property.key.value !== null) {
              const col = property.key.value.toString();
              if (col !== '') {
                columns.push(col);
              }
            }
          }
        }
      }
      break;
  }
  return new Set(columns);
}

function parseLookupColumns(
  method: string,
  args: TSESTree.CallExpressionArgument[]
): Set<string> {
  const columns: string[] = [];
  if (method === 'findOneBy') {
    for (const arg of args) {
      columns.push(...parseFindOptionsWhere(arg));
    }
  }
  return new Set(columns);
}

const findApi = ESLintUtils.RuleCreator.withoutDocs({
  create(context) {
    return {
      CallExpression(node) {
        // Return if this is not a method call.
        if (node.callee.type !== AST_NODE_TYPES.MemberExpression) {
          return;
        }

        // Check if the method belong to the Repository API.
        const methodAndType = filterRepositoryApiMethods(node.callee.property);
        if (methodAndType === undefined) {
          return;
        }

        const parserServices = ESLintUtils.getParserServices(context);

        const allTypes = parseCalleeTypes(parserServices, node.callee.object);

        const [method, methodType] = methodAndType;
        const columns = parseLookupColumns(method, node.arguments);

        context.report(
          createReport(
            node,
            new MethodMessage(
              method,
              methodType,
              allTypes,
              [...columns.values()].sort()
            )
          )
        );
      }
    };
  },

  meta: createMeta('Reports all method calls of the repository API.'),

  defaultOptions: []
});

export default findApi;
