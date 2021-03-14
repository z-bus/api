import { DeviceEvent } from './deviceEvent';

/**
 * Defines a receiver which supports evaluating {@link DeviceEvent}s which are received by a {@link Device} via the Z-Bus system
 */
export interface Receiver {
  /**
   * A reception will transition the device `state`
   * @param event {@link DeviceEvent} received from the Z-Bus system
   */
  receive(event: DeviceEvent): void;
}
