import { Command } from './deviceTypes';

/**
 * Contains a transmission or reception to control a Z-Bus {@link Device}
 */
export class DeviceEvent {
  /**
   * @ignore
   */
  protected _address!: number;
  /**
   * Address of the bus device
   * @param value a `number` between 0 and 242
   */
  set address(value: number) {
    if (value >= 0 && value <= 242) {
      this._address = value;
    } else {
      throw new Error('Unsupported address (must be 0 - 242)');
    }
  }
  /**
   * Address of the bus device
   * @returns a `number` between 0 and 242
   */
  get address(): number {
    return this._address;
  }

  /**
   * @ignore
   */
  protected _command!: number;

  /**
   * The command used to control a device
   * @param value a `number` between 0 and 255 (values see {@link Command})
   */
  set command(value: number) {
    if (value >= 0 && value <= 255) {
      this._command = value;
    } else {
      throw new Error('Unsupported command (must be 0 - 255)');
    }
  }
  /**
   * The command used to control a device
   * @returns a `number` contains the command between 0 and 255 (values see {@link Command})
   */
  get command(): number {
    return this._command;
  }

  /**
   * @ignore
   */
  protected _data?: Uint8Array;
  /**
   * Sends an optional data packet to the bus device
   * @param value a two-byte `number[]` (each byte a `number` between 0 and 255)
   */
  set data(value: Array<number> | undefined) {
    if (value === undefined) {
      delete this._data;
    } else {
      if (value.length == 2) {
        value.forEach((v) => {
          if (v < 0 || v > 255) {
            throw new Error('Unsupported data value (must be 0 - 255)');
          }
        });
        this._data = new Uint8Array(value);
      } else {
        throw new Error('Unsupported data length (must be 2 bytes)');
      }
    }
  }
  /**
   * Data packet received from the bus device
   * @returns a two-byte `number[]` (each byte a `number` between 0 and 255) or `undefined` if no data was received
   */
  get data(): Array<number> | undefined {
    if (this._data) {
      return Array.from(this._data);
    } else {
      return undefined;
    }
  }

  /**
   * Creates an event to control a Z-Bus device
   * @param address Addresses the device (by a `number` between 0 and 242)
   * @param command Controls the device (with a {@link Command} or a `number` between 0 and 255)
   * @param data Sends an optional two-byte `number[]` data packet (each a `number` between 0 and 255)
   *
   * #### Examples
   * ```js
   * const { DeviceEvent } = require('@z-bus/api');
   * const a = new DeviceEvent(0, 'on');
   * const b = new DeviceEvent(0, 3);
   * const c = new DeviceEvent(0, 'on', [0x03, 0xFF]);
   * ```
   */
  constructor(address: number, command: number | keyof typeof Command, data?: Array<number>) {
    this.address = address;

    if (typeof command === 'number') {
      this.command = command;
    } else {
      if (Command[command]) {
        this.command = Command[command];
      } else {
        throw new Error('Invalid command');
      }
    }

    if (data) {
      this.data = data;
    }
  }
}
