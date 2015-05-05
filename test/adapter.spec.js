import {ObserverLocator, EventManager, DirtyChecker, Parser} from 'aurelia-binding';
import {TaskQueue} from 'jspm_packages/github/aurelia/task-queue@0.4.0/index';
import {ComputedObservationAdapter} from '../src/index';
import {GetterObserver} from '../src/getter-observer';

var baz = 'baz';
class Foo {
  constructor() {
    this._bar = 'bar';
  }

  get bar() {
    return this._bar;
  }
  set bar(newValue) {
    this._bar = newValue;
  }

  get baz() {
    return baz;
  }
  set baz(newValue) {
    baz = newValue;
  }

  get xup() {
    return this._bar + ' some literal';
  }
}

describe('adapter', () => {
  var observerLocator, adapter, foo, observer, dispose, change;

  beforeAll(() => {
    var parser = new Parser(),
        container = {};
    adapter = new ComputedObservationAdapter(container);
    observerLocator = new ObserverLocator(new EventManager(), new DirtyChecker(), new TaskQueue(), [adapter]);
    container.get = type => {
      if (type === ObserverLocator) {
        return observerLocator;
      }
      if (type === Parser) {
        return parser;
      }
      throw new Error(`Unit test container doesn't handle '${type.name}'`);
    };
  });

  it('handles properties that are observable', () => {
    var foo = new Foo();
    expect(adapter.handlesProperty(foo, 'bar', Object.getPropertyDescriptor(foo, 'bar'))).toBe(true);
    expect(adapter.handlesProperty(foo, 'baz', Object.getPropertyDescriptor(foo, 'baz'))).toBe(false);
    expect(adapter.handlesProperty(foo, 'xup', Object.getPropertyDescriptor(foo, 'xup'))).toBe(true);
  });

  it('returns observer matching property-observer interface', () => {
    var foo = new Foo(),
        observer = observerLocator.getObserver(foo, 'bar');
    expect(observer instanceof GetterObserver).toBe(true);
    expect(observer.propertyName).toBe('bar');
    expect(Object.prototype.toString.call(observer.getValue)).toBe('[object Function]');
    expect(Object.prototype.toString.call(observer.setValue)).toBe('[object Function]');
    expect(Object.prototype.toString.call(observer.subscribe)).toBe('[object Function]');
  });

  it('reuses property observers', () => {
    var foo = new Foo(),
        observer1 = observerLocator.getObserver(foo, 'bar'),
        observer2 = observerLocator.getObserver(foo, 'bar');
    expect(observer1).toBe(observer2);
  });

  it('gets and sets value', () => {
    var foo = new Foo(),
        observer = observerLocator.getObserver(foo, 'bar');
    expect(observer.getValue()).toBe(foo.bar);
    foo.bar = 'test';
    expect(observer.getValue()).toBe(foo.bar);
    observer.setValue('test 2');
    expect(observer.getValue()).toBe(foo.bar);
  });

  it('throws when attempting to setValue on property with no setter', () => {
    var foo = new Foo(),
        observer = observerLocator.getObserver(foo, 'xup');
    expect(observer.getValue()).toBe(foo.xup);
    expect(() => observer.setValue('test')).toThrow(new Error('xup does not have a setter function.'));
  });

  it('subscribes', () => {
    foo = new Foo();
    observer = observerLocator.getObserver(foo, 'bar');
    dispose = observer.subscribe((newValue, oldValue) => {
      change = {
        newValue: newValue,
        oldValue: oldValue
      };
    });
    expect(Object.prototype.toString.call(dispose)).toBe('[object Function]');
  });

  it('tracks changes while subscribed', done => {
    change = null;
    foo.bar = 'test';
    setTimeout(() => {
      expect(change && change.newValue === 'test' && change.oldValue === 'bar').toBe(true);
      change = null;
      observer.setValue('test 2');
      setTimeout(() => {
        expect(change && change.newValue === 'test 2' && change.oldValue === 'test').toBe(true);
        done();
      }, 0);
    }, 0);
  });

  it('unsubscribes', done => {
    expect(observer.observer === null).toBe(false);
    dispose();
    expect(observer.observer === null).toBe(true);
    dispose(); // extra dispose to check whether disposing multiple times throws.

    change = null;
    foo.bar = 'test 3';
    setTimeout(() => {
      expect(change).toBe(null);
      change = null;
      observer.setValue('test 4');
      setTimeout(() => {
        expect(change).toBe(null);
        done();
      }, 0);
    }, 0);
  });

  it('re-subscribes', () => {
    dispose = observer.subscribe((newValue, oldValue) => {
      change = {
        newValue: newValue,
        oldValue: oldValue
      };
    });
    expect(Object.prototype.toString.call(dispose)).toBe('[object Function]');
  });

  it('tracks changes after re-subscribing', done => {
    change = null;
    foo.bar = 'test';
    setTimeout(() => {
      expect(change && change.newValue === 'test' && change.oldValue === 'test 4').toBe(true);
      change = null;
      observer.setValue('test 2');
      setTimeout(() => {
        expect(change && change.newValue === 'test 2' && change.oldValue === 'test').toBe(true);
        done();
      }, 0);
    }, 0);
  });
});
