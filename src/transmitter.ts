import { Command } from './command';

/**
 * Defines a transmitter which supports sending {@link DeviceEvent}s to a {@link Device} via the Z-Bus system
 */
export interface Transmitter {
  /**
   * Controls the {@link Device}
   * @param command {@link Command} to transmit via the Z-Bus system
   */
  transmit(command: number | keyof typeof Command): void;
}
