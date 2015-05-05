define(['exports'], function (exports) {
  'use strict';

  exports.__esModule = true;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var Analyzer = (function () {
    function Analyzer() {
      _classCallCheck(this, Analyzer);

      this.canObserve = true;
      this.reason = '';
    }

    Analyzer.analyze = function analyze(expression) {
      var visitor = new Analyzer();
      expression.accept(visitor);
      return {
        expression: expression,
        canObserve: visitor.canObserve,
        reason: visitor.reason
      };
    };

    Analyzer.prototype.visitArgs = function visitArgs(args) {
      var i, length;
      for (i = 0, length = args.length; i < length; ++i) {
        args[i].accept(this);
      }
    };

    Analyzer.prototype.visitChain = function visitChain(chain) {
      var expressions = chain.expressions,
          length = expressions.length,
          i;

      for (i = 0; i < length; ++i) {
        expressions[i].accept(this);
      }
    };

    Analyzer.prototype.visitValueConverter = function visitValueConverter(converter) {};

    Analyzer.prototype.visitAssign = function visitAssign(assign) {
      assign.target.accept(this);
      assign.value.accept(this);
    };

    Analyzer.prototype.visitConditional = function visitConditional(conditional) {
      conditional.condition.accept(this);
      conditional.yes.accept(this);
      conditional.no.accept(this);
    };

    Analyzer.prototype.visitAccessScope = function visitAccessScope(access) {
      if (access.name !== 'this') {
        this.canObserve = false;
        this.reason += '\'' + access.name + '\' can\'t be accessed from the binding scope.  ';
      }
    };

    Analyzer.prototype.visitAccessMember = function visitAccessMember(access) {
      access.object.accept(this);
    };

    Analyzer.prototype.visitAccessKeyed = function visitAccessKeyed(access) {
      access.object.accept(this);
      access.key.accept(this);
    };

    Analyzer.prototype.visitCallScope = function visitCallScope(call) {
      this.visitArgs(call.args);
    };

    Analyzer.prototype.visitCallFunction = function visitCallFunction(call) {
      call.func.accept(this);
      this.visitArgs(call.args);
    };

    Analyzer.prototype.visitCallMember = function visitCallMember(call) {
      call.object.accept(this);
      this.visitArgs(call.args);
    };

    Analyzer.prototype.visitPrefix = function visitPrefix(prefix) {
      prefix.expression.accept(this);
    };

    Analyzer.prototype.visitBinary = function visitBinary(binary) {
      binary.left.accept(this);
      binary.right.accept(this);
    };

    Analyzer.prototype.visitLiteralPrimitive = function visitLiteralPrimitive(literal) {};

    Analyzer.prototype.visitLiteralArray = function visitLiteralArray(literal) {
      var elements = literal.elements,
          length = elements.length,
          i;
      for (i = 0; i < length; ++i) {
        elements[i].accept(this);
      }
    };

    Analyzer.prototype.visitLiteralObject = function visitLiteralObject(literal) {
      var keys = literal.keys,
          values = literal.values,
          length = keys.length,
          i;
      for (i = 0; i < length; ++i) {
        values[i].accept(this);
      }
    };

    Analyzer.prototype.visitLiteralString = function visitLiteralString(literal) {};

    return Analyzer;
  })();

  exports.Analyzer = Analyzer;
});