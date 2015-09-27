import {subscriberCollection} from 'aurelia-binding';

@subscriberCollection()
export class GetterObserver {
  constructor(object, propertyName, descriptor, expression, binding) {
    this.object = object;
    this.propertyName = propertyName;
    this.descriptor = descriptor;
    this.expression = expression;
    this.binding = binding;
  }

  getValue() {
    return this.object[this.propertyName];
  }

  setValue(newValue) {
    if (this.descriptor.set) {
      this.object[this.propertyName] = newValue;
    } else {
      throw new Error(`${this.propertyName} does not have a setter function.`);
    }
  }

  subscribe(context, callable) {
    if (!this.hasSubscribers()) {
      let info = this.expression.connect(this.binding, { this: this.object });
      this.oldValue = this.getValue();
      if (info.observer) {
        this.observer = info.observer;
        this.observer.subscribe('aurelia-computed', this);
      }
    }
    this.addSubscriber(context, callable);
  }

  unsubscribe(context, callable) {
    if (this.removeSubscriber(context, callable) && this.observer && !this.hasSubscribers()) {
      this.observer.unsubscribe('aurelia-computed', this);
    }
  }

  call(context) {
    let newValue = this.getValue();
    if (newValue === this.oldValue) {
      return;
    }
    this.callSubscribers(newValue, this.oldValue);
    this.oldValue = newValue;
  }
}
