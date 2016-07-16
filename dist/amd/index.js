define(['exports', './aurelia-computed'], function (exports, _aureliaComputed) {
  'use strict';

  Object.defineProperty(exports, "__esModule", {
    value: true
  });
  Object.keys(_aureliaComputed).forEach(function (key) {
    if (key === "default") return;
    Object.defineProperty(exports, key, {
      enumerable: true,
      get: function () {
        return _aureliaComputed[key];
      }
    });
  });
});