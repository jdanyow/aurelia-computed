# ![aurelia-computed](aurelia-computed.png)

aurelia-computed is a plugin for the [Aurelia](http://www.aurelia.io/) platform that improves the efficiency of data-binding computed properties.  Binding to computed properties (properties with getter functions) typically requires dirty-checking.  This plugin uses Aurelia's javascript parser to parse the body of the function, which results in an [abstract syntax tree (AST)](http://en.wikipedia.org/wiki/Abstract_syntax_tree).  The AST is then checked for "observability" and if successful, a specialized observer is returned to Aurelia's [pluggable binding system](http://www.danyow.net/aurelia-property-observation/).  The observer publishes change events when properties accessed by the getter function change.

**What types of computed properties can this adapter observe?**

One-liners that don't access anything outside the scope of the view-model are good candidates for observation by this plugin.  Here's a few examples:

```javascript
// "firstName" and "lastName" will be observed.
get fullName() {
  return `${this.firstName} `${this.lastName}`;
}
```
```javascript
// "isLoggedIn", "user" and "user.name" will be observed.
get userName() {
  return this.isLoggedIn ? this.user.name : '(Anonymous)';
}
```
```javascript
// "count" will be observed.
get shoppingCartDescription() {
  return this.count + ' ' + this.pluralize('item', this.count);
}
```
```javascript
var _bar = 'baz';

export class Foo {

  // This property cannot be observed by aurelia-computed.  Dirty-checking will be required.
  // "_bar" can't be accessed from the binding scope.
  get bar() {
    return _bar;
  }
}
```


## Get Started

1. Install aurelia-computed:

  ```bash
  jspm install aurelia-computed
  ```
2. Use the plugin in your app's main.js:

  ```javascript
  export function configure(aurelia) {
    aurelia.use
      .standardConfiguration()
      .developmentLogging()
      .plugin('aurelia-computed', { // install the plugin
        enableLogging: true // enable debug logging to see aurelia-computed's observability messages.
      });

    aurelia.start().then(a => a.setRoot());
  }
  ```

## Dependencies

* [aurelia-binding](https://github.com/aurelia/binding)
* [aurelia-logging](https://github.com/aurelia/logging)

## Platform Support

This library can be used in the **browser** only.

## Building The Code

To build the code, follow these steps.

1. Ensure that [NodeJS](http://nodejs.org/) is installed. This provides the platform on which the build tooling runs.
2. From the project folder, execute the following command:

  ```shell
  npm install
  ```
3. Ensure that [Gulp](http://gulpjs.com/) is installed. If you need to install it, use the following command:

  ```shell
  npm install -g gulp
  ```
4. To build the code, you can now run:

  ```shell
  gulp build
  ```
5. You will find the compiled code in the `dist` folder, available in three module formats: AMD, CommonJS and ES6.

6. See `gulpfile.js` for other tasks related to generating the docs and linting.

## Running The Tests

To run the unit tests, first ensure that you have followed the steps above in order to install all dependencies and successfully build the library. Once you have done that, proceed with these additional steps:

1. Ensure that the [Karma](http://karma-runner.github.io/) CLI is installed. If you need to install it, use the following command:

  ```shell
  npm install -g karma-cli
  ```
2. Ensure that [jspm](http://jspm.io/) is installed. If you need to install it, use the following commnand:

  ```shell
  npm install -g jspm
  ```
3. Install the client-side dependencies with jspm:

  ```shell
  jspm install
  ```

4. You can now run the tests with this command:

  ```shell
  karma start
  ```
