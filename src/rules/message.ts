import { RuleMetaData } from '@typescript-eslint/utils/dist/ts-eslint';

export function createMeta(description: string): RuleMetaData<'json'> {
  return {
    docs: {
      description,
      recommended: 'warn'
    },
    messages: {
      json: '{{ json }}'
    },
    type: 'suggestion',
    schema: []
  };
}

export class JsonMessage {
  constructor(public type: string, public name?: string) {}

  toString() {
    return JSON.stringify(this);
  }
}
