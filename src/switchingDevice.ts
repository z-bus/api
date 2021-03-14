import { Device } from './device';
import { DeviceEvent } from './deviceEvent';
import { Command } from './command';
import { ZBus } from './ZBus';
import { Transmitter } from './transmitter';

export class SwitchingDevice implements Device, Transmitter {
  id?: string;
  name?: string;
  address: number[];
  state?: 'on' | 'off';

  type = 'switch';
  profile?: string;

  /**
   * Creates a new Z-Bus {@link SwitchingDevice}
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
  toggle() {
    this.transmit('toggle');
  }

  /**
   * Switches the Z-Bus {@link SwitchingDevice} `on`
   */
  on() {
    this.transmit('on');
  }

  /**
   * Switches the Z-Bus {@link SwitchingDevice} `off`
   */
  off() {
    this.transmit('off');
  }

  /**
   * Controls the Z-Bus {@link SwitchingDevice}
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
