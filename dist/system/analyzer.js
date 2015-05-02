System.register([], function (_export) {
  var Analyzer;

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  return {
    setters: [],
    execute: function () {
      'use strict';

      Analyzer = (function () {
        function Analyzer() {
          _classCallCheck(this, Analyzer);

          this.canObserve = true;
        }

        _createClass(Analyzer, [{
          key: 'visitArgs',
          value: function visitArgs(args) {
            var i, length;
            for (i = 0, length = args.length; i < length; ++i) {
              args[i].accept(this);
            }
          }
        }, {
          key: 'visitChain',
          value: function visitChain(chain) {
            var expressions = chain.expressions,
                length = expressions.length,
                i;

            for (i = 0; i < length; ++i) {
              expressions[i].accept(this);
            }
          }
        }, {
          key: 'visitValueConverter',
          value: function visitValueConverter(converter) {
            this.canObserve = false;
          }
        }, {
          key: 'visitAssign',
          value: function visitAssign(assign) {
            assign.target.accept(this);
            assign.value.accept(this);
          }
        }, {
          key: 'visitConditional',
          value: function visitConditional(conditional) {
            conditional.condition.accept(this);
            conditional.yes.accept(this);
            conditional.no.accept(this);
          }
        }, {
          key: 'visitAccessScope',
          value: function visitAccessScope(access) {
            if (access.name != 'this') {
              this.canObserve = false;
            }
          }
        }, {
          key: 'visitAccessMember',
          value: function visitAccessMember(access) {
            access.object.accept(this);
          }
        }, {
          key: 'visitAccessKeyed',
          value: function visitAccessKeyed(access) {
            access.object.accept(this);
            access.key.accept(this);
          }
        }, {
          key: 'visitCallScope',
          value: function visitCallScope(call) {
            this.visitArgs(call.args);
          }
        }, {
          key: 'visitCallFunction',
          value: function visitCallFunction(call) {
            call.func.accept(this);
            this.visitArgs(call.args);
          }
        }, {
          key: 'visitCallMember',
          value: function visitCallMember(call) {
            call.object.accept(this);
            this.visitArgs(call.args);
          }
        }, {
          key: 'visitPrefix',
          value: function visitPrefix(prefix) {
            prefix.expression.accept(this);
          }
        }, {
          key: 'visitBinary',
          value: function visitBinary(binary) {
            binary.left.accept(this);
            binary.right.accept(this);
          }
        }, {
          key: 'visitLiteralPrimitive',
          value: function visitLiteralPrimitive(literal) {}
        }, {
          key: 'visitLiteralArray',
          value: function visitLiteralArray(literal) {
            var elements = literal.elements,
                length = elements.length,
                i;
            for (i = 0; i < length; ++i) {
              elements[i].accept(this);
            }
          }
        }, {
          key: 'visitLiteralObject',
          value: function visitLiteralObject(literal) {
            var keys = literal.keys,
                values = literal.values,
                length = keys.length,
                i;
            for (i = 0; i < length; ++i) {
              values[i].accept(this);
            }
          }
        }, {
          key: 'visitLiteralString',
          value: function visitLiteralString(literal) {}
        }], [{
          key: 'analyze',
          value: function analyze(expression) {
            var visitor = new Analyzer();
            expression.accept(visitor);
            return visitor.canObserve;
          }
        }]);

        return Analyzer;
      })();

      _export('Analyzer', Analyzer);
    }
  };
});