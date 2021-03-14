import { Command } from './command';
import { State } from './state';

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
