export class JsonMessage {
  constructor(public readonly type: string) {}

  toString(): string {
    return JSON.stringify(this);
  }
}

export class EntityMessage extends JsonMessage {
  constructor(public readonly name: string) {
    super('entity');
  }

  static validate(message: JsonMessage): message is EntityMessage {
    return message.type === 'entity';
  }
}

export class MethodMessage extends JsonMessage {
  constructor(
    public readonly name: string,
    public readonly methodType: 'read' | 'write' | 'other',
    public readonly callee: string[]
  ) {
    super('method');
  }

  static validate(message: JsonMessage): message is MethodMessage {
    return message.type === 'method';
  }
}
