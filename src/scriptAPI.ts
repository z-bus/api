import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

import { DeviceEvent } from './deviceEvent';
import { Commands, Command } from './deviceTypes';
import { DimmerEvent } from './dimmerEvent';
import { SceneEvent } from './sceneEvent';

/**
 * [Z-Bus Home](https://home.z-bus.com/) automation scripting API
 */
export class ScriptAPI {
  /**
   * [RxJS](https://rxjs-dev.firebaseapp.com/) Transmission event stream
   */
  public transmission: Subject<DeviceEvent>;

  /**
   * [RxJS](https://rxjs-dev.firebaseapp.com/) Reception event stream
   *
   * Events on the bus can be subscribed to using [RxJS](https://rxjs-dev.firebaseapp.com/) Observables
   * including all their operators.
   *
   * #### Example
   * ```js
   * const { filter } = require('rxjs/operators');
   * zBus.reception
   *   .pipe(filter(event => event.address === 79 || event.address === 80))
   *   .subscribe((event) => {
   *     console.log('Received address 79 oder 80');
   *   });
   * ```
   */
  public reception: Observable<DeviceEvent>;

  /**
   * [RxJS](https://rxjs-dev.firebaseapp.com/) Scene event stream
   */
  public scenes: Observable<SceneEvent>;

  /**
   * @ignore
   */
  constructor(transmission: Subject<DeviceEvent>, reception: Observable<DeviceEvent>, scenes: Observable<SceneEvent>) {
    this.transmission = transmission;
    this.reception = reception;
    this.scenes = scenes;
  }

  /**
   * Transmits an address, command, and possibly a data packet to a bus device
   * #### Examples
   * Send address 99, command 'on' (e.g. for light)
   *
   * ```js
   * zBus.transmit(99, 'on');
   * zBus.transmit(99, 3);
   * ```
   *
   * Send address 5, command 'down' (e.g. for blinds)
   *
   * ```js
   * zBus.transmit(5, 'down');
   * ```
   *
   * Send a data package:
   *
   * ```js
   * zBus.transmit(5, 'on', [0x03, 0xFF]);
   * ```
   * @param address Address of the device
   * @param command Command to send
   * @param data An optional two-bytes data package
   */
  transmit(address: number, command: number | Command, data?: Uint8Array): void {
    let _command;
    if (typeof command === 'number') {
      _command = command;
    } else {
      _command = Commands[command];
    }
    this.transmission.next(new DeviceEvent(address, _command, data));
  }

  /**
   * Dims a device
   * @param address The address of the dimmable device
   * @param brightness A value between 0.0 and 1.0 represents the brightness in %
   * @param [duration = 8] A value between 0.04 and 160 represents the duration of a full dimming ramp (from 0 to 100%) in seconds
   */
  dim(address: number, brightness: number, duration?: number): void {
    this.transmission.next(DimmerEvent.dim(address, 3, brightness, duration));
  }

  scene(...args: any[]): void {
    if (args.length == 1) {
      //subscriber
      const subscriber = args[0];
      this.scenes.subscribe(subscriber);
    }
    if (args.length == 2) {
      //name, subscriber
      const select = args[0];
      const subscriber = args[1];
      this.scenes
        .pipe(filter((scene: SceneEvent) => scene.id === select || scene.name === select))
        .subscribe(subscriber);
    }
    if (args.length == 3) {
      //name, address, subscriber
      const select = args[0];
      const address = args[1];
      const subscriber = args[2];
      this.reception.pipe(filter((event) => event.address == address)).subscribe(subscriber);
      this.scenes
        .pipe(filter((scene: SceneEvent) => scene.id === select || scene.name === select))
        .subscribe(subscriber);
    }
    if (args.length == 4) {
      //name, address, command, subscriber
      const select = args[0];
      const address = args[1];
      const transition: number | Command = args[2];
      let command: number;
      if (typeof transition === 'number') {
        command = transition;
      } else {
        command = Commands[transition];
      }
      const subscriber = args[3];
      this.reception
        .pipe(filter((event) => event?.address === address && event?.command === command))
        .subscribe(subscriber);
      this.scenes
        .pipe(filter((scene: SceneEvent) => scene.id === select || scene.name === select))
        .subscribe(subscriber);
    }
  }

  /**
   * Notifies each bus transmission of a matching address and command
   * @param address The device address. It filters all transmissions by this address.
   * @param command The command. It filters all transmissions by this command.
   * @param callback Notification of reception including address, command, and data
   *
   * @example Basic usage example:
   *
   * ```ts
   * import {minify} from 'foobar-minify';
   * const config = {
   *   input: readFileSync('dist/awesome-app.js'),
   *   output: createWriteStream('dist/awesome-app.min.js')
   * }
   *   minify(config);
   * ```
   */
  receive(address: number, command: number, callback: (event: DeviceEvent) => void): void;
  /**
   * Notifies each bus transmission of a matching address
   * @param address The device address. It filters all transmissions by this address.
   * @param callback Notification of reception including address, command, and data
   */
  receive(address: number, callback: (event: DeviceEvent) => void): void;
  /**
   * Notifies each bus transmission
   * @param callback Notification of reception including address, command, and data
   */
  receive(callback: (event: DeviceEvent) => void): void;

  receive(...args: any[]): void {
    if (args.length == 1) {
      const subscriber = args[0];
      this.reception.subscribe(subscriber);
    }
    if (args.length == 2) {
      const address = args[0];
      const subscriber = args[1];
      this.reception.pipe(filter((event) => event.address == address)).subscribe(subscriber);
    }
    if (args.length == 3) {
      const address = args[0];
      const transition: number | Command = args[1];
      let command: number;
      if (typeof transition === 'number') {
        command = transition;
      } else {
        command = Commands[transition];
      }
      const subscriber = args[2];
      this.reception
        .pipe(filter((event) => event?.address === address && event?.command === command))
        .subscribe(subscriber);
    }
  }
}

/**
 * The global bus bindings to be used in scripting
 */
export let zBus: ScriptAPI;
