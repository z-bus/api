/*import { Command } from './event';
import { State } from './state';

export interface Transition {
  name: keyof typeof Command;
  event: number;
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
        event: Command.toggle,
        from: [State.ON, State.OFF],
        to: [State.ON, State.OFF],
        discrete: true,
      },
      {
        name: 'on',
        event: Command.on,
        to: [State.ON],
      },
      {
        name: 'off',
        event: Command.off,
        to: [State.OFF],
      },
    ],
  },
  {
    type: 'directional',
    description: 'Bewegungsfunktion (Jalousie, Rollladen, Fenster, ...)',
    states: [State.UP, State.DOWN, State.STOP],
    transitions: [
      {
        name: 'up',
        event: Command.up,
        to: [State.UP],
      },
      {
        name: 'up-stop',
        event: Command['up-stop'],
        to: [State.UP, State.STOP],
        discrete: true,
      },
      {
        name: 'stop',
        event: Command.down,
        to: [State.STOP],
      },
      {
        name: 'down-stop',
        event: Command['down-stop'],
        to: [State.DOWN, State.STOP],
        discrete: true,
      },
      {
        name: 'down',
        event: Command.down,
        to: [State.DOWN],
      },
    ],
  },
  {
    type: 'directional-group',
    description: 'Bewegungsfunktion für Gruppen (Empfänger mit drei Adressen)',
    addresses: 3,
    states: [State.UP, State.DOWN, State.STOP],
    transitions: [
      {
        name: 'up',
        event: Command.up,
        to: [State.UP],
        for: [1, 2],
      },
      {
        name: 'up-stop',
        event: Command['up-stop'],
        to: [State.UP, State.STOP],
        discrete: true,
        for: [0],
      },
      {
        name: 'stop',
        event: Command.stop,
        to: [State.STOP],
        for: [1, 2],
      },
      {
        name: 'down-stop',
        event: Command['down-stop'],
        to: [State.DOWN, State.STOP],
        discrete: true,
        for: [0],
      },
      {
        name: 'down',
        event: Command.down,
        to: [State.DOWN],
        for: [1, 2],
      },
    ],
  },
];
*/
