System.register(['aurelia-binding', 'aurelia-logging', './analyzer', './getter-observer'], function (_export) {
  var ObjectObservationAdapter, ObserverLocator, Parser, LogManager, Analyzer, GetterObserver, logger, parsed, Configuration, ComputedObservationAdapter;

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

  function configure(aurelia) {
    aurelia.withInstance(ObjectObservationAdapter, new ComputedObservationAdapter(aurelia.container));
  }

  return {
    setters: [function (_aureliaBinding) {
      ObjectObservationAdapter = _aureliaBinding.ObjectObservationAdapter;
      ObserverLocator = _aureliaBinding.ObserverLocator;
      Parser = _aureliaBinding.Parser;
    }, function (_aureliaLogging) {
      LogManager = _aureliaLogging;
    }, function (_analyzer) {
      Analyzer = _analyzer.Analyzer;
    }, function (_getterObserver) {
      GetterObserver = _getterObserver.GetterObserver;
    }],
    execute: function () {
      'use strict';

      logger = LogManager.getLogger('aurelia-computed');
      parsed = {};

      Configuration = function Configuration() {
        _classCallCheck(this, Configuration);

        this.enableLogging = true;
      };

      _export('Configuration', Configuration);

      ComputedObservationAdapter = (function () {
        function ComputedObservationAdapter(container) {
          _classCallCheck(this, ComputedObservationAdapter);

          this.container = container;
        }

        ComputedObservationAdapter.prototype.handlesProperty = function handlesProperty(object, propertyName, descriptor) {
          var src = descriptor.get.toString(),
              info = parsed[src],
              body,
              expression;

          if (!info) {
            if (/\[native code\]/.test(src)) {
              info = {
                canObserve: false,
                nativeCode: true,
                reason: 'Getter function contains native code.\n' + src
              };
            } else {
              try {
                body = getFunctionBody(src).trim().substr('return'.length).trim();
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

          if (!info.canObserve && !info.nativeCode && this.configuration.enableLogging) {
            logger.debug('Unable to observe \'' + propertyName + '\'.  ' + info.reason);
          }

          return info.canObserve;
        };

        ComputedObservationAdapter.prototype.getObserver = function getObserver(object, propertyName, descriptor) {
          var src = descriptor.get.toString(),
              expression = parsed[src].expression;

          return new GetterObserver(object, propertyName, descriptor, expression, this.bindingShim);
        };

        _createClass(ComputedObservationAdapter, [{
          key: 'parser',
          get: function () {
            return this._parser || (this._parser = this.container.get(Parser));
          }
        }, {
          key: 'observerLocator',
          get: function () {
            return this._observerLocator || (this._observerLocator = this.container.get(ObserverLocator));
          }
        }, {
          key: 'configuration',
          get: function () {
            return this._configuration || (this._configuration = this.container.get(Configuration));
          }
        }, {
          key: 'bindingShim',
          get: function () {
            return this._bindingShim || (this._bindingShim = {
              getObserver: this.observerLocator.getObserver.bind(this.observerLocator),
              valueConverterLookupFunction: function valueConverterLookupFunction(name) {
                return null;
              }
            });
          }
        }]);

        return ComputedObservationAdapter;
      })();

      _export('ComputedObservationAdapter', ComputedObservationAdapter);
    }
  };
});