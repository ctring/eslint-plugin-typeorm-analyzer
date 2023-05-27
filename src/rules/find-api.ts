import {
  AST_NODE_TYPES,
  ESLintUtils,
  TSESTree,
  ParserServices
} from '@typescript-eslint/utils';
import { Attribute, MethodMessage } from '../messages';
import { createMeta, createReport } from '../messages/utils';

const API_READ = [
  'countBy',
  'sum',
  'average',
  'minimum',
  'maximum',
  'findBy',
  'findAndCountBy',
  'findOneBy',
  'findOneByOrFail',
  'count',
  'exist',
  'find',
  'findAndCount',
  'findOne',
  'findOneOrFail',
  'findByIds',
  'findOneByIds'
];

const API_WRITE = [
  'clear',
  'create',
  'insert',
  'merge',
  'preload',
  'save',
  'softRemove',
  'recover',
  'remove',
  'upsert',
  'update',
  'delete',
  'increment',
  'decrement',
  'softDelete',
  'restore'
];

const API_OTHER = ['createQueryBuilder', 'query'];

const API_TRANSACTION = ['transaction', 'startTransaction'];

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

  if (API_READ.includes(name)) {
    return [name, 'read'];
  }

  if (API_WRITE.includes(name)) {
    return [name, 'write'];
  }

  if (API_OTHER.includes(name)) {
    return [name, 'other'];
  }

  if (API_TRANSACTION.includes(name)) {
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
): Set<Attribute> {
  const attributes: Attribute[] = [];
  switch (arg.type) {
    case AST_NODE_TYPES.SpreadElement:
      attributes.push(...parseFindOptionsWhere(arg.argument));
      break;
    case AST_NODE_TYPES.ArrayExpression:
      for (const element of arg.elements) {
        if (element === null) {
          continue;
        }
        attributes.push(...parseFindOptionsWhere(element));
      }
      break;
    case AST_NODE_TYPES.ObjectExpression:
      for (const property of arg.properties) {
        if (property.type === AST_NODE_TYPES.SpreadElement) {
          attributes.push(...parseFindOptionsWhere(property));
        } else {
          var name: string | undefined;
          if (property.key.type === AST_NODE_TYPES.Identifier) {
            name = property.key.name;
          } else if (property.key.type === AST_NODE_TYPES.Literal) {
            name = property.key.value?.toString();
          }
          if (name) {
            const loc = property.key.loc;
            attributes.push(
              new Attribute(
                name,
                loc.start.line,
                loc.start.column,
                loc.end.line,
                loc.end.column
              )
            );
          }
        }
      }
      break;
  }
  return new Set(attributes);
}

function parseFindOptions(
  args: TSESTree.Expression | TSESTree.SpreadElement
): Set<Attribute> {
  if (args.type === AST_NODE_TYPES.SpreadElement) {
    return parseFindOptions(args.argument);
  }
  if (args.type === AST_NODE_TYPES.ObjectExpression) {
    for (const property of args.properties) {
      if (
        property.type === AST_NODE_TYPES.Property &&
        property.key.type === AST_NODE_TYPES.Identifier &&
        property.key.name === 'where'
      ) {
        if (
          property.value.type === AST_NODE_TYPES.ObjectExpression ||
          property.value.type === AST_NODE_TYPES.ArrayExpression
        ) {
          return parseFindOptionsWhere(property.value);
        } else if (
          property.value.type === AST_NODE_TYPES.AssignmentExpression
        ) {
          return parseFindOptionsWhere(property.value.right);
        }
      }
    }
    // In the old versions of TypeORM, the FindOptionsWhere was sometimes used
    // in place of FindOptions.
    return parseFindOptionsWhere(args);
  }
  return new Set();
}

function parseLookupAttributes(
  method: string,
  args: TSESTree.CallExpressionArgument[]
): Set<Attribute> {
  const attributes: Attribute[] = [];
  switch (method) {
    case 'countBy':
    case 'findBy':
    case 'findAndCountBy':
    case 'findOneBy':
    case 'findOneByOrFail':
    case 'increment':
    case 'decrement':
    case 'update':
    case 'delete':
    case 'softDelete':
    case 'restore':
      if (args.length > 0) {
        attributes.push(...parseFindOptionsWhere(args[0]));
      }
      break;
    case 'count':
    case 'exist':
    case 'find':
    case 'findAndCount':
    case 'findOne':
    case 'findOneOrFail':
      if (args.length > 0) {
        attributes.push(...parseFindOptions(args[0]));
      }
      break;
    case 'sum':
    case 'average':
    case 'minimum':
    case 'maximum':
      if (args.length > 1) {
        attributes.push(...parseFindOptionsWhere(args[1]));
      }
      break;
  }
  return new Set(attributes);
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
        const attributes = parseLookupAttributes(method, node.arguments);

        context.report(
          createReport(
            node,
            new MethodMessage(
              method,
              methodType,
              allTypes,
              [...attributes.values()].sort((a, b) =>
                a.name.localeCompare(b.name)
              )
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
