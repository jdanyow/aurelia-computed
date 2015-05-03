import {
  ObjectObservationAdapter,
  ObserverLocator,
  Parser
} from 'aurelia-binding';
import * as LogManager from 'aurelia-logging';
import {Analyzer} from './analyzer';
import {GetterObserver} from './getter-observer';

var logger = LogManager.getLogger('aurelia-computed'),
    container,
    parsed = {};

function getFunctionBody(src) {
    function removeCommentsFromSource(str) {
        return str.replace(/(?:\/\*(?:[\s\S]*?)\*\/)|(?:([\s;])+\/\/(?:.*)$)/gm, '$1');
    }
    var s = removeCommentsFromSource(src);
    return s.substring(s.indexOf('{') + 1, s.lastIndexOf('}'));
}

class ComputedObservationAdapter {
  handlesProperty(object, propertyName, descriptor) {
    var src = descriptor.get.toString(),
        info = parsed[src],
        body, expression;

    if (!info) {
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

      info = parsed[src] = (info || Analyzer.analyze(expression));
    }

    if (!info.canObserve) {
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
    return this._parser || (this._parser = container.get(Parser));
  }

  get observerLocator() {
    // lazily retrieve ObserverLocator instance because it's not available at plugin installation time.
    return this._observerLocator || (this._observerLocator = container.get(ObserverLocator));
  }

  get bindingShim() {
    // an object that implements part of the Binding interface to be used when "connect"ing expressions.
    return this._bindingShim || (this._bindingShim = {
      getObserver: this.observerLocator.getObserver.bind(this.observerLocator),
      valueConverterLookupFunction: name => null
    });
  }
}

export function configure(aurelia) {
  container = aurelia.container;
  aurelia.withInstance(ObjectObservationAdapter, new ComputedObservationAdapter());
}
