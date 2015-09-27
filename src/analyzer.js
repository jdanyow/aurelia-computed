export class Analyzer {
  constructor() {
    this.canObserve = true;
    this.reason = '';
  }

  static analyze(expression) {
    let visitor = new Analyzer();
    expression.accept(visitor);
    return {
      expression: expression,
      canObserve: visitor.canObserve,
      reason: visitor.reason
    };
  }

  visitArgs(args) {
    for (let i = 0, length = args.length; i < length; ++i) {
      args[i].accept(this);
    }
  }

  visitChain(chain) {
    let expressions = chain.expressions;

    for (let i = 0, length = expressions.length; i < length; ++i) {
      expressions[i].accept(this);
    }
  }

  visitValueConverter(converter) {
    // this should never happen.
  }

  visitAssign(assign) {
    assign.target.accept(this);
    assign.value.accept(this);
  }

  visitConditional(conditional) {
    conditional.condition.accept(this);
    conditional.yes.accept(this);
    conditional.no.accept(this);
  }

  visitAccessScope(access) {
    if (access.name !== 'this') {
      this.canObserve = false;
      this.reason += `'${access.name}' can't be accessed from the binding scope.  `;
    }
  }

  visitAccessMember(access) {
    access.object.accept(this);
  }

  visitAccessKeyed(access) {
    access.object.accept(this);
    access.key.accept(this);
  }

  visitCallScope(call) {
    this.visitArgs(call.args);
  }

  visitCallFunction(call) {
    call.func.accept(this);
    this.visitArgs(call.args);
  }

  visitCallMember(call) {
    call.object.accept(this);
    this.visitArgs(call.args);
  }

  visitPrefix(prefix) {
    prefix.expression.accept(this);
  }

  visitBinary(binary) {
    binary.left.accept(this);
    binary.right.accept(this);
  }

  visitLiteralPrimitive(literal) {
  }

  visitLiteralArray(literal) {
    let elements = literal.elements;
    for (let i = 0, length = elements.length; i < length; ++i) {
      elements[i].accept(this);
    }
  }

  visitLiteralObject(literal) {
    let keys = literal.keys;
    let values = literal.values;

    for (let i = 0, length = keys.length; i < length; ++i) {
      values[i].accept(this);
    }
  }

  visitLiteralString(literal) {
  }
}
