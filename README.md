# Z-Bus 

![Z-Bus Home](https://img.shields.io/badge/platform-Z--Bus%20Home%201.0-yellow)
![License](https://img.shields.io/github/license/z-bus/api)
![Keywords](https://img.shields.io/github/package-json/keywords/z-bus/api)
![Version](https://img.shields.io/npm/v/@z-bus/api)
![Issues](https://img.shields.io/github/issues/z-bus/api)
![Follow](https://img.shields.io/github/followers/z-bus?label=Folllow&style=social)

## About

This is the JavaScript scripting documentation for automating your home with the [Z-Bus](https://www.z-bus.com) smart home [Interface](https://z-bus.de/produkte/interface).

The **documentation** of this API is split into modules:
* the main [api](https://z-bus.github.io/api/modules/api.html) for coding in JavaScript
* the [api/operators](https://z-bus.github.io/api/modules/api_operators.html) for reactive coding with [RxJS](https://rxjs-dev.firebaseapp.com/guide/overview)

The **sources** of this API are available on [github.com/z-bus/api](https://github.com/z-bus/api)

The **package** is available on NPM via [`@z-bus/api`](https://www.npmjs.com/package/@z-bus/api)

## Hardware requirements

* You'll need your home to be **equipped and hard-wired with a Z-Bus smart home system installation** available on [z-bus.com](https://www.z-bus.com).
* You require the **[Interface](https://z-bus.de/produkte/interface) smart home server and IoT gateway** up and running at your home. It will execute the script and run your automations locally on the device, even without connection to the internet.
* **Internet connectivity** is however recommended for scripting (albeit it is also possible offline)

## Getting started

1. Open the `script` from the menu in [Z-Bus Home](https://home.z-bus.com/) or refer to [home.z-bus.com/script](https://home.z-bus.com/script) directly.
2. Enter a "hello world program"

```js
zBus.receive((event) => {
  console.log('Hello, device', event.address);
});
```

3. Press the `▶︎` arrow in the upper right.
4. Press one of your Z-Bus wall buttons. The console will acknowledge each button press:

```text
14.03.2021, 16:09:21 [script] Hello, device 0
```

5. To start scripting your automations, refer to the [API documentation](https://z-bus.github.io/api/modules/api.html) – start from the global [zBus](https://z-bus.github.io/api/modules/api.html#zbus-1) object

## How it works

Z-Bus Home supports scripting home automations in standard `JavaScript`. This is outstandingly documented and supported by the community, an excellent primer into the scripting language can be found in Mozilla's [MDN Web Docs](https://developer.mozilla.org/en-US/docs/Web/JavaScript/Guide/Introduction).

Z-Bus Interface runs the JavaScript runtime `Node.js 15.3` internally, you'll find a detailed reference in the [Node.js Documentation](https://nodejs.org/dist/latest-v15.x/docs/api/).

The scripting runtime features our open-source library specifically built for Z-Bus smart home system usage via the global variable `zBus`. Please refer to the [Z-Bus API Documentation](https://z-bus.github.io/api/classes/api.zbus.html) for:
* Receiving events from and transmitting commands to the Z-Bus smart home system
* Dimming lights and setting lighting scenes
* Creating central or conditional control flows
* Creating timers, schedules, and presence simulations.
