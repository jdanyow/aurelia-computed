System.register(['aurelia-logging', 'aurelia-binding'], function (_export) {
  'use strict';

  var LogManager, subscriberCollection, connectable, createOverrideContext, ObserverLocator, Parser, Analyzer, valueConverterLookupFunction, GetterObserver, logger, enableLogging, parsed, ComputedObservationAdapter;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  _export('configure', configure);

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  function getFunctionBody(src) {
    function removeCommentsFromSource(str) {
      return str.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s;])+\/\/(?:.*)$)/gm, '$1');
    }
    var s = removeCommentsFromSource(src);
    return s.substring(s.indexOf('{') + 1, s.lastIndexOf('}'));
  }

  function configure(frameworkConfig, config) {
    var container = frameworkConfig.container;
    var observerLocator = container.get(ObserverLocator);
    var adapter = container.get(ComputedObservationAdapter);
    observerLocator.addAdapter(adapter);

    if (config) {
      enableLogging = config.enableLogging;
    }
  }

  return {
    setters: [function (_aureliaLogging) {
      LogManager = _aureliaLogging;
    }, function (_aureliaBinding) {
      subscriberCollection = _aureliaBinding.subscriberCollection;
      connectable = _aureliaBinding.connectable;
      createOverrideContext = _aureliaBinding.createOverrideContext;
      ObserverLocator = _aureliaBinding.ObserverLocator;
      Parser = _aureliaBinding.Parser;
    }],
    execute: function () {
      Analyzer = (function () {
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
          for (var i = 0, _length = args.length; i < _length; ++i) {
            args[i].accept(this);
          }
        };

        Analyzer.prototype.visitChain = function visitChain(chain) {
          var expressions = chain.expressions;

          for (var i = 0, _length2 = expressions.length; i < _length2; ++i) {
            expressions[i].accept(this);
          }
        };

        Analyzer.prototype.visitValueConverter = function visitValueConverter(converter) {};

        Analyzer.prototype.visitBindingBehavior = function visitBindingBehavior(behavior) {};

        Analyzer.prototype.visitAssign = function visitAssign(assign) {
          assign.target.accept(this);
          assign.value.accept(this);
        };

        Analyzer.prototype.visitConditional = function visitConditional(conditional) {
          conditional.condition.accept(this);
          conditional.yes.accept(this);
          conditional.no.accept(this);
        };

        Analyzer.prototype.visitAccessThis = function visitAccessThis(access) {};

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
          var elements = literal.elements;
          for (var i = 0, _length3 = elements.length; i < _length3; ++i) {
            elements[i].accept(this);
          }
        };

        Analyzer.prototype.visitLiteralObject = function visitLiteralObject(literal) {
          var keys = literal.keys;
          var values = literal.values;

          for (var i = 0, _length4 = keys.length; i < _length4; ++i) {
            values[i].accept(this);
          }
        };

        Analyzer.prototype.visitLiteralString = function visitLiteralString(literal) {};

        return Analyzer;
      })();

      _export('Analyzer', Analyzer);

      valueConverterLookupFunction = function valueConverterLookupFunction() {
        return null;
      };

      GetterObserver = (function () {
        function GetterObserver(obj, propertyName, descriptor, expression, observerLocator) {
          _classCallCheck(this, _GetterObserver);

          this.obj = obj;
          var bindingContext = { 'this': obj };
          var overrideContext = createOverrideContext(bindingContext);
          this.scope = { bindingContext: bindingContext, overrideContext: overrideContext };
          this.propertyName = propertyName;
          this.descriptor = descriptor;
          this.expression = expression;
          this.observerLocator = observerLocator;
        }

        GetterObserver.prototype.getValue = function getValue() {
          return this.obj[this.propertyName];
        };

        GetterObserver.prototype.setValue = function setValue(newValue) {
          if (this.descriptor.set) {
            this.obj[this.propertyName] = newValue;
          } else {
            throw new Error(this.propertyName + ' does not have a setter function.');
          }
        };

        GetterObserver.prototype.subscribe = function subscribe(context, callable) {
          if (!this.hasSubscribers()) {
            this.oldValue = this.obj[this.propertyName];
            this.expression.connect(this, this.scope);
          }
          this.addSubscriber(context, callable);
        };

        GetterObserver.prototype.unsubscribe = function unsubscribe(context, callable) {
          if (this.removeSubscriber(context, callable) && !this.hasSubscribers(context, callable)) {
            this.unobserve(true);
          }
        };

        GetterObserver.prototype.call = function call() {
          var newValue = this.obj[this.propertyName];
          var oldValue = this.oldValue;
          if (newValue !== oldValue) {
            this.oldValue = newValue;
            this.callSubscribers(newValue, oldValue);
          }
          this._version++;
          this.expression.connect(this, this.scope);
          this.unobserve(false);
        };

        var _GetterObserver = GetterObserver;
        GetterObserver = subscriberCollection()(GetterObserver) || GetterObserver;
        GetterObserver = connectable()(GetterObserver) || GetterObserver;
        return GetterObserver;
      })();

      _export('GetterObserver', GetterObserver);

      logger = LogManager.getLogger('aurelia-computed');
      enableLogging = true;
      parsed = {};

      ComputedObservationAdapter = (function () {
        _createClass(ComputedObservationAdapter, null, [{
          key: 'inject',
          value: [ObserverLocator, Parser],
          enumerable: true
        }]);

        function ComputedObservationAdapter(observerLocator, parser) {
          _classCallCheck(this, ComputedObservationAdapter);

          this.observerLocator = observerLocator;
          this.parser = parser;
        }

        ComputedObservationAdapter.prototype.getObserver = function getObserver(object, propertyName, descriptor) {
          var src = descriptor.get.toString();
          var info = parsed[src];

          if (!info) {
            var expression = undefined;
            if (/\[native code\]/.test(src)) {
              info = {
                canObserve: false,
                nativeCode: true,
                reason: 'Getter function contains native code.\n' + src
              };
            } else {
              try {
                var body = getFunctionBody(src).trim().substr('return'.length).trim();
                body = body.replace(/;$/, '');
                expression = this.parser.parse(body);
              } catch (ex) {
                info = {
                  canObserve: false,
                  reason: 'Unable to parse \'' + propertyName + '\' property\'s getter function.\n' + src
                };
              }
            }
            info = parsed[src] = info || Analyzer.analyze(expression);
          }

          if (enableLogging && !info.canObserve && !info.nativeCode) {
            logger.debug('Unable to observe \'' + propertyName + '\'.  ' + info.reason);
          }

          if (info.canObserve) {
            return new GetterObserver(object, propertyName, descriptor, info.expression, this.observerLocator);
          }
          return null;
        };

        return ComputedObservationAdapter;
      })();

      _export('ComputedObservationAdapter', ComputedObservationAdapter);
    }
  };
});