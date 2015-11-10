declare module 'aurelia-computed' {
  import * as LogManager from 'aurelia-logging';
  import { subscriberCollection, connectable, createOverrideContext, ObserverLocator, Parser }  from 'aurelia-binding';
  export class Analyzer {
    constructor();
    static analyze(expression: any): any;
    visitArgs(args: any): any;
    visitChain(chain: any): any;
    visitValueConverter(converter: any): any;
    
    //  this should never happen.
    visitBindingBehavior(behavior: any): any;
    
    //  this should never happen.
    visitAssign(assign: any): any;
    visitConditional(conditional: any): any;
    visitAccessThis(access: any): any;
    
    //  this should never happen.
    visitAccessScope(access: any): any;
    visitAccessMember(access: any): any;
    visitAccessKeyed(access: any): any;
    visitCallScope(call: any): any;
    visitCallFunction(call: any): any;
    visitCallMember(call: any): any;
    visitPrefix(prefix: any): any;
    visitBinary(binary: any): any;
    visitLiteralPrimitive(literal: any): any;
    visitLiteralArray(literal: any): any;
    visitLiteralObject(literal: any): any;
    visitLiteralString(literal: any): any;
  }
  export class GetterObserver {
    constructor(obj: any, propertyName: any, descriptor: any, expression: any, observerLocator: any);
    getValue(): any;
    setValue(newValue: any): any;
    subscribe(context: any, callable: any): any;
    unsubscribe(context: any, callable: any): any;
    call(): any;
  }
  export class ComputedObservationAdapter {
    static inject: any;
    constructor(observerLocator: any, parser: any);
    getObserver(object: any, propertyName: any, descriptor: any): any;
  }
  export function configure(frameworkConfig: any, config: any): any;
}