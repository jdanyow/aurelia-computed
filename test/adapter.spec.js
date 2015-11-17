import {ObserverLocator, EventManager, DirtyChecker, Parser} from 'aurelia-binding';
import {TaskQueue} from 'aurelia-task-queue';
import {configure, ComputedObservationAdapter} from '../src/index';
import {GetterObserver} from '../src/getter-observer';
import * as LogManager from 'aurelia-logging';
import {initialize} from 'aurelia-pal-browser';
initialize();

var logger = LogManager.getLogger('aurelia-computed')

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

describe('plugin', () => {
  let frameworkConfig;

  beforeAll(() => {
    let parser = new Parser();
    let observerLocator = new ObserverLocator(new TaskQueue(), new EventManager(), new DirtyChecker());
    let adapter = new ComputedObservationAdapter(observerLocator, parser);
    frameworkConfig = {
      container: {
        get: key => {
          switch (key) {
            case Parser:
              return parser;
            case ObserverLocator:
              return observerLocator;
            case ComputedObservationAdapter:
              return adapter;
            default:
              throw new Error(`fake container doesn't handle ${key}.`);
          }
        }
      }
    }
  });

  it('configures', () => {
    configure(frameworkConfig);
    let adapter = frameworkConfig.container.get(ComputedObservationAdapter);
    expect(adapter instanceof ComputedObservationAdapter).toBe(true);
  });

  it('uses configuration', () => {
    configure(frameworkConfig, { enableLogging: false });
    let adapter = frameworkConfig.container.get(ComputedObservationAdapter);
    expect(adapter instanceof ComputedObservationAdapter).toBe(true);

    spyOn(logger, 'debug');
    let foo = new Foo();
    adapter.getObserver(foo, 'baz', Object.getPropertyDescriptor(foo, 'baz'));
    expect(logger.debug).not.toHaveBeenCalled();

    configure(frameworkConfig, { enableLogging: true });
    logger.debug.calls.reset();
    foo = new Foo();
    adapter.getObserver(foo, 'baz', Object.getPropertyDescriptor(foo, 'baz'));
    expect(logger.debug).toHaveBeenCalled();
  });
});

describe('adapter', () => {
  let adapter;

  beforeAll(() => {
    let parser = new Parser();
    let observerLocator = new ObserverLocator(new TaskQueue(), new EventManager(), new DirtyChecker());
    adapter = new ComputedObservationAdapter(observerLocator, parser);
  });

  it('handles properties that are observable', () => {
    let foo = new Foo();
    expect(adapter.getObserver(foo, 'bar', Object.getPropertyDescriptor(foo, 'bar'))).not.toBe(null);
    expect(adapter.getObserver(foo, 'baz', Object.getPropertyDescriptor(foo, 'baz'))).toBe(null);
    expect(adapter.getObserver(foo, 'xup', Object.getPropertyDescriptor(foo, 'xup'))).not.toBe(null);
  });

  it('returns observer matching property-observer interface', () => {
    let foo = new Foo();
    let observer = adapter.getObserver(foo, 'bar', Object.getPropertyDescriptor(foo, 'bar'));
    expect(observer instanceof GetterObserver).toBe(true);
    expect(observer.propertyName).toBe('bar');
    expect(Object.prototype.toString.call(observer.getValue)).toBe('[object Function]');
    expect(Object.prototype.toString.call(observer.setValue)).toBe('[object Function]');
    expect(Object.prototype.toString.call(observer.subscribe)).toBe('[object Function]');
    expect(Object.prototype.toString.call(observer.unsubscribe)).toBe('[object Function]');
  });

  it('gets and sets value', () => {
    var foo = new Foo(),
        observer = adapter.getObserver(foo, 'bar', Object.getPropertyDescriptor(foo, 'bar'));
    expect(observer.getValue()).toBe(foo.bar);
    foo.bar = 'test';
    expect(observer.getValue()).toBe(foo.bar);
    observer.setValue('test 2');
    expect(observer.getValue()).toBe(foo.bar);
  });

  it('throws when attempting to setValue on property with no setter', () => {
    let foo = new Foo();
    let observer = adapter.getObserver(foo, 'xup', Object.getPropertyDescriptor(foo, 'xup'));
    expect(observer.getValue()).toBe(foo.xup);
    expect(() => observer.setValue('test')).toThrow(new Error('xup does not have a setter function.'));
  });

  it('observes', done => {
    let foo = new Foo();
    let observer = adapter.getObserver(foo, 'bar', Object.getPropertyDescriptor(foo, 'bar'));
    let change = null;
    let context = 'test context';
    let callable = {
      call: (context, newValue, oldValue) => {
        change = {
          newValue: newValue,
          oldValue: oldValue
        };
      }
    };
    expect(observer.hasSubscribers()).toBe(false);
    observer.subscribe(context, callable);
    expect(observer.hasSubscribers()).toBe(true);
    expect(observer.hasSubscriber(context, callable)).toBe(true);
    change = null;
    foo.bar = 'test';
    setTimeout(() => {
      expect(change && change.newValue === 'test' && change.oldValue === 'bar').toBe(true);
      change = null;
      observer.setValue('test 2');
      setTimeout(() => {
        expect(change && change.newValue === 'test 2' && change.oldValue === 'test').toBe(true);
        observer.unsubscribe(context, callable);
        expect(observer.hasSubscribers()).toBe(false);
        expect(observer.hasSubscriber(context, callable)).toBe(false);
        observer.unsubscribe(context, callable); // multiple unsubscribe should be harmless.

        change = null;
        foo.bar = 'test 3';
        setTimeout(() => {
          expect(change).toBe(null);
          change = null;
          observer.setValue('test 4');
          setTimeout(() => {
            expect(change).toBe(null);

            observer.subscribe(context, callable);
            foo.bar = 'test';
            setTimeout(() => {
              expect(change && change.newValue === 'test' && change.oldValue === 'test 4').toBe(true);
              change = null;
              observer.setValue('test 2');
              setTimeout(() => {
                expect(change && change.newValue === 'test 2' && change.oldValue === 'test').toBe(true);
                observer.unsubscribe(context, callable);
                done();
              }, 0);
            }, 0);
          }, 0);
        }, 0);
      }, 0);
    }, 0);
  });
});
