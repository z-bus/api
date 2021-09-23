import { DeviceEvent } from './deviceEvent';
import { DimmerData } from './dimmerData';
import { Transmitter } from './transmitter';
import { Command } from './command';
import { Device, DeviceType } from './device';
import { ZBus } from './ZBus';
import { Machine, MachineDefinition } from './machine/machine';

/**
 * Z-Bus dimmer device which adjusts brightness of a light
 * * [Dimmer](https://www.z-bus.de/produkte/dimmer) (DI05-300)
 */
export class DimmerDevice implements Device, Transmitter, Machine {
  id?: string;
  name?: string;
  address: number[];

  state?: 'on' | 'off';

  /**
   * Current brightness of the Z-Bus {@link DimmerDevice} as a `number` between `0.0` and `1.0` in %
   * * `0.0` is off
   * * `0.5` is 50% brightness
   * * `1.0` is 100% on
   */
  brightness?: number;

  /**
   * Last known brightness of the Z-Bus {@link DimmerDevice} as a `number` between `0.0` and `1.0` in %
   * * `0.0` was off
   * * `0.5` was 50% brightness
   * * `1.0` was 100% on
   */
  memory?: number;

  type: DeviceType = 'dimmer';
  static description: 'Dimmer (Licht)';
  profile?: string;

  /**
   * Creates a new Z-Bus {@link DimmerDevice}
   *
   * #### Example
   * ```js
   * { DimmerDevice } = require('@z-bus/api');
   * //Dims address 0 to 50%
   * new DimmerDevice(0).dim(0.5);
   * ```
   *
   * @param address
   */
  constructor(address: number) {
    //Check address
    if (address < 0 || address > 242) {
      throw new Error('Unsupported address (must be 0 - 242)');
    }
    //Set address
    this.address = [address];
  }

  /*
  receive(event: DeviceEvent): void {
    if (this.address.includes(event.address)) {
      //StM
    }
  }
  */

  /**
   * Toggles the Z-Bus {@link DimmerDevice}. The device will alternate
   *   * from `off` to `on`, or
   *   * from `on` to `off`
   */
  toggle(): void {
    this.transmit('toggle');
  }

  /**
   * Switches the Z-Bus {@link DimmerDevice} `on`
   */
  on(): void {
    this.transmit('on');
  }

  /**
   * Switches the Z-Bus {@link DimmerDevice} `off`
   */
  off(): void {
    this.transmit('off');
  }

  /**
   * Dims the Z-Bus {@link DimmerDevice}
   *
   * @param brightness Brightness of the {@link DimmerDevice} between `0.0` and `1.0` %
   * @param duration Duration of a full dimming ramp (from 0 to 100%) between `0.04` and `160` seconds
   */
  dim(brightness: number, duration = 8): void {
    this.transmit('on', brightness, duration);
  }

  /**
   * Controls the Z-Bus {@link DimmerDevice}
   *
   * @param command {@link Command} used to control the {@link DimmerDevice} between `0` and `255`)
   * @param brightness Brightness of the {@link DimmerDevice} between `0.0` and `1.0` %
   * @param duration Duration of a full dimming ramp (from 0 to 100%) between `0.04` and `160` seconds
   */
  transmit(command: number | keyof typeof Command, brightness?: number, duration = 8): void {
    const event = DimmerDevice.createEvent(
      this.address[0],
      command,
      brightness !== undefined ? { brightness, duration, direction: 0 } : undefined,
    );
    ZBus?.getInstance().transmit(event.address, event.command, event.data);
  }

  /*static fromEvent(event: DeviceEvent): DimmerDevice {
    const device = new DimmerDevice(event.address);
    device.receive(event);
    return device;
  }*/

  /**
   * Creates an event to control a Z-Bus {@link DimmerDevice}
   *
   * #### Example
   * ```js
   * { DimmerDevice } = require('@z-bus/api');
   * //Event to dim address 0 to 50%
   * const event = DimmerDevice.createEvent(0, 'on', {brightness: 0.5, duration: 8, direction: 0});
   * ```
   *
   * @param address Address of the controlled {@link DimmerDevice} between `0` and `242`
   * @param command {@link Command} used to control the {@link DimmerDevice} between `0` and `255`
   * @param data may contain brightness and duration of the dimming ramp
   * @returns the new event
   */
  static createEvent(address: number, command: number | keyof typeof Command, data?: DimmerData): DeviceEvent {
    return new DeviceEvent(address, command, data !== undefined ? DimmerData.pack(data) : undefined);
  }

  private static setBrightness(device: DimmerDevice, event: DeviceEvent) {
    device.brightness = event.data ? DimmerData.unpack(event.data).brightness : 1.0;
  }

  private static resetBrightness(device: DimmerDevice) {
    device.memory = device?.brightness;
    device.brightness = 0.0;
  }

  private static restoreBrightness(device: DimmerDevice) {
    device.brightness = device?.memory ?? 1.0;
  }

  static Machine: MachineDefinition = {
    event: DimmerDevice.createEvent,
    transitions: {
      on: {
        target: 'on',
        command: 'on',
        actions: [DimmerDevice.setBrightness],
      },
      off: {
        command: 'off',
        target: 'off',
      },
    },
    states: {
      undefined: {
        default: 'on',
      },
      off: {
        enter: [DimmerDevice.resetBrightness],
        default: 'on',
        transitions: {
          toggle: {
            command: 'toggle',
            target: 'on',
            actions: [DimmerDevice.restoreBrightness],
          },
        },
      },
      on: {
        default: 'off',
        transitions: {
          toggle: {
            command: 'toggle',
            target: 'off',
          },
        },
      },
    },
  };
}
