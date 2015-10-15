import {subscriberCollection, connectable} from 'aurelia-binding';

let valueConverterLookupFunction = () => null;

@connectable()
@subscriberCollection()
export class GetterObserver {
  constructor(scope, propertyName, descriptor, expression, observerLocator) {
    this.scope = scope;
    this.propertyName = propertyName;
    this.descriptor = descriptor;
    this.expression = expression;
    this.observerLocator = observerLocator;
  }

  getValue() {
    return this.scope[this.propertyName];
  }

  setValue(newValue) {
    if (this.descriptor.set) {
      this.scope[this.propertyName] = newValue;
    } else {
      throw new Error(`${this.propertyName} does not have a setter function.`);
    }
  }

  subscribe(context, callable) {
    if (!this.hasSubscribers()) {
      this.oldValue = this.scope[this.propertyName];
      this.expression.connect(this, { this: this.scope });
    }
    this.addSubscriber(context, callable);
  }

  unsubscribe(context, callable) {
    if (this.removeSubscriber(context, callable) && !this.hasSubscribers(context, callable)) {
      this.unobserve(true);
    }
  }

  call() {
    let newValue = this.scope[this.propertyName];
    let oldValue = this.oldValue;
    if (newValue !== oldValue) {
      this.oldValue = newValue;
      this.callSubscribers(newValue, oldValue);
    }
    this._version++;
    this.expression.connect(this, { this: this.scope });
    this.unobserve(false);
  }
}
