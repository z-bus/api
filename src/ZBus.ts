import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

import { DeviceEvent } from './deviceEvent';
import { Command } from './deviceTypes';
import { DimmerEvent } from './dimmerEvent';
import { receive } from './operators/operators';
import { SceneEvent } from './sceneEvent';

/**
 * [Z-Bus Home](https://home.z-bus.com/) scripting API
 */
export class ZBus {
  /**
   * [RxJS](https://rxjs-dev.firebaseapp.com/) transmission stream.
   *
   * This pushes a [RxJS](https://rxjs-dev.firebaseapp.com/) [Subject](https://rxjs-dev.firebaseapp.com/guide/subject) every time a DeviceEvent
   * is sent from the scripting environment.
   */
  public transmission!: Subject<DeviceEvent>;

  /**
   * [RxJS](https://rxjs-dev.firebaseapp.com/) reception stream.
   *
   * Z-Bus smart home {@link DeviceEvent}s (e.g., switching a device from a physical button) can be subscribed to using
   * [RxJS](https://rxjs-dev.firebaseapp.com/)
   * [Observables](https://rxjs-dev.firebaseapp.com/guide/observable)
   * including all their operators.
   *
   * #### Example
   * ```js
   * const { filter } = require('rxjs/operators');
   * zBus.reception
   *   .pipe(filter(event => event.address === 79 || event.address === 80))
   *   .subscribe((event) => {
   *     //This triggers for any reception of the addresses 79 or 80
   *     console.log('Received address', event.address);
   *   });
   * ```
   */
  public reception!: Observable<DeviceEvent>;

  /**
   * [RxJS](https://rxjs-dev.firebaseapp.com/) scene stream.
   *
   * When a user triggers a scene from the button in the web app,
   * this can be subscribed to using
   * [RxJS](https://rxjs-dev.firebaseapp.com/)
   * [Observables](https://rxjs-dev.firebaseapp.com/guide/observable)
   * including all their operators.
   */
  public scenes!: Observable<SceneEvent>;

  /**
   * @ignore
   */
  constructor() {
    //Empty
  }

  /**
   * @ignore
   */
  link(
    transmission?: Subject<DeviceEvent>,
    reception?: Observable<DeviceEvent>,
    scenes?: Observable<SceneEvent>,
  ): void {
    this.transmission = transmission!;
    this.reception = reception!;
    this.scenes = scenes!;
  }

  /**
   * Transmits an address, {@link Command}, and possibly a data packet to control a bus {@link Device}
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
   * Send address 1, 2, 3, 4, 5 command 'down' (e.g. for centrally controlling multiple blinds)
   *
   * ```js
   * zBus.transmit([1, 2, 3, 4, 5], 'down');
   * ```
   *
   * Send a data packet:
   *
   * ```js
   * zBus.transmit(5, 'on', [0x03, 0xFF]);
   * ```
   * @param address One or more addresses of the controlled {@link Device}(s)
   * @param command Valid {@link Command} or command code (`number` between 0 and 255) to send to the device
   * @param data An optional two-bytes data packet. This is an unvalidated transmission, so preferably use {@link dim} instead
   */
  transmit(address: number | Array<number>, command: number | keyof typeof Command, data?: Array<number>): void {
    //Get command as number
    const _command: number = typeof command === 'number' ? command : Command[command];

    if (typeof address === 'number') {
      this.transmission.next(new DeviceEvent(address, _command, data));
    } else {
      address.forEach((address) => {
        this.transmission.next(new DeviceEvent(address, _command, data));
      });
    }
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
      const transition: number | keyof typeof Command = args[2];
      let command: number;
      if (typeof transition === 'number') {
        command = transition;
      } else {
        command = Command[transition];
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
   * Notifies each bus transmission
   * @param callback Notification of reception including address, command, and optionally data
   */
  receive(callback: (event: DeviceEvent) => void): void;
  /**
   * Notifies each bus transmission of a matching address
   * @param address The device address. It filters all transmissions by this address.
   * @param callback Notification of reception including address, command, and optionally data
   */
  receive(address: number, callback: (event: DeviceEvent) => void): void;
  /**
   * Notifies each bus transmission of a matching address
   * @param address The device address. It filters all transmissions by this address.
   * @param callback Notification of reception including address, command, and optionally data
   */
  receive(address: number[], callback: (event: DeviceEvent) => void): void;
  /**
   * Notifies each bus transmission of a matching address and command
   * @param address The device address. It filters all transmissions by this address.
   * @param command The command. It filters all transmissions by this command.
   * @param callback Notification of reception including address, command, and optionally data
   *
   */
  receive(address: number, command: number | keyof typeof Command, callback: (event: DeviceEvent) => void): void;
  /**
   * Notifies each bus transmission of a matching address and command
   * @param address The device address. It filters all transmissions by this address.
   * @param command The command. It filters all transmissions by this command.
   * @param callback Notification of reception including address, command, and optionally data
   *
   */
  receive(
    address: number | number[],
    command: number | keyof typeof Command | Array<number | keyof typeof Command>,
    callback: (event: DeviceEvent) => void,
  ): void;

  receive(...args: any[]): void {
    if (args.length == 1) {
      const subscriber = args[0];
      this.reception.subscribe(subscriber);
    }
    if (args.length == 2) {
      const address = args[0];
      const subscriber = args[1];
      this.reception.pipe(receive(address)).subscribe(subscriber);
    }
    if (args.length == 3) {
      const address = args[0];
      const command: number | number[] | Command | Array<number | keyof typeof Command> = args[1];
      const subscriber = args[2];
      this.reception.pipe(receive(address, command)).subscribe(subscriber);
    }
  }
}
