import * as LogManager from 'aurelia-logging';
import {subscriberCollection,connectable,createOverrideContext,ObserverLocator,Parser} from 'aurelia-binding';

export class Analyzer {
  constructor() {
    this.canObserve = true;
    this.reason = '';
  }

  static analyze(expression) {
    let visitor = new Analyzer();
    expression.accept(visitor);
    return {
      expression: expression,
      canObserve: visitor.canObserve,
      reason: visitor.reason
    };
  }

  visitArgs(args) {
    for (let i = 0, length = args.length; i < length; ++i) {
      args[i].accept(this);
    }
  }

  visitChain(chain) {
    let expressions = chain.expressions;

    for (let i = 0, length = expressions.length; i < length; ++i) {
      expressions[i].accept(this);
    }
  }

  visitValueConverter(converter) {
    // this should never happen.
  }

  visitBindingBehavior(behavior) {
    // this should never happen.
  }

  visitAssign(assign) {
    assign.target.accept(this);
    assign.value.accept(this);
  }

  visitConditional(conditional) {
    conditional.condition.accept(this);
    conditional.yes.accept(this);
    conditional.no.accept(this);
  }

  visitAccessThis(access) {
    // this should never happen.
  }

  visitAccessScope(access) {
    if (access.name !== 'this') {
      this.canObserve = false;
      this.reason += `'${access.name}' can't be accessed from the binding scope.  `;
    }
  }

  visitAccessMember(access) {
    access.object.accept(this);
  }

  visitAccessKeyed(access) {
    access.object.accept(this);
    access.key.accept(this);
  }

  visitCallScope(call) {
    this.visitArgs(call.args);
  }

  visitCallFunction(call) {
    call.func.accept(this);
    this.visitArgs(call.args);
  }

  visitCallMember(call) {
    call.object.accept(this);
    this.visitArgs(call.args);
  }

  visitPrefix(prefix) {
    prefix.expression.accept(this);
  }

  visitBinary(binary) {
    binary.left.accept(this);
    binary.right.accept(this);
  }

  visitLiteralPrimitive(literal) {
  }

  visitLiteralArray(literal) {
    let elements = literal.elements;
    for (let i = 0, length = elements.length; i < length; ++i) {
      elements[i].accept(this);
    }
  }

  visitLiteralObject(literal) {
    let keys = literal.keys;
    let values = literal.values;

    for (let i = 0, length = keys.length; i < length; ++i) {
      values[i].accept(this);
    }
  }

  visitLiteralString(literal) {
  }
}

let valueConverterLookupFunction = () => null;

@connectable()
@subscriberCollection()
export class GetterObserver {
  constructor(obj, propertyName, descriptor, expression, observerLocator) {
    this.obj = obj;
    let bindingContext = { this: obj };
    let overrideContext = createOverrideContext(bindingContext);
    this.scope = { bindingContext, overrideContext };
    this.propertyName = propertyName;
    this.descriptor = descriptor;
    this.expression = expression;
    this.observerLocator = observerLocator;
  }

  getValue() {
    return this.obj[this.propertyName];
  }

  setValue(newValue) {
    if (this.descriptor.set) {
      this.obj[this.propertyName] = newValue;
    } else {
      throw new Error(`${this.propertyName} does not have a setter function.`);
    }
  }

  subscribe(context, callable) {
    if (!this.hasSubscribers()) {
      this.oldValue = this.obj[this.propertyName];
      this.expression.connect(this, this.scope);
    }
    this.addSubscriber(context, callable);
  }

  unsubscribe(context, callable) {
    if (this.removeSubscriber(context, callable) && !this.hasSubscribers(context, callable)) {
      this.unobserve(true);
    }
  }

  call() {
    let newValue = this.obj[this.propertyName];
    let oldValue = this.oldValue;
    if (newValue !== oldValue) {
      this.oldValue = newValue;
      this.callSubscribers(newValue, oldValue);
    }
    this._version++;
    this.expression.connect(this, this.scope);
    this.unobserve(false);
  }
}

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
