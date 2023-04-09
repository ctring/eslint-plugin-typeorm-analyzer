export class JsonMessage {
  private name = '{{ name }}';
  constructor(public type: string) {}

  toString() {
    return JSON.stringify(this);
  }
}
