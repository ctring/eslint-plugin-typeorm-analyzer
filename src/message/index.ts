export class JsonMessage {
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
