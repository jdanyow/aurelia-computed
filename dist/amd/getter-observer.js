define(["exports"], function (exports) {
  "use strict";

  Object.defineProperty(exports, "__esModule", {
    value: true
  });

  var _classCallCheck = function (instance, Constructor) { if (!(instance instanceof Constructor)) { throw new TypeError("Cannot call a class as a function"); } };

  var _createClass = (function () { function defineProperties(target, props) { for (var i = 0; i < props.length; i++) { var descriptor = props[i]; descriptor.enumerable = descriptor.enumerable || false; descriptor.configurable = true; if ("value" in descriptor) descriptor.writable = true; Object.defineProperty(target, descriptor.key, descriptor); } } return function (Constructor, protoProps, staticProps) { if (protoProps) defineProperties(Constructor.prototype, protoProps); if (staticProps) defineProperties(Constructor, staticProps); return Constructor; }; })();

  var GetterObserver = (function () {
    function GetterObserver(object, propertyName, descriptor, expression, binding) {
      _classCallCheck(this, GetterObserver);

      this.object = object;
      this.propertyName = propertyName;
      this.descriptor = descriptor;
      this.expression = expression;
      this.binding = binding;
    }

    _createClass(GetterObserver, [{
      key: "getValue",
      value: function getValue() {
        return this.object[this.propertyName];
      }
    }, {
      key: "setValue",
      value: function setValue(newValue) {
        if (this.descriptor.set) {
          this.object[this.propertyName] = newValue;
        } else {
          throw new Error("" + this.propertyName + " does not have a setter function.");
        }
      }
    }, {
      key: "subscribe",
      value: function subscribe(callback) {
        var _this = this;

        var callbacks = this.callbacks || (this.callbacks = []),
            info;

        if (callbacks.length === 0) {
          info = this.expression.connect(this.binding, { "this": this.object });
          this.oldValue = info.value;
          if (info.observer) {
            this.observer = info.observer;
            info.observer.subscribe(function () {
              return _this.notify();
            });
          }
        }

        callbacks.push(callback);

        return this.unsubscribe.bind(this, callback);
      }
    }, {
      key: "notify",
      value: function notify() {
        var i,
            ii,
            newValue = this.getValue(),
            oldValue = this.oldValue,
            callbacks = this.callbacks;
        if (newValue === oldValue) {
          return;
        }
        this.oldValue = newValue;
        for (i = 0, ii = callbacks.length; i < ii; i++) {
          callbacks[i](newValue, oldValue);
        }
      }
    }, {
      key: "unsubscribe",
      value: function unsubscribe(callback) {
        var callbacks = this.callbacks,
            index = callbacks.indexOf(callback);
        if (index === -1) {
          return;
        }
        callbacks.splice(index, 1);
        if (callbacks.length === 0 && this.observer) {
          if (this.observer.dispose) {
            this.observer.dispose();
          }
          this.observer = null;
        }
      }
    }]);

    return GetterObserver;
  })();

  exports.GetterObserver = GetterObserver;
});