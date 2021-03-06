import { DeviceEvent } from './deviceEvent';
import { Command } from './deviceTypes';

export class DimmerEvent extends DeviceEvent {
  static from(event: DeviceEvent): DimmerEvent {
    const dimmer = new DimmerEvent(event.address, event.command);
    dimmer.data = event.data;
    return dimmer;
  }
  static dim(
    address: number,
    command: number | Command,
    value?: number,
    duration?: number,
    direction?: number,
  ): DimmerEvent {
    const event = new DimmerEvent(address, command);
    if (value !== undefined) {
      event.value = value;
      event.duration = duration ?? 8;
      event.direction = direction ?? 0;
    }
    return event;
  }

  private _value?: number;
  set value(value: number | undefined) {
    if (value !== undefined) {
      this._value = Math.max(Math.min(value, 1), 0);
      if (this._data == undefined) {
        this._data = new Uint8Array(2);
      }
      this._data[1] = Math.round(this._value * 255);
    } else {
      this._value = undefined;
    }
  }
  get value(): number | undefined {
    if (this._data) {
      this._value = this._data[1] / 255;
    }
    return this._value;
  }

  private _duration?: number;
  set duration(duration: number | undefined) {
    if (duration !== undefined) {
      this._duration = Math.min(Math.max(duration, 0.04), 160);
      if (this._data == undefined) {
        this._data = new Uint8Array(2);
      }
      if (duration >= 2.55) {
        this._data[0] |= Math.round(this._duration / 2.55) & 0x7f;
      } else {
        this._data[0] |= (Math.round(2.55 / this._duration - 1) + 64) & 0x7f;
      }
    } else {
      this._duration = undefined;
    }
  }
  get duration(): number | undefined {
    if (this._data) {
      const d = this._data[0] & 0x7f;
      if (d < 64) {
        this._duration = d * 2.55;
      } else {
        this._duration = 2.55 / (d - 64 + 1);
      }
    }
    return this._duration;
  }

  private _direction?: number;
  set direction(direction: number | undefined) {
    if (direction !== undefined) {
      this._direction = direction ? 1 : 0;
      if (this._data == undefined) {
        this._data = new Uint8Array(2);
      }
      this._data[0] |= direction << 7;
    } else {
      this._direction = undefined;
    }
  }
  get direction(): number | undefined {
    if (this._data) {
      this._direction = this._data[0] & 0x80;
    }
    return this._direction;
  }
}
