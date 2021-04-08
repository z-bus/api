import { Observable, Subject } from 'rxjs';
import { filter } from 'rxjs/operators';

import { DeviceEvent } from './deviceEvent';
import { SceneEvent } from './sceneEvent';
import { Command } from './command';
import { receive } from './operators';
import { DimmerDevice } from './dimmerDevice';

import schedule, {
  Job,
  JobCallback,
  RecurrenceRule,
  RecurrenceSpecDateRange,
  RecurrenceSpecObjLit,
} from 'node-schedule';

/**
 * This notifies the caller about incoming Z-Bus communication as used in {@link ZBus.receive}
 * #### Example
 * Anonymous callback:
 * ```js
 * zBus.receive((event) => {
 *     console.log('Received', event.address, event.event, event.data);
 * });
 * ```
 * Callback with a named function:
 * ```js
 * function forwardCommand(event) {
 *     zBus.transmit([0, 1, 2, 3, 4, 5, 6, 7, 8], event.event);
 * }
 * zBus.receive(99, ['on', 'off'], forwardCommand);
 * ```
 * Callback skipping the `event` parameter:
 * ```js
 * zBus.receive(() => {
 *     console.log('Something received');
 * });
 * ```
 * @param event The received {@link DeviceEvent} contains address, event, and optional data
 */
export interface DeviceEventNotification {
  (event: DeviceEvent): void;
}

/**
 * This notifies the caller about triggered Z-Bus scenes
 * #### Example
 * ```js
 * zBus.scene((scene) => {
 *     console.log('Scene', scene.name);
 * });
 * ```
 * @param event The received {@link SceneEvent} contains name and id of the called scene
 */
export interface SceneEventNotification {
  (event: SceneEvent): void;
}

/**
 * API for the
 * [Z-Bus Home Script](https://home.z-bus.com/script) environment
 * which allows you to access and control your Z-Bus smart home system.
 *
 * This class is loaded into the runtime and accessible via the global `zBus` object (see {@link zBus})
 *
 * #### At a glance
 * * {@link receive} allows to register callback functions, which get executed upon reception of Z-Bus events
 * * {@link scene} allows to register callback functions, which get executed through scene buttons in [Z-Bus Home](https://home.z-bus.com)
 * * {@link transmit} allows to send events to the Z-Bus system
 * * {@link dim} allows to control the brightness of Z-Bus dimmers
 */
export class ZBus {
  /**
   * [RxJS](https://rxjs-dev.firebaseapp.com/) transmission stream.
   *
   * This pushes a [RxJS](https://rxjs-dev.firebaseapp.com/) [Subject](https://rxjs-dev.firebaseapp.com/guide/subject) every time a DeviceEvent
   * is sent from the scripting environment.
   */
  public readonly transmission: Subject<DeviceEvent>;

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
  public readonly reception: Observable<DeviceEvent>;

  /**
   * [RxJS](https://rxjs-dev.firebaseapp.com/) scene stream.
   *
   * When a user triggers a scene from the button in the web app,
   * this can be subscribed to using
   * [RxJS](https://rxjs-dev.firebaseapp.com/)
   * [Observables](https://rxjs-dev.firebaseapp.com/guide/observable)
   * including all their operators.
   */
  public readonly scenes: Observable<SceneEvent>;

  private static instance: ZBus;

  /**
   * @ignore
   */
  private constructor(
    transmission: Subject<DeviceEvent>,
    reception: Observable<DeviceEvent>,
    scenes: Observable<SceneEvent>,
  ) {
    this.transmission = transmission;
    this.reception = reception;
    this.scenes = scenes;
  }

  /**
   * @ignore
   */
  public static getInstance(): ZBus {
    return ZBus.instance;
  }

  /**
   * @ignore
   */
  public static linkInstance(
    transmission: Subject<DeviceEvent>,
    reception: Observable<DeviceEvent>,
    scenes: Observable<SceneEvent>,
  ): ZBus {
    return (ZBus.instance = new ZBus(transmission, reception, scenes));
  }

  /**
   * Transmits an address, {@link Command}, and possibly a data packet to control a Z-Bus {@link Device}
   * #### Examples
   * Send address 99, event 'on' (e.g. for light)
   *
   * ```js
   * zBus.transmit(99, 'on');
   * zBus.transmit(99, 3);
   * ```
   *
   * Send address 5, event 'down' (e.g. for blinds)
   *
   * ```js
   * zBus.transmit(5, 'down');
   * ```
   *
   * Send address 1, 2, 3, 4, 5 event 'down' (e.g. for centrally controlling multiple blinds)
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
   * @param address One or more addresses of the controlled {@link Device}(s) between `0` and `242`
   * @param command Valid {@link Command} (name or `number` between `0` and `255`) to send to the device
   * @param data An optional two-bytes data packet. This is an unvalidated transmission, so preferably use {@link dim} instead
   */
  transmit(address: number | Array<number>, command: number | keyof typeof Command, data?: Array<number>): void {
    if (typeof address === 'number') {
      this.transmission.next(new DeviceEvent(address, command, data));
    } else {
      address.forEach((address) => {
        this.transmission.next(new DeviceEvent(address, command, data));
      });
    }
  }

  /**
   * Dims a Z-Bus {@link Device}
   *
   * #### Examples
   * ```js
   * zBus.dim(1, 0.0); // Fade to 0% brightness - off
   * zBus.dim(1, 0.5); // Fade to 50% brightness - off
   * zBus.dim(1, 1.0); // Fade 100% brightness - on
   *
   * zBus.dim(1, 0.0, 0.04); // Instant off
   * zBus.dim(1, 1.0, 160); // Slow "sunrise" fade on within 160 s
   *
   * zBus.dim([1, 2, 3], 0.5); // Dim multiple lights
   * ```
   *
   * @param address One or more addresses of the controlled dimmer(s) between `0` and `242`
   * @param brightness The brightness between `0.0` and `1.0` %
   * @param duration Duration of a full dimming ramp (from 0 to 100%) between `0.04` and `160` seconds
   */
  dim(address: number | number[], brightness: number, duration = 8): void {
    if (typeof address === 'number') {
      this.transmission.next(DimmerDevice.createEvent(address, 'on', { brightness, duration, direction: 0 }));
    } else {
      address.forEach((address) => {
        this.transmission.next(DimmerDevice.createEvent(address, 'on', { brightness, duration, direction: 0 }));
      });
    }
  }

  /**
   * Sets a scene, when the corresponding {@link SceneEvent} scene button in the app is pressed
   *
   * This is useful for triggering scenes from the app.
   *
   * #### Example
   * ```js
   * zBus.scene('Movie', () => {
   *    //This scene is triggered when pressing the button named "Movie" in the app
   *    zBus.transmit(4, 'off'); //Switch the main light off
   *    zBus.dim([5, 6], 0.2); //Dim both ambient lights to 20%
   * });
   * ```
   * @param name {@link SceneEvent}s matching this name (or this id) receive this scene
   * @param callback This callback function defines the scene to be executed
   */
  scene(name: string, callback: SceneEventNotification): void;

  /**
   * Sets a scene, when
   *  * the corresponding {@link SceneEvent} scene button in the app is pressed, or
   *  * when an {@link DeviceEvent} event from a physical button is received
   *
   * This is useful for triggering scenes both from the app and from a wall switch.
   *
   * #### Example
   * ```js
   * zBus.scene('Movie', 3, () => {
   *    //This scene is triggered
   *    // * when pressing the button named "Movie" in the app
   *    // * when pushing the physical button attached to the sender address 3, event 'toggle'
   *    zBus.transmit(4, 'off'); //Switch the main light off
   *    zBus.dim([5, 6], 0.2); //Dim both ambient lights to 20%
   * });
   * ```
   * @param name {@link SceneEvent}s matching this name (or this id) receive this scene, or
   * @param address {@link DeviceEvent}s received on this address (or any of these addresses) between `0` and `242` receive this scene
   * @param callback This callback function defines the scene
   */
  scene(name: string, address: number | number[], callback: SceneEventNotification): void;

  /**
   * Sets a scene, when
   *  * the corresponding {@link SceneEvent} scene button in the app is pressed, or
   *  * when an {@link DeviceEvent} event from a physical button is received
   *
   * This is useful for triggering scenes both from the app and from a wall switch.
   *
   * #### Example
   * ```js
   * zBus.scene('Movie', 3, 'toggle', () => {
   *    //This scene is triggered
   *    // * when pressing the button named "Movie" in the app
   *    // * when pushing the physical button attached to the sender address 3, event 'toggle'
   *    zBus.transmit(4, 'off'); //Switch the main light off
   *    zBus.dim([5, 6], 0.2); //Dim both ambient lights to 20%
   * });
   * ```
   * @param name {@link SceneEvent}s matching this name (or this id) receive this scene, or
   * @param address {@link DeviceEvent}s received on this address (or any of these addresses) between `0` and `242` receive this scene, in combination with
   * @param command {@link DeviceEvent}s received matching this {@link Command} (name or `number` between `0` and `255`) or any of these commands receive this scene
   * @param callback This callback function defines the scene to be executed
   */
  scene(
    name: string,
    address: number | number[],
    command: number | keyof typeof Command | Array<number | keyof typeof Command>,
    callback: SceneEventNotification,
  ): void;

  /**
   * This defines the pipes and callbacks for all the above declarations
   * @ignore */
  scene(...args: any[]): void {
    if (args.length == 1) {
      //subscriber
      const subscriber: SceneEventNotification = args[0];
      this.scenes.subscribe(subscriber);
    }
    if (args.length == 2) {
      //name, subscriber
      const select = args[0];
      const subscriber: SceneEventNotification = args[1];
      this.scenes
        .pipe(filter((scene: SceneEvent) => scene.id === select || scene.name === select))
        .subscribe(subscriber);
    }
    if (args.length == 3) {
      //name, address, subscriber
      const select = args[0];
      const address = args[1];
      const subscriber: SceneEventNotification = args[2];
      this.reception.pipe(receive(address)).subscribe(() => subscriber({ name: select, id: 'undefined' }));
      this.scenes
        .pipe(filter((scene: SceneEvent) => scene.id === select || scene.name === select))
        .subscribe(subscriber);
    }
    if (args.length == 4) {
      //name, address, event, subscriber
      const select = args[0];
      const address: number | number[] = args[1];
      const command: number | number[] | Command | Array<number | keyof typeof Command> = args[2];
      const subscriber: SceneEventNotification = args[3];
      this.reception.pipe(receive(address, command)).subscribe(() => subscriber({ name: select, id: 'undefined' }));
      this.scenes
        .pipe(filter((scene: SceneEvent) => scene.id === select || scene.name === select))
        .subscribe(subscriber);
    }
  }

  /**
   * Notifies of incoming communication from a Z-Bus {@link Device}
   *  * Calls user-defined code upon reception to inform about the received {@link DeviceEvent}
   *
   * This is useful for general Z-Bus system monitoring.
   *
   * #### Example
   *
   * Notifies of all received Z-Bus events:
   *
   * ```js
   * zBus.receive((event) => {
   *    //This triggers for any reception
   *    console.log('Received', event.address, event.event);
   * });
   * ```
   *
   * @param callback This function is called when an event is received from the Z-Bus network. The notification contains the received {@link DeviceEvent} including address, event, and possibly a data packet
   *
   */
  receive(callback: DeviceEventNotification): void;

  /**
   * Notifies of incoming communication from a Z-Bus {@link Device}
   *  * Filters receptions by a matching addresses
   *  * Calls user-defined code upon reception to inform about the received {@link DeviceEvent}
   *
   * This is useful for triggering central automations or scenes from a button.
   *
   * #### Example
   *
   * Both variations notify of any Z-Bus receptions of devices set to address `80`:
   *
   * ```js
   * zBus.receive(80, (event) => {
   *    //This triggers for a reception of any event on the address 80
   *    //Address and event are passed via the event
   *    console.log('Received on address', event.address, event.event);
   * });
   * zBus.receive(80, () => {
   *    //This triggers for a reception of any event on the address 80
   *    console.log('Triggered on address 80');
   * });
   * ```
   * @param address Only events matching this address between `0` and `242` are received
   * @param callback This function is called when an event is received from the Z-Bus network. The notification contains the received {@link DeviceEvent} including address, event, and possibly a data packet
   *
   */
  receive(address: number, callback: DeviceEventNotification): void;

  /**
   * Notifies of incoming communication from a Z-Bus {@link Device}
   *  * Filters receptions by one or more matching addresses
   *  * Calls user-defined code upon reception to inform about the received {@link DeviceEvent}
   *
   * This is useful for triggering similar scenes from different buttons, and for grouping single
   * devices together.
   *
   * #### Example
   * ```js
   * zBus.receive([79, 80], (event) => {
   *    //This triggers for a reception of any event on either address 79 or 80
   *    console.log('Received on address', event.address);
   * });
   * ```
   *
   * @param address Only events matching any of these addresses between `0` and `242` are received
   * @param callback This function is called when an event is received from the Z-Bus network. The notification contains the received {@link DeviceEvent} including address, event, and possibly a data packet
   *
   */
  receive(address: number[], callback: DeviceEventNotification): void;

  /**
   * Notifies of incoming communication from a Z-Bus {@link Device}
   *  * Filters receptions by a matching address and {@link Command}
   *  * Calls user-defined code upon reception to inform about the received {@link DeviceEvent}
   *
   * This is useful for triggering automations with hardware buttons (e.g., for triggering
   * a scene on top of a 'toggle' button press) or for piggybacking automation on top of devices
   * which are individually switched by *single device control* {@link Command}s
   * (e.g. implementing a staircase light group)
   *
   * #### Example
   *
   * Notifies of received combinations of address `1` in combination with the event `toggle`
   * (or its numeric equivalent `0`)
   *
   * ```js
   * zBus.receive(80, 'toggle', () => {
   *    //This triggers for a reception of 'toggle' on address 80
   *    console.log('Central control button pressed');
   *    zBus.transmit([1, 2, 3], 'on');
   * });
   * zBus.receive(15, 0, () => {
   *    //This triggers for a reception of event 0 == 'toggle' on address 15
   *    console.log('Individual button pressed, switching entire group on');
   *    zBus.transmit([15, 16, 17], 'on');
   * });
   * ```
   *
   * @param address Only events matching this address between `0` and `242` are received
   * @param command Only events matching this {@link Command} (name or `number` between `0` and `255`) are received
   * @param callback This function is called when an event is received from the Z-Bus network. The notification contains the received {@link DeviceEvent} including address, event, and possibly a data packet
   *
   */
  receive(address: number, command: number | keyof typeof Command, callback: DeviceEventNotification): void;

  /**
   * Notifies of incoming communication from a Z-Bus {@link Device}
   *  * Filters receptions by one or more matching addresses, and one or more matching {@link Command}s
   *  * Calls user-defined code upon reception to inform about the received {@link DeviceEvent}
   *
   * This is useful for forwarding a specific set of commands to specific devices
   *
   * #### Example
   * ```js
   * zBus.receive([79, 80], ['toggle', 'on', 'off'], (event) => {
   *    //This triggers for a reception of the commands 'toggle', 'on', or 'off'
   *    //on the "central" addresses 79 or 80
   *    console.log('Received on address', event.address);
   * });
   * ```
   * Forwarding commands to a range of addresses:
   * ```js
   * function forwardCommand(event) {
   *     zBus.transmit([0, 1, 2, 3, 4, 5, 6, 7, 8], event.event);
   * }
   * zBus.receive(99, ['on', 'off'], forwardCommand);
   * ```
   *
   * @param address Only events matching this address or any of these addresses between `0` and `242` are received
   * @param command Only events matching this {@link Command} (name or `number` between `0` and `255`) or any of these commands are received
   * @param callback This function is called when an event is received from the Z-Bus network. The notification contains the received {@link DeviceEvent} including address, event, and possibly a data packet
   *
   */
  receive(
    address: number | number[],
    command: number | keyof typeof Command | Array<number | keyof typeof Command>,
    callback: DeviceEventNotification,
  ): void;

  /**
   * This defines the pipes and callbacks for all the above declarations
   * @ignore */
  receive(...args: any[]): void {
    if (args.length === 1) {
      //Map the parameters
      const subscriber: DeviceEventNotification = args[0];
      //Subscribe to reception
      this.reception.subscribe(subscriber);
    }
    if (args.length === 2) {
      //Map the parameters
      const address: number | number[] = args[0];
      const subscriber: DeviceEventNotification = args[1];
      //Subscribe to reception
      this.reception.pipe(receive(address)).subscribe(subscriber);
    }
    if (args.length === 3) {
      //Map the parameters
      const address: number | number[] = args[0];
      const command: number | number[] | Command | Array<number | keyof typeof Command> = args[1];
      const subscriber: DeviceEventNotification = args[2];
      //Subscribe to reception
      this.reception.pipe(receive(address, command)).subscribe(subscriber);
    }
  }

  /**
   * A dictionary of all [`node-schedule`](https://github.com/node-schedule/node-schedule) scheduled Jobs, accessible by name.
   */
  jobs = schedule.scheduledJobs;

  /**
   *
   * @param name
   * @param rule
   * @param callback
   */

  /**
   * Schedules recurring events and timers as a [`node-schedule`](https://github.com/node-schedule/node-schedule) job.
   *
   * #### Cron-style scheduling
   *
   * The cron format allows to create complex schedules in a single string, `0 8 * * mon-fri` for example defines "Every weekday at 08:00h".
   * Such expressions are parsed by [`cron-parser`](https://github.com/harrisiirak/cron-parser) and consists of:
   * ```text
   * *    *    *    *    *    *
   * ┬    ┬    ┬    ┬    ┬    ┬
   * │    │    │    │    │    └ day of week (0 - 7) (0 or 7 is Sun)
   * │    │    │    │    └───── month (1 - 12)
   * │    │    │    └────────── day of month (1 - 31)
   * │    │    └─────────────── hour (0 - 23)
   * │    └──────────────────── minute (0 - 59)
   * └───────────────────────── second (0 - 59, optional)
   * ```
   * Field names | Allowed values
   * --- | ---
   * second | `0`-`59` (optional)
   * minute | `0`-`59`
   * hour | `0`-`23`
   * day of month | `1`-`31`
   * month | `1`-`12` where 1 is January, 2 is February, and so on, or `jan`, `feb`, `mar`, `apr`, `may`, `jun`, `jul`, `aug`, `sep`, `oct`, `nov`, or `dec` as three-character strings based on the English name of the month
   * day of week | `0`-`7` where 0 or 7 is Sunday, 1 is Monday, and so on, or `mon`, `tue`, `wed`, `thu`, `fri`, `sat`, or `sun` as three-character strings based on the English name of the day
   *
   * For example, the schedule `30 16 1 1 0` runs on 16:30h on the 1st of January, plus on every Sunday in January.
   *
   * #### Ranges and lists
   *
   * Ranges are two numbers separated with a `-`. For example, the range `8-11` for an hour field executes at hours 8, 9, 10 and 11.
   *
   * A list is a set of numbers or ranges separated by `,`. For example: `1,3,5,7,9` or `8-12,14-18`
   *
   * #### Unrestricted range
   *
   * A field can contain an asterisk `*`, which represents all possible values.
   *
   * For example, the schedule `30 16 1,15 * *` executes at 16:30 on the 1st and 15th of each month.
   *
   * #### Step values
   *
   * Step values can be defined by `first-last/step` and define a range and an execution interval. For example, to specify event execution every other hour, use `0-23/2`. This is equivalent to `0,2,4,6,8,10,12,14,16,18,20,22`.
   *
   * If you specify `*∕step` the schedule will receive at any step interval. For example, the expression `*∕2` will also receive every other hour.
   *
   * #### Cron examples
   *
   * Schedule | Expression
   * --- | ---
   * 14:10 every Monday | `10 14 * * 1`
   * Every day at midnight | `0 0 * * *`
   * Every weekday at midnight | `0 0 * * 1-5`
   * Midnight on 1st and 15th day of the month | `0 0 1,15 * *`
   * 18.32 on the 17th, 21st and 29th of November plus each Monday and Wednesday in November each year | `32 18 17,21,29 11 mon,wed`
   *
   * #### Example
   * ```
   * zBus.schedule('0 8 * * mon-fri', () => {
   *   //Blinds up every weekday morning at 08:00h
   *   zBus.transmit([10, 11, 12, 13, 14, 15], 'up');
   * });
   * ```
   *
   * @param rule scheduling info
   * @param callback callback to be executed on each invocation
   */
  schedule(
    rule: RecurrenceRule | RecurrenceSpecDateRange | RecurrenceSpecObjLit | Date | string | number,
    callback: JobCallback,
  ): Job;

  /**
   * Schedules recurring events and timers as a [`node-schedule`](https://github.com/node-schedule/node-schedule) job.
   *
   * @param name name for the new Job
   * @param rule scheduling info
   * @param callback callback to be executed on each invocation
   */
  schedule(
    name: string,
    rule: RecurrenceRule | RecurrenceSpecDateRange | RecurrenceSpecObjLit | Date | string | number,
    callback: JobCallback,
  ): Job;

  /**
   * @ignore
   */
  schedule(...args: any[]): Job {
    if (args.length === 2) {
      return schedule.scheduleJob(args[0], args[1]);
    }
    if (args.length === 3) {
      return schedule.scheduleJob(args[0], args[1], args[2]);
    }
    throw new Error('Wrong arguments');
  }
}
