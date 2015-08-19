import {
  ObjectObservationAdapter,
  ObserverLocator,
  Parser
} from 'aurelia-binding';
import * as LogManager from 'aurelia-logging';
import {Analyzer} from './analyzer';
import {GetterObserver} from './getter-observer';

var logger = LogManager.getLogger('aurelia-computed'),
    parsed = {};

function getFunctionBody(src) {
    function removeCommentsFromSource(str) {
        return str.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s;])+\/\/(?:.*)$)/gm, '$1');
    }
    var s = removeCommentsFromSource(src);
    return s.substring(s.indexOf('{') + 1, s.lastIndexOf('}'));
}

export class Configuration {
  enableLogging = true;
}

export class ComputedObservationAdapter {
  constructor(container) {
    this.container = container;
  }

  handlesProperty(object, propertyName, descriptor) {
    var src = descriptor.get.toString(),
        info = parsed[src],
        body, expression;

    if (!info) {
      if (/\[native code\]/.test(src)) {
       info = {
         canObserve: false,
         nativeCode: true,
         reason: `Getter function contains native code.\n${src}`
       } 
      } else {
        try {
          body = getFunctionBody(src).trim().substr('return'.length).trim();
          expression = this.parser.parse(body);
        }
        catch(ex) {
          info = {
            canObserve: false,
            reason: `Unable to parse '${propertyName}' property's getter function.\n${src}`
          };
        }
      }
      info = parsed[src] = (info || Analyzer.analyze(expression));
    }

    if (!info.canObserve && !info.nativeCode && this.configuration.enableLogging) {
      logger.debug(`Unable to observe '${propertyName}'.  ${info.reason}`)
    }

    return info.canObserve;
  }

  getObserver(object, propertyName, descriptor) {
    var src = descriptor.get.toString(),
        expression = parsed[src].expression;

    return new GetterObserver(object, propertyName, descriptor, expression, this.bindingShim);
  }

  get parser() {
    // lazily retrieve Parser instance because it's not available at plugin installation time.
    return this._parser || (this._parser = this.container.get(Parser));
  }

  get observerLocator() {
    // lazily retrieve ObserverLocator instance because it's not available at plugin installation time.
    return this._observerLocator || (this._observerLocator = this.container.get(ObserverLocator));
  }
  
  get configuration() {
    // lazily retrieve Configuration instance because it's not available at plugin installation time.
    return this._configuration || (this._configuration = this.container.get(Configuration));
  }

  get bindingShim() {
    // an object that implements part of the Binding interface to be used when "connect"ing expressions.
    return this._bindingShim || (this._bindingShim = {
      getObserver: this.observerLocator.getObserver.bind(this.observerLocator),
      valueConverterLookupFunction: name => null
    });
  }
}

export function configure(config) {
  config.container.registerInstance(ObjectObservationAdapter, new ComputedObservationAdapter(config.container));
}
