export enum State {
  UNDEFINED = 'undefined',
  ON = 'on',
  OFF = 'off',
  UP = 'up',
  DOWN = 'down',
  STOP = 'stop',
}

export enum Command {
  toggle = 'toggle',
  on = 'on',
  off = 'off',
  up = 'up',
  down = 'down',
  stop = 'stop',
  up_stop = 'up-stop',
  down_stop = 'down-stop',
}

export const Commands = {
  toggle: 0,
  on: 3,
  off: 12,
  up: 3,
  down: 12,
  stop: 15,
  'up-stop': 48,
  'down-stop': 192,
};

export interface Transition {
  name: Command;
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
        name: Command.toggle,
        command: 0,
        from: [State.ON, State.OFF],
        to: [State.ON, State.OFF],
        discrete: true,
      },
      {
        name: Command.on,
        command: 3,
        to: [State.ON],
      },
      {
        name: Command.off,
        command: 12,
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
        name: Command.up,
        command: 3,
        to: [State.UP],
      },
      {
        name: Command.up_stop,
        command: 48,
        to: [State.UP, State.STOP],
        discrete: true,
      },
      {
        name: Command.stop,
        command: 15,
        to: [State.STOP],
      },
      {
        name: Command.down_stop,
        command: 192,
        to: [State.DOWN, State.STOP],
        discrete: true,
      },
      {
        name: Command.down,
        command: 12,
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
        name: Command.up,
        command: 3,
        to: [State.UP],
        for: [1, 2],
      },
      {
        name: Command.up_stop,
        command: 48,
        to: [State.UP, State.STOP],
        discrete: true,
        for: [0],
      },
      {
        name: Command.stop,
        command: 15,
        to: [State.STOP],
        for: [1, 2],
      },
      {
        name: Command.down_stop,
        command: 192,
        to: [State.DOWN, State.STOP],
        discrete: true,
        for: [0],
      },
      {
        name: Command.down,
        command: 12,
        to: [State.DOWN],
        for: [1, 2],
      },
    ],
  },
];
