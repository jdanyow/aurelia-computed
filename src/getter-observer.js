import {subscriberCollection, connectable, createOverrideContext} from 'aurelia-binding';

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
