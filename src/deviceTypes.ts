export enum State {
  UNDEFINED = 'undefined',
  ON = 'on',
  OFF = 'off',
  UP = 'up',
  DOWN = 'down',
  STOP = 'stop',
}

/**
 * A command is a `number` that is part of all {@link DeviceEvent} events which are
 *   * transmitted to any smart home {@link Device} over the bus network.
 *   * received from any smart home {@link Device} over the bus network.
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
   * Toggles a switching device (e.g. light). The device will switch
   *   * from 'off' to 'on', or
   *   * from 'on' to 'off'
   * @category Single Device Control
   */
  'toggle' = 0,
  /**
   * Steps a directional device (e.g. blinds). The device will change
   *   * from moving 'up' to 'stop', or
   *   * from 'stop' to moving 'up'
   * @category Single Device Control
   */
  'up-stop' = 48,
  /**
   * Steps a directional device (e.g. blinds). The device will change
   *   * from moving 'down' to 'stop'
   *   * from 'stop' to moving 'down'
   * @category Single Device Control
   */
  'down-stop' = 192,
  /**
   * Starts changing the brightness of a dimmer.
   * The device will start slowly fading its brightness until stopped.
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

export interface Transition {
  name: keyof typeof Command;
  command: number;
  from?: State[];
  to: State[];
  for?: number[];
  discrete?: boolean;
}

export interface DeviceType {
  type: string;
  description: string;
  addresses?: number;
  states: State[];
  transitions: Transition[];
}

export const deviceTypes: DeviceType[] = [
  {
    type: 'switch',
    description: 'Schaltfunktion (Licht, Heizung, ...)',
    states: [State.ON, State.OFF],
    transitions: [
      {
        name: 'toggle',
        command: Command.toggle,
        from: [State.ON, State.OFF],
        to: [State.ON, State.OFF],
        discrete: true,
      },
      {
        name: 'on',
        command: Command.on,
        to: [State.ON],
      },
      {
        name: 'off',
        command: Command.off,
        to: [State.OFF],
      },
    ],
  },
  {
    type: 'movement',
    description: 'Bewegungsfunktion (Jalousie, Rollladen, Fenster, ...)',
    states: [State.UP, State.DOWN, State.STOP],
    transitions: [
      {
        name: 'up',
        command: Command.up,
        to: [State.UP],
      },
      {
        name: 'up-stop',
        command: Command['up-stop'],
        to: [State.UP, State.STOP],
        discrete: true,
      },
      {
        name: 'stop',
        command: Command.down,
        to: [State.STOP],
      },
      {
        name: 'down-stop',
        command: Command['down-stop'],
        to: [State.DOWN, State.STOP],
        discrete: true,
      },
      {
        name: 'down',
        command: Command.down,
        to: [State.DOWN],
      },
    ],
  },
  {
    type: 'movement-group',
    description: 'Bewegungsfunktion für Gruppen (Empfänger mit drei Adressen)',
    addresses: 3,
    states: [State.UP, State.DOWN, State.STOP],
    transitions: [
      {
        name: 'up',
        command: Command.up,
        to: [State.UP],
        for: [1, 2],
      },
      {
        name: 'up-stop',
        command: Command['up-stop'],
        to: [State.UP, State.STOP],
        discrete: true,
        for: [0],
      },
      {
        name: 'stop',
        command: Command.stop,
        to: [State.STOP],
        for: [1, 2],
      },
      {
        name: 'down-stop',
        command: Command['down-stop'],
        to: [State.DOWN, State.STOP],
        discrete: true,
        for: [0],
      },
      {
        name: 'down',
        command: Command.down,
        to: [State.DOWN],
        for: [1, 2],
      },
    ],
  },
];
