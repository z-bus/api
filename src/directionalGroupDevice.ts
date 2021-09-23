import { Device, DeviceType } from './device';
import { Command } from './command';
import { ZBus } from './ZBus';
import { Transmitter } from './transmitter';
import { Machine, MachineDefinition } from './machine/machine';
import { DeviceEvent } from './deviceEvent';

/**
 * Z-Bus directional device which controls the motion of blinds, windows, or awnings
 * * Motor group switching receiver / Motor-Gruppen-Schaltempfänger (EM04-xxx)
 */
export class DirectionalGroupDevice implements Device, Transmitter, Machine {
  id?: string;
  name?: string;
  address: number[];
  addresses = 3;

  state?: 'up' | 'down' | 'stop';
  memory?: 'up' | 'down' | 'stop';

  type: DeviceType = 'directional-group';
  static description = 'Motor-Gruppen-Schaltempfänger (drei Adressen)';
  profile?: string;

  /**
   * Creates a new Z-Bus {@link DirectionalGroupDevice}
   *
   * #### Example
   * ```js
   * { DirectionalGroupDevice } = require('@z-bus/api');
   * //Moves address 0 up
   * new DirectionalDevice(0, 30, 99).group_up();
   * ```
   *
   * @param address Address between `0` and `242` to which the device will be linked
   * @param group Group address between `0` and `242` to which the device will be linked
   * @param central Central address between `0` and `242` to which the device will be linked
   */
  constructor(address: number, group: number, central: number) {
    //Check address
    for (const i of [address, group, central]) {
      if (i < 0 || i > 242) {
        throw new Error('Unsupported address (must be 0 - 242)');
      }
    }
    //Set address
    this.address = [address, group, central];
  }

  /**
   * Steps a {@link DirectionalDevice}. The device will alternate
   * * from moving 'up' to 'stop', or
   * * from 'stop' to moving 'up'
   */
  up_stop(): void {
    this.transmit('up-stop', 0);
  }

  /**
   * Steps a {@link DirectionalDevice}. The device will alternate
   * * from moving 'down' to 'stop', or
   * * from 'stop' to moving 'down'
   */
  down_stop(): void {
    this.transmit('down-stop', 0);
  }

  /**
   * Moves the Z-Bus {@link DirectionalDevice} including its group `up`
   */
  group_up(): void {
    this.transmit('up', 1);
  }

  /**
   * Moves the Z-Bus {@link DirectionalDevice} centrally `up`
   */
  central_up(): void {
    this.transmit('up', 2);
  }

  /**
   * Moves the Z-Bus {@link DirectionalDevice} including its group `down`
   */
  group_down(): void {
    this.transmit('down', 1);
  }

  /**
   * Moves the Z-Bus {@link DirectionalDevice} centrally `down`
   */
  central_down(): void {
    this.transmit('down', 2);
  }

  /**
   * Stops the motion of the Z-Bus {@link DirectionalDevice} including its group
   */
  group_stop(): void {
    this.transmit('stop', 1);
  }

  /**
   * Stops the motion of the Z-Bus {@link DirectionalDevice} centrally
   */
  central_stop(): void {
    this.transmit('stop', 2);
  }

  /**
   * Controls the Z-Bus {@link DirectionalDevice}
   *
   * @param command Command used to control the device between `0` and `255` (values see {@link Command})
   * @param addressIndex Address on which the command is sent, `0` (single), `1` (group), or `2` (central)
   */
  transmit(command: number | keyof typeof Command, addressIndex = 0): void {
    ZBus?.getInstance().transmit(this.address[addressIndex], command);
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

  static Machine: MachineDefinition = {
    transitions: {
      up: {
        command: 'up',
        target: 'up',
        guard: (device: DirectionalGroupDevice, event?: DeviceEvent): boolean =>
          device.address?.[1] === event?.address || device.address?.[2] === event?.address,
      },
      down: {
        command: 'down',
        target: 'down',
        guard: (device: DirectionalGroupDevice, event?: DeviceEvent): boolean =>
          device.address?.[1] === event?.address || device.address?.[2] === event?.address,
      },
      stop: {
        command: 'stop',
        target: 'stop',
        guard: (device: DirectionalGroupDevice, event?: DeviceEvent): boolean =>
          device.address?.[1] === event?.address || device.address?.[2] === event?.address,
      },
    },
    states: {
      undefined: {},
      up: {
        default: 'up-stop',
        transitions: {
          'up-stop': {
            command: 'up-stop',
            target: 'stop',
            guard: (device: DirectionalGroupDevice, event?: DeviceEvent): boolean =>
              device.address[0] === event?.address,
          },
          'down-stop': {
            command: 'down-stop',
            target: 'down',
            guard: (device: DirectionalGroupDevice, event?: DeviceEvent): boolean =>
              device.address[0] === event?.address,
          },
        },
      },
      down: {
        default: 'down-stop',
        transitions: {
          'up-stop': {
            command: 'up-stop',
            target: 'up',
            guard: (device: DirectionalGroupDevice, event?: DeviceEvent): boolean =>
              device.address[0] === event?.address,
          },
          'down-stop': {
            command: 'down-stop',
            target: 'stop',
            guard: (device: DirectionalGroupDevice, event?: DeviceEvent): boolean =>
              device.address[0] === event?.address,
          },
        },
      },
      stop: {
        enter: [
          (device: DirectionalGroupDevice): void => {
            device.memory = device?.state;
          },
        ],
        default: [
          {
            command: 'up-stop',
            target: 'up',
            guard: (device: DirectionalGroupDevice): boolean => (device?.memory ?? 'down') === 'down',
          },
          {
            command: 'down-stop',
            target: 'down',
            guard: (device: DirectionalGroupDevice): boolean => device?.memory === 'up',
          },
        ],
        transitions: {
          'up-stop': {
            command: 'up-stop',
            target: 'up',
            guard: (device: DirectionalGroupDevice, event?: DeviceEvent): boolean =>
              device.address[0] === event?.address,
          },
          'down-stop': {
            command: 'down-stop',
            target: 'down',
            guard: (device: DirectionalGroupDevice, event?: DeviceEvent): boolean =>
              device.address[0] === event?.address,
          },
        },
      },
    },
  };
}
