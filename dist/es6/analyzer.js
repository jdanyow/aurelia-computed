export class Analyzer {
  constructor() {
    this.canObserve = true;
    this.reason = '';
  }

  static analyze(expression) {
    var visitor = new Analyzer();
    expression.accept(visitor);
    return {
      expression: expression,
      canObserve: visitor.canObserve,
      reason: visitor.reason
    };
  }

  visitArgs(args) {
    var i, length;
    for (i = 0, length = args.length; i < length; ++i) {
      args[i].accept(this);
    }
  }

  visitChain(chain) {
    var expressions = chain.expressions,
        length = expressions.length,
        i;

    for (i = 0; i < length; ++i) {
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
    var elements = literal.elements,
        length = elements.length,
        i;
    for (i = 0; i < length; ++i) {
      elements[i].accept(this);
    }
  }

  visitLiteralObject(literal) {
    var keys = literal.keys,
        values = literal.values,
        length = keys.length,
        i;
    for (i = 0; i < length; ++i) {
      values[i].accept(this);
    }
  }

  visitLiteralString(literal) {
  }
}
