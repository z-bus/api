import { Commands, Command } from './deviceTypes';

/**
 * Contains a bus transmission
 */
export class DeviceEvent {
  /**
   * Address of the bus device. Possible values: 0-255.
   */
  public address: number;

  /**
   * Command sent to or received from the bus device. Possible values: 0-255.
   */
  public command: number;

  /**
   * @param [data] Data sent to the bus device. Possible are two-byte arrays.
   */
  public data?: Uint8Array;

  constructor(address: number, command: number | Command, data?: Uint8Array) {
    this.address = address;
    if (typeof command === 'number') {
      this.command = command;
    } else {
      this.command = Commands[command];
    }

    if (data) {
      this.data = data;
    }
  }
}
