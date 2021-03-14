import { Receiver } from './receiver';
import { DeviceEvent } from './deviceEvent';
import { Transmitter } from './transmitter';
import { Command } from './command';
import { Device } from './device';
import { ZBus } from './ZBus';

/**
 * This packs and unpacks `data` of a {@link DeviceEvent} to control a {@link DimmerDevice}
 */
export class DimmerData {
  /**
   * Brightness between `0.0` and `1.0` %
   */
  brightness: number;
  /**
   * Duration of a full dimming ramp (from 0 to 100%) between `0.04` and `160` seconds
   */
  duration: number;
  /**
   * Direction of the previous dimming ramp where `0` is down and `1` is up
   */
  direction: number;

  constructor(brightness: number, duration: number, direction: number) {
    this.brightness = brightness;
    this.duration = duration;
    this.direction = direction;
  }

  static pack(properties: DimmerData): number[] {
    //Check existence
    if (
      properties === undefined ||
      properties.brightness === undefined ||
      properties.duration === undefined ||
      properties.direction === undefined
    ) {
      throw new Error('Unsupported data (must include brightness, duration, and direction)');
    }
    //Check boundaries
    if (properties.brightness < 0 || properties.brightness > 1) {
      throw new Error('Unsupported brightness (must be 0 - 1)');
    }
    if (properties.duration < 0.04 || properties.duration > 160) {
      throw new Error('Unsupported duration (must be 0.04 - 160)');
    }
    if (properties.direction !== 0 && properties.brightness !== 1) {
      throw new Error('Unsupported direction (must be 0 or 1)');
    }
    //Prepare data
    const data = [0, 0];
    data[0] |=
      properties.duration >= 2.55
        ? Math.round(properties.duration / 2.55) & 0x7f
        : (Math.round(2.55 / properties.duration - 1) + 64) & 0x7f;
    data[0] |= properties.direction << 7;
    data[1] = Math.round(properties.brightness * 255);
    return data;
  }

  static unpack(data: Uint8Array): DimmerData {
    return {
      brightness: data[1] / 255,
      duration: (data[0] & 0x7f) < 64 ? (data[0] & 0x7f) * 2.55 : 2.55 / ((data[0] & 0x7f) - 64 + 1),
      direction: data[0] & 0x80,
    };
  }
}

export class DimmerDevice implements Device, Transmitter {
  id?: string;
  name?: string;
  address: number[];
  state?: 'on' | 'off';

  type = 'dimmer';
  profile?: string;

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
    const event = DimmerDevice.createEvent(this.address[0], command, brightness, duration);
    ZBus.getInstance().transmit(event.address, event.command, event.data);
  }

  /*static fromEvent(event: DeviceEvent): DimmerDevice {
    const device = new DimmerDevice(event.address);
    device.receive(event);
    return device;
  }*/

  /**
   * Creates an event to control a Z-Bus {@link DimmerDevice}
   *
   * @param address Address of the controlled {@link DimmerDevice} between `0` and `242`
   * @param command {@link Command} used to control the {@link DimmerDevice} between `0` and `255`
   * @param brightness Brightness of the {@link DimmerDevice} between `0.0` and `1.0` %
   * @param duration Duration of a full dimming ramp (from 0 to 100%) between `0.04` and `160` seconds
   * @returns the new event
   */
  static createEvent(
    address: number,
    command: number | keyof typeof Command,
    brightness?: number,
    duration = 8,
  ): DeviceEvent {
    return new DeviceEvent(
      address,
      command,
      brightness !== undefined ? DimmerData.pack({ brightness, duration, direction: 0 }) : undefined,
    );
  }
}
