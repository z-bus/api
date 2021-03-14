import { Command, isCommand } from './command';

/**
 * Contains a communication event to control a Z-Bus {@link Device}, such communication is either
 *   * transmitted to any smart home {@link Device} over the Z-Bus network, or
 *   * received from any smart home {@link Device} over the Z-Bus network.
 */
export class DeviceEvent {
  /**
   * Address of the Z-Bus device between `0` and `242`
   */
  readonly address: number;
  /**
   * Command used to control a device between `0` and `255` (values see {@link Command})
   */
  readonly command: number;
  /**
   * Optional two-byte data packet used to control a device (each byte between `0` and `255`)
   */
  readonly data?: number[];

  /**
   * Create a DeviceEvent based on address, command, and optionally data
   *
   * #### Example
   * ```js
   * { DeviceEvent } = require('@z-bus/api');
   * const event = new DeviceEvent(0, 'on'); //Event to switch address 0 on
   * ```
   */
  constructor(address: number, command: number | keyof typeof Command, data?: number[]) {
    //Check address
    if (address < 0 || address > 242) {
      throw new Error('Unsupported address (must be 0 - 242)');
    }
    //Set address
    this.address = address;

    //Check command
    if (typeof command === 'number' && (command < 0 || command > 255)) {
      throw new Error('Unsupported command (must be 0 - 255)');
    }
    if (typeof command !== 'number' && !isCommand(command)) {
      throw new Error('Unsupported command');
    }
    //Set command
    this.command = typeof command === 'number' ? command : Command[command];

    //In case the event has data…
    if (data !== undefined) {
      //Check data
      if (data.length !== 2) {
        throw new Error('Unsupported data length (must be 2 bytes)');
      } else {
        data.forEach((value) => {
          if (value < 0 || value > 255) {
            throw new Error('Unsupported data values (must be 0 - 255)');
          }
        });
      }
      //Set data
      this.data = data;
    }
  }
}
