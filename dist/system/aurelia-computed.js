'use strict';

System.register(['aurelia-logging', 'aurelia-binding'], function (_export, _context) {
  "use strict";

  var LogManager, subscriberCollection, connectable, createOverrideContext, ObserverLocator, Parser, _dec, _dec2, _class, _class2, _temp, Analyzer, valueConverterLookupFunction, GetterObserver, logger, enableLogging, writeLog, parsed, ComputedObservationAdapter;

  

  function getFunctionBody(src) {
    function removeCommentsFromSource(str) {
      return str.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s;])+\/\/(?:.*)$)/gm, '$1');
    }
    var s = removeCommentsFromSource(src);
    return s.substring(s.indexOf('{') + 1, s.lastIndexOf('}'));
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
      _export('Analyzer', Analyzer = function () {
        function Analyzer() {
          

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
          for (var i = 0, length = args.length; i < length; ++i) {
            args[i].accept(this);
          }
        };

        Analyzer.prototype.visitChain = function visitChain(chain) {
          var expressions = chain.expressions;

          for (var i = 0, length = expressions.length; i < length; ++i) {
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
          for (var i = 0, length = elements.length; i < length; ++i) {
            elements[i].accept(this);
          }
        };

        Analyzer.prototype.visitLiteralObject = function visitLiteralObject(literal) {
          var keys = literal.keys;
          var values = literal.values;

          for (var i = 0, length = keys.length; i < length; ++i) {
            values[i].accept(this);
          }
        };

        Analyzer.prototype.visitLiteralString = function visitLiteralString(literal) {};

        return Analyzer;
      }());

      _export('Analyzer', Analyzer);

      valueConverterLookupFunction = function valueConverterLookupFunction() {
        return null;
      };

      _export('GetterObserver', GetterObserver = (_dec = connectable(), _dec2 = subscriberCollection(), _dec(_class = _dec2(_class = function () {
        function GetterObserver(obj, propertyName, descriptor, expression, observerLocator) {
          

          this.obj = obj;
          var bindingContext = { this: obj };
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

        return GetterObserver;
      }()) || _class) || _class));

      _export('GetterObserver', GetterObserver);

      logger = LogManager.getLogger('aurelia-computed');
      enableLogging = true;

      writeLog = function writeLog(propertyName, reason) {
        return logger.debug('Unable to observe \'' + propertyName + '\'.  ' + reason);
      };

      parsed = {};

      _export('ComputedObservationAdapter', ComputedObservationAdapter = (_temp = _class2 = function () {
        function ComputedObservationAdapter(observerLocator, parser) {
          

          this.observerLocator = observerLocator;
          this.parser = parser;
        }

        ComputedObservationAdapter.prototype.getObserver = function getObserver(object, propertyName, descriptor) {
          var src = descriptor.get.toString();
          var info = parsed[src];

          if (!info) {
            var expression = void 0;
            if (/\[native code\]/.test(src)) {
              info = {
                canObserve: false,
                nativeCode: true,
                reason: 'Getter function contains native code.\n' + src
              };
            } else {
              try {
                var body = getFunctionBody(src).trim();
                body = body.replace(/^['"]use strict['"];/, '').trim();
                body = body.substr('return'.length).trim();
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
            writeLog(propertyName, info.reason);
          }

          if (info.canObserve) {
            return new GetterObserver(object, propertyName, descriptor, info.expression, this.observerLocator);
          }
          return null;
        };

        return ComputedObservationAdapter;
      }(), _class2.inject = [ObserverLocator, Parser], _temp));

      _export('ComputedObservationAdapter', ComputedObservationAdapter);

      function configure(frameworkConfig, config) {
        var container = frameworkConfig.container;
        var observerLocator = container.get(ObserverLocator);
        var adapter = container.get(ComputedObservationAdapter);
        observerLocator.addAdapter(adapter);

        if (config) {
          enableLogging = config.enableLogging;
          writeLog = config.writeLog || writeLog;
        }
      }

      _export('configure', configure);
    }
  };
});