import { Device } from './device';
import { Command } from './command';
import { ZBus } from './ZBus';
import { Transmitter } from './transmitter';

/**
 * Z-Bus directional device which controls the motion of blinds, windows, or awnings
 * * [Motor switching receiver / Motor-Schaltempfänger](https://www.z-bus.de/produkte/motor-schaltempfaenger) (EM03-100)
 */
export class DirectionalDevice implements Device, Transmitter {
  id?: string;
  name?: string;
  address: number[];
  state?: 'up' | 'down' | 'stop';

  type = 'directional';
  profile?: string;

  /**
   * Creates a new Z-Bus {@link DirectionalDevice}
   *
   * #### Example
   * ```js
   * { DirectionalDevice } = require('@z-bus/api');
   * //Moves address 0 up
   * new DirectionalDevice(0).up();
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
   * Steps a {@link DirectionalDevice}. The device will alternate
   * * from moving 'up' to 'stop', or
   * * from 'stop' to moving 'up'
   */
  up_stop(): void {
    this.transmit('up-stop');
  }

  /**
   * Steps a {@link DirectionalDevice}. The device will alternate
   * * from moving 'down' to 'stop', or
   * * from 'stop' to moving 'down'
   */
  down_stop(): void {
    this.transmit('down-stop');
  }

  /**
   * Moves the Z-Bus {@link DirectionalDevice} `up`
   */
  up(): void {
    this.transmit('up');
  }

  /**
   * Moves the Z-Bus {@link DirectionalDevice} `down`
   */
  down(): void {
    this.transmit('down');
  }

  /**
   * Stops the motion of the Z-Bus {@link DirectionalDevice}
   */
  stop(): void {
    this.transmit('stop');
  }

  /**
   * Controls the Z-Bus {@link DirectionalDevice}
   *
   * @param command Command used to control the device between `0` and `255` (values see {@link Command})
   */
  transmit(command: number | keyof typeof Command): void {
    ZBus.getInstance().transmit(this.address[0], command);
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
}
