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

  subscribe(callback) {
    var callbacks = this.callbacks || (this.callbacks = []),
        info;

    if (callbacks.length === 0) {
      info = this.expression.connect(this.binding, { this: this.object });
      this.oldValue = this.getValue();
      if (info.observer) {
        this.observer = info.observer;
        info.observer.subscribe(() => this.notify());
      }
    }

    callbacks.push(callback);

    return this.unsubscribe.bind(this, callback);
  }

  notify() {
    var i, ii,
        newValue = this.getValue(),
        oldValue = this.oldValue,
        callbacks = this.callbacks;
    if (newValue === oldValue) {
      return;
    }
    this.oldValue = newValue;
    for(i = 0, ii = callbacks.length; i < ii; i++) {
      callbacks[i](newValue, oldValue);
    }
  }

  unsubscribe(callback) {
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
}
