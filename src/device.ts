export interface Device {
  /**
   * Unique id that identifies the Z-Bus device in the database
   */
  readonly id?: string;
  /**
   * Display name of the Z-Bus device
   */
  name?: string;
  /**
   * Addresses the Z-Bus device is linked to.
   * The device will react when receiving a corresponding {@link DeviceEvent} and change its state accordingly.
   */
  address: number[];
  /**
   * Identifies the different types of Z-Bus devices:
   * * `'switch'` for {@link SwitchingDevice}
   * * `'dimmer'` for {@link DimmerDevice}
   * * `'directional'` for {@link DirectionalDevice}
   */
  type?: string;
  /**
   * Display profile for the Z-Bus device (determines state descriptions and symbols), e.g.:
   * * a lamp
   * * a heating,
   * * ...
   */
  profile?: string;
  /**
   * Current state the Z-Bus device is in, e.g.:
   * * `'on'`
   * * `'off'`
   * * ...
   */
  state?: string;
}
