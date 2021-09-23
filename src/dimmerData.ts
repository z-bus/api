/**
 * This packs and unpacks `data` of a {@link DeviceEvent} to control a {@link DimmerDevice}
 */
export class DimmerData {
  /**
   * Brightness of the Z-Bus {@link DimmerDevice} between `0.0` and `1.0` in %
   * * `0.0` is off
   * * `0.5` is 50% brightness
   * * `1.0` is 100% on
   */
  readonly brightness: number;

  /**
   * Duration of a full dimming ramp (from 0 to 100%) between `0.04` and `160` seconds
   */
  readonly duration: number;
  /**
   * Direction of the previous dimming ramp where `0` is down and `1` is up
   */
  readonly direction: number;

  /**
   * Creates {@link DimmerData} properties from brightness, duration and direction
   *
   * #### Example
   * ```js
   * { DeviceEvent, DimmerData } = require('@z-bus/api');
   * //Event to dim address 0 to 50%
   * const event = new DeviceEvent(0, 'on', new DimmerData(0.5));
   * ```
   *
   * @param brightness Brightness of the Z-Bus {@link DimmerDevice} between `0.0` and `1.0` in %
   * @param duration Duration of a full dimming ramp (from 0 to 100%) between `0.04` and `160` seconds
   * @param direction Direction of the previous dimming ramp where `0` is down and `1` is up
   */
  constructor(brightness: number, duration = 8, direction = 0) {
    this.brightness = brightness;
    this.duration = duration;
    this.direction = direction;
  }

  /**
   * Converts {@link DimmerDevice} properties into {@link DimmerData} to transmit
   * it as part of a {@link DeviceEvent}
   * @param properties a brightness, duration and direction
   * @returns two-byte data packet
   */
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

  /**
   * Converts {@link DimmerData} received as part of a {@link DeviceEvent}
   * into {@link DimmerDevice} properties
   * @param data a two-byte data packet
   * @returns a brightness, duration and direction
   */
  static unpack(data: number[] | Uint8Array): DimmerData {
    //Check length
    if (data.length !== 2) {
      throw new Error('Unsupported data length (must be 2 bytes)');
    }
    //Check values
    data.forEach((byte: number) => {
      if (byte < 0x00 || byte > 0xff) {
        throw new Error('Unsupported data values (must be 0x00 - 0xff)');
      }
    });
    //Unpack
    return {
      brightness: data[1] / 255,
      duration: (data[0] & 0x7f) < 0x40 ? (data[0] & 0x7f) * 2.55 : 2.55 / ((data[0] & 0x7f) - 64 + 1),
      direction: data[0] & 0x80,
    };
  }
}
