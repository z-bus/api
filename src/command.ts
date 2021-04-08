/**
 * A event is a `number` that is part of all {@link DeviceEvent} communication events which are
 *   * transmitted to any smart home {@link Device} over the Z-Bus network.
 *   * received from any smart home {@link Device} over the Z-Bus network.
 *
 * The *central device control* commands always set devices into a defined state.
 * Hence those are suitable for controlling groups of many devices simultaneously.
 *
 * The *single device control* are stateless commands which switch devices into an unknown state.
 * Only use these, if you can observe the outcome (e.g. from a button in the same room)
 * or for triggering events (e.g. for setting a scene, or winding a staircase timer up).
 * If you run these commands on groups of devices, they will be out of sync
 * (i.e. some will switch on, others will switch off).
 */
export enum Command {
  /**
   * Toggles a switching device (e.g. light). The device will alternate
   *   * from 'off' to 'on', or
   *   * from 'on' to 'off'
   * @category Single Device Control
   */
  'toggle' = 0,
  /**
   * Steps a directional device (e.g. blinds). The device will alternate
   *   * from moving 'up' to 'stop', or
   *   * from 'stop' to moving 'up'
   * @category Single Device Control
   */
  'up-stop' = 48,
  /**
   * Steps a directional device (e.g. blinds). The device will alternate
   *   * from moving 'down' to 'stop'
   *   * from 'stop' to moving 'down'
   * @category Single Device Control
   */
  'down-stop' = 192,
  /**
   * Starts changing the brightness of a dimmer.
   * The device will start slowly fading its brightness (until stopped).
   * @category Single Device Control
   */
  start = 48,
  /**
   * Ends changing the brightness of a dimmer.
   * The device will stop fading its brightness and stick to its current brightness level.
   * @category Single Device Control
   */
  end = 192,
  /**
   * Switches one or more switching devices 'on' (e.g. lights, heating, ...)
   * @category Central Device Control
   */
  on = 3,
  /**
   * Switches one or more switching devices 'off' (e.g. lights, heating, ...)
   * @category Central Device Control
   */
  off = 12,
  /**
   * Moves one or more directional devices 'up' (e.g. blinds)
   * @category Central Device Control
   */
  up = 3,
  /**
   * Moves one or more directional devices 'down' (e.g. blinds)
   * @category Central Device Control
   */
  down = 12,
  /**
   * Stops the motion of one or more a directional devices (e.g. blinds)
   * @category Central Device Control
   */
  stop = 15,
}

export function isCommand(command: string): command is keyof typeof Command {
  return command in Command;
}
