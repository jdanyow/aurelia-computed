'use strict';

Object.defineProperty(exports, "__esModule", {
  value: true
});

var _aureliaComputed = require('./aurelia-computed');

Object.keys(_aureliaComputed).forEach(function (key) {
  if (key === "default") return;
  Object.defineProperty(exports, key, {
    enumerable: true,
    get: function get() {
      return _aureliaComputed[key];
    }
  });
});