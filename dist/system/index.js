System.register(['aurelia-binding', 'aurelia-logging', './analyzer', './getter-observer'], function (_export) {
  var ObjectObservationAdapter, ObserverLocator, Parser, LogManager, Analyzer, GetterObserver, logger, container, parsed, ComputedObservationAdapter;

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  _export('configure', configure);

  function getFunctionBody(src) {
    function removeCommentsFromSource(str) {
      return str.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s;])+\/\/(?:.*)$)/gm, '$1');
    }
    var s = removeCommentsFromSource(src);
    return s.substring(s.indexOf('{') + 1, s.lastIndexOf('}'));
  }

  function configure(aurelia) {
    container = aurelia.container;
    aurelia.withInstance(ObjectObservationAdapter, new ComputedObservationAdapter());
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

      logger = LogManager.getLogger('templating-binding');
      parsed = {};

      ComputedObservationAdapter = (function () {
        function ComputedObservationAdapter() {
          _classCallCheck(this, ComputedObservationAdapter);
        }

        _createClass(ComputedObservationAdapter, [{
          key: 'handlesProperty',
          value: function handlesProperty(object, propertyName, descriptor) {
            var src = descriptor.get.toString(),
                body,
                expression,
                canObserve;

            if (parsed.hasOwnProperty(src)) {
              return parsed[src].canObserve;
            }

            try {
              body = getFunctionBody(src).trim().substr('return'.length).trim();
              expression = this.parser.parse(body);
            } catch (ex) {
              logger.debug('unable to parse \'' + propertyName + '\' property.\n' + src);
              parsed[src] = {
                expression: null,
                canObserve: false
              };
              return false;
            }

            canObserve = Analyzer.analyze(expression);
            parsed[src] = {
              expression: expression,
              canObserve: canObserve
            };

            return canObserve;
          }
        }, {
          key: 'getObserver',
          value: function getObserver(object, propertyName, descriptor) {
            var src = descriptor.get.toString(),
                expression = parsed[src].expression;

            return new GetterObserver(object, propertyName, descriptor, expression, this.bindingShim);
          }
        }, {
          key: 'parser',
          get: function () {
            return this._parser || (this._parser = container.get(Parser));
          }
        }, {
          key: 'observerLocator',
          get: function () {
            return this._observerLocator || (this._observerLocator = container.get(ObserverLocator));
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
    }
  };
});