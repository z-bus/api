import { Device, DeviceType } from './device';
import { Command } from './command';
import { ZBus } from './ZBus';
import { Transmitter } from './transmitter';
import { Machine, MachineDefinition } from './machine/machine';

/**
 * Z-Bus switching device which controls a single light, heating valve, etc
 * * [Switching receiver / Schaltempfänger](https://www.z-bus.de/produkte/schaltempfaenger) (EM02-100)
 * * [Switching receiver with feedback / Schaltempfänger mit Rückmeldung](https://www.z-bus.de/produkte/schaltempfaenger-mit-rueckmeldung) (EM02-350)
 */
export class SwitchingDevice implements Device, Transmitter, Machine {
  id?: string;
  name?: string;
  address: number[];
  state?: 'on' | 'off';

  type: DeviceType = 'switch';
  static description: 'Schaltempfänger (Licht, Heizung, ...)';

  profile?: string;

  /**
   * Creates a new Z-Bus {@link SwitchingDevice}
   *
   * #### Example
   * ```js
   * const { SwitchingDevice } = require('@z-bus/api');
   * //Switches address 0 on
   * new SwitchingDevice(0).transmit('on');
   * ```
   *
   * @param address Address between `0` and `242` to which the device will be linked
   */
  constructor(address: number) {
    //Check address
    if (address < 0 || address > 242) {
      throw new Error('Unsupported address (must be 0 - 242)');
    }
    //Set address
    this.address = [address];
  }

  /**
   * Toggles the Z-Bus {@link SwitchingDevice}. The device will alternate
   *   * from `off` to `on`, or
   *   * from `on` to `off`
   */
  toggle(): void {
    this.transmit('toggle');
  }

  /**
   * Switches the Z-Bus {@link SwitchingDevice} `on`
   */
  on(): void {
    this.transmit('on');
  }

  /**
   * Switches the Z-Bus {@link SwitchingDevice} `off`
   */
  off(): void {
    this.transmit('off');
  }

  /**
   * Controls the Z-Bus {@link SwitchingDevice}
   *
   * @param command Command used to control the device between `0` and `255` (values see {@link Command})
   */
  transmit(command: number | keyof typeof Command): void {
    ZBus?.getInstance().transmit(this.address[0], command);
  }

  /*
  static fromEvent(event: DeviceEvent): SwitchingDevice {
    const device = new SwitchingDevice(event.address);
    device.receive(event);
    return device;
  }
   */

  /*
  receive(event: DeviceEvent): void {
    //StM
  }
   */

  static Profiles = [
    {
      profile: 'light',
      description: 'Licht',
      states: [
        { state: 'on', description: 'ein' },
        { state: 'off', description: 'aus' },
      ],
      transitions: [
        { transition: 'toggle', description: 'umschalten' },
        { transition: 'on', description: 'einschalten' },
        { transition: 'off', description: 'ausschalten' },
      ],
    },
    {
      profile: 'heating',
      description: 'Heizung',
      states: [
        { state: 'on', description: 'heizt' },
        { state: 'off', description: 'heizt nicht' },
      ],
      transitions: [
        { transition: 'toggle', description: 'umschalten' },
        { transition: 'on', description: 'heizen' },
        { transition: 'off', description: 'nicht heizen' },
      ],
    },
  ];

  static Machine: MachineDefinition = {
    transitions: {
      on: {
        command: 'on',
        target: 'on',
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
        default: 'on',
        transitions: {
          toggle: {
            command: 'toggle',
            target: 'on',
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
