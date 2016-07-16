import {ObserverLocator, Parser} from 'aurelia-binding';
import * as LogManager from 'aurelia-logging';
import {Analyzer} from './analyzer';
import {GetterObserver} from './getter-observer';

let logger = LogManager.getLogger('aurelia-computed');
let enableLogging = true;
let writeLog = (propertyName, reason) => logger.debug(`Unable to observe '${propertyName}'.  ${reason}`);
let parsed = {};

function getFunctionBody(src) {
  function removeCommentsFromSource(str) {
    return str.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s;])+\/\/(?:.*)$)/gm, '$1');
  }
  let s = removeCommentsFromSource(src);
  return s.substring(s.indexOf('{') + 1, s.lastIndexOf('}'));
}

export class ComputedObservationAdapter {
  static inject = [ObserverLocator, Parser];

  constructor(observerLocator, parser) {
    this.observerLocator = observerLocator;
    this.parser = parser;
  }

  getObserver(object, propertyName, descriptor) {
    let src = descriptor.get.toString();
    let info = parsed[src];

    if (!info) {
      let expression;
      if (/\[native code\]/.test(src)) {
        info = {
          canObserve: false,
          nativeCode: true,
          reason: `Getter function contains native code.\n${src}`
        };
      } else {
        try {
          let body = getFunctionBody(src).trim();
          body = body.replace(/^['"]use strict['"];/, '').trim();
          body = body.substr('return'.length).trim();
          body = body.replace(/;$/, '');
          expression = this.parser.parse(body);
        } catch (ex) {
          info = {
            canObserve: false,
            reason: `Unable to parse '${propertyName}' property's getter function.\n${src}`
          };
        }
      }
      info = parsed[src] = (info || Analyzer.analyze(expression));
    }

    if (enableLogging && !info.canObserve && !info.nativeCode) {
      writeLog(propertyName, info.reason);
    }

    if (info.canObserve) {
      return new GetterObserver(object, propertyName, descriptor, info.expression, this.observerLocator);
    }
    return null;
  }
}

export function configure(frameworkConfig, config) {
  let container = frameworkConfig.container;
  let observerLocator = container.get(ObserverLocator);
  let adapter = container.get(ComputedObservationAdapter);
  observerLocator.addAdapter(adapter);

  if (config) {
    enableLogging = config.enableLogging;
    writeLog = config.writeLog || writeLog;
  }
}
