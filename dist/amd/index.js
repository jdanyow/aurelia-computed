define(['exports', 'aurelia-binding', 'aurelia-logging', './analyzer', './getter-observer'], function (exports, _aureliaBinding, _aureliaLogging, _analyzer, _getterObserver) {
  'use strict';

  Object.defineProperty(exports, '__esModule', {
    value: true
  });

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } };

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  exports.configure = configure;

  var logger = _aureliaLogging.getLogger('aurelia-computed'),
      container,
      parsed = {};

  function getFunctionBody(src) {
    function removeCommentsFromSource(str) {
      return str.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s;])+\/\/(?:.*)$)/gm, '$1');
    }
    var s = removeCommentsFromSource(src);
    return s.substring(s.indexOf('{') + 1, s.lastIndexOf('}'));
  }

  var ComputedObservationAdapter = (function () {
    function ComputedObservationAdapter() {
      _classCallCheck(this, ComputedObservationAdapter);
    }

    _createClass(ComputedObservationAdapter, [{
      key: 'handlesProperty',
      value: function handlesProperty(object, propertyName, descriptor) {
        var src = descriptor.get.toString(),
            info = parsed[src],
            body,
            expression;

        if (!info) {
          try {
            body = getFunctionBody(src).trim().substr('return'.length).trim();
            expression = this.parser.parse(body);
          } catch (ex) {
            info = {
              canObserve: false,
              reason: 'Unable to parse \'' + propertyName + '\' property\'s getter function.\n' + src
            };
          }

          info = parsed[src] = info || _analyzer.Analyzer.analyze(expression);
        }

        if (!info.canObserve) {
          logger.debug('Unable to observe \'' + propertyName + '\'.  ' + info.reason);
        }

        return info.canObserve;
      }
    }, {
      key: 'getObserver',
      value: function getObserver(object, propertyName, descriptor) {
        var src = descriptor.get.toString(),
            expression = parsed[src].expression;

        return new _getterObserver.GetterObserver(object, propertyName, descriptor, expression, this.bindingShim);
      }
    }, {
      key: 'parser',
      get: function () {
        return this._parser || (this._parser = container.get(_aureliaBinding.Parser));
      }
    }, {
      key: 'observerLocator',
      get: function () {
        return this._observerLocator || (this._observerLocator = container.get(_aureliaBinding.ObserverLocator));
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

  function configure(aurelia) {
    container = aurelia.container;
    aurelia.withInstance(_aureliaBinding.ObjectObservationAdapter, new ComputedObservationAdapter());
  }
});