import { TSESTree } from '@typescript-eslint/utils';
import {
  ReportDescriptor,
  RuleMetaData
} from '@typescript-eslint/utils/dist/ts-eslint';

export function createMeta(description: string): RuleMetaData<'json'> {
  return {
    docs: {
      description,
      recommended: 'warn'
    },
    messages: {
      json: '{{ message }}'
    },
    type: 'suggestion',
    schema: []
  };
}

export function createReport(
  node: TSESTree.Node,
  message: JsonMessage
): ReportDescriptor<'json'> {
  return {
    // Use the 'json' message in the meta object.
    messageId: 'json',
    data: {
      message
    },
    node
  };
}

class JsonMessage {
  private type: string;
  constructor(type: string) {
    this.type = type;
  }
  toString() {
    return JSON.stringify(this);
  }
}

export class EntityMessage extends JsonMessage {
  private name: string;
  constructor(name: string) {
    super('entity');
    this.name = name;
  }
}

export class MethodMessage extends JsonMessage {
  private name: string;
  private callee: string;
  constructor(name: string, callee: string) {
    super('method');
    this.name = name;
    this.callee = callee;
  }
}
