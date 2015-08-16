define(['exports', 'aurelia-binding', 'aurelia-logging', './analyzer', './getter-observer'], function (exports, _aureliaBinding, _aureliaLogging, _analyzer, _getterObserver) {
  'use strict';

  exports.__esModule = true;

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ('value' in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  exports.configure = configure;

  function _classCallCheck(instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError('Cannot call a class as a function'); } }

  var logger = _aureliaLogging.getLogger('aurelia-computed'),
      parsed = {};

  function getFunctionBody(src) {
    function removeCommentsFromSource(str) {
      return str.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s;])+\/\/(?:.*)$)/gm, '$1');
    }
    var s = removeCommentsFromSource(src);
    return s.substring(s.indexOf('{') + 1, s.lastIndexOf('}'));
  }

  var Configuration = function Configuration() {
    _classCallCheck(this, Configuration);

    this.enableLogging = true;
  };

  exports.Configuration = Configuration;

  var ComputedObservationAdapter = (function () {
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
        info = parsed[src] = info || _analyzer.Analyzer.analyze(expression);
      }

      if (!info.canObserve && !info.nativeCode && this.configuration.enableLogging) {
        logger.debug('Unable to observe \'' + propertyName + '\'.  ' + info.reason);
      }

      return info.canObserve;
    };

    ComputedObservationAdapter.prototype.getObserver = function getObserver(object, propertyName, descriptor) {
      var src = descriptor.get.toString(),
          expression = parsed[src].expression;

      return new _getterObserver.GetterObserver(object, propertyName, descriptor, expression, this.bindingShim);
    };

    _createClass(ComputedObservationAdapter, [{
      key: 'parser',
      get: function get() {
        return this._parser || (this._parser = this.container.get(_aureliaBinding.Parser));
      }
    }, {
      key: 'observerLocator',
      get: function get() {
        return this._observerLocator || (this._observerLocator = this.container.get(_aureliaBinding.ObserverLocator));
      }
    }, {
      key: 'configuration',
      get: function get() {
        return this._configuration || (this._configuration = this.container.get(Configuration));
      }
    }, {
      key: 'bindingShim',
      get: function get() {
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

  exports.ComputedObservationAdapter = ComputedObservationAdapter;

  function configure(config) {
    config.instance(_aureliaBinding.ObjectObservationAdapter, new ComputedObservationAdapter(config.container));
  }
});