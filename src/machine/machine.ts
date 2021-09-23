import { Device } from '../device';
import { DeviceEvent } from '../deviceEvent';
import { State } from '../state';
import { Command } from '../command';
import { SwitchingDevice } from '../switchingDevice';
import { DimmerDevice } from '../dimmerDevice';
import { DirectionalDevice } from '../directionalDevice';
import { DirectionalGroupDevice } from '../directionalGroupDevice';

export type Action = (device: any, deviceEvent: DeviceEvent) => void;
export type Guard = (device: any, deviceEvent?: DeviceEvent) => boolean;

export interface Transition {
  command: keyof typeof Command;
  target: keyof typeof State;
  actions?: Array<Action>;
  guard?: Guard;
}

export interface Transitions {
  toggle?: Transition;
  'up-stop'?: Transition;
  'down-stop'?: Transition;
  start?: Transition;
  end?: Transition;
  on?: Transition;
  off?: Transition;
  up?: Transition;
  down?: Transition;
  stop?: Transition;
}

export interface StateDefinition {
  enter?: Array<Action>;
  exit?: Array<Action>;
  default?: keyof typeof Command | Transition | Array<Transition>;
  transitions?: Transitions;
}

export interface StateResult {
  state: keyof typeof State;
  previous: keyof typeof State | undefined;
  device: Device;
  event: DeviceEvent;
}

export interface StateDefinitions {
  undefined: StateDefinition;
  on?: StateDefinition;
  off?: StateDefinition;
  up?: StateDefinition;
  down?: StateDefinition;
  stop?: StateDefinition;
}

export interface MachineDefinition {
  event?: (address: number, command: number | keyof typeof Command, data?: any) => DeviceEvent;
  transitions?: Transitions;
  states: StateDefinitions;
}

const machineDefinitions = {
  switch: SwitchingDevice.Machine,
  dimmer: DimmerDevice.Machine,
  directional: DirectionalDevice.Machine,
  'directional-group': DirectionalGroupDevice.Machine,
};

export const deviceDefinitions = {
  switch: SwitchingDevice,
  dimmer: DimmerDevice,
  directional: DirectionalDevice,
  'directional-group': DirectionalGroupDevice,
};

export abstract class Machine {
  static description: string;

  static States: any;

  private static getMachineDefinition(device: Device): MachineDefinition {
    return machineDefinitions[device.type];
  }

  private static getCurrentStateDefinition(device: Device): StateDefinition {
    return machineDefinitions?.[device.type]?.states?.[device?.state ?? 'undefined'] ?? ({} as StateDefinition);
  }

  private static getTargetStateDefinition(device: Device, target?: keyof StateDefinitions): StateDefinition {
    return machineDefinitions?.[device.type]?.states?.[target ?? 'undefined'] ?? ({} as StateDefinition);
  }

  private static getAllowedTransitions(device: Device, event?: DeviceEvent): Array<Transition> {
    //Build an array of global and local transitions and filter by guards
    return [
      ...Object.values(Machine.getCurrentStateDefinition(device)?.transitions ?? {}),
      ...Object.values(Machine.getMachineDefinition(device)?.transitions ?? {}),
    ].filter((transition) => (transition?.guard ? transition.guard(device, event) : true));
  }

  private static getAllowedTransitionKeys(device: Device, event?: DeviceEvent): Array<keyof typeof Command> {
    return Object.entries(Machine.getCurrentStateDefinition(device)?.transitions ?? {})
      .concat(Object.entries(Machine.getMachineDefinition(device)?.transitions ?? {}))
      .filter(([, transition]) => (transition?.guard ? transition.guard(device, event) : true))
      .map(([key]) => key as keyof typeof Command);
  }

  private static getDefaultTransition(device: Device): Transition | undefined {
    const currentStateDefinition = Machine.getCurrentStateDefinition(device);
    const machineDefinition = Machine.getMachineDefinition(device);
    let _transition: Array<Transition> = [];
    if (typeof currentStateDefinition?.default === 'string') {
      //Typeof _command name
      const t: Transition | undefined =
        currentStateDefinition?.transitions?.[currentStateDefinition?.default] ??
        machineDefinition?.transitions?.[currentStateDefinition?.default];
      if (t) _transition.push(t);
    } else if (Array.isArray(currentStateDefinition?.default)) {
      //typeof Array
      _transition = currentStateDefinition.default;
    } else {
      //typeof Transition
      if (currentStateDefinition.default) _transition.push(currentStateDefinition.default);
    }
    //Filter guards
    _transition = _transition.filter((transition) =>
      transition?.guard ? transition.guard(device, { address: device.address[0] } as DeviceEvent) : true,
    );
    return _transition.length === 1 ? _transition[0] : undefined;
  }

  public static getTransitions(device: Device): Array<Array<keyof typeof Command>> {
    const result = [];
    //Build transition array for all given addresses
    for (const address of device.address) {
      result.push(Machine.getAllowedTransitionKeys(device, { address } as DeviceEvent));
    }
    return result;
  }

  public static execute(device: Device, transition?: Transition, event?: DeviceEvent): StateResult | undefined {
    //If transition is allowed…
    if (transition && event) {
      const previous = device.state;
      //Execute exit actions
      this.getCurrentStateDefinition(device)?.exit?.forEach((exit) => {
        exit(device, event);
      });
      //Execute transition actions
      transition.actions?.forEach((action) => {
        action(device, event);
      });
      //Execute entry actions
      this.getTargetStateDefinition(device, transition.target)?.enter?.forEach((enter) => {
        enter(device, event);
      });
      //Execute transition
      device.state = transition.target;
      return {
        state: device.state,
        previous,
        device,
        event,
      };
    }
  }

  public static transmit(
    device: Device,
    command: keyof typeof Command | 'default' | number,
    data?: Array<number> | any,
    addressIndex = 0,
    changeState = true,
  ): DeviceEvent | undefined {
    const _address = device.address[addressIndex];
    let _command: number | keyof typeof Command | undefined = undefined;

    const machineDefinition = Machine.getMachineDefinition(device);

    if (command === 'default') {
      //Using the default transition
      _command = Machine.getDefaultTransition(device)?.command;
    } else {
      //Using a number or the transition name
      _command = command;
    }

    if (_address !== undefined && _command !== undefined) {
      let _event: DeviceEvent;
      if (machineDefinition?.event && !Array.isArray(data)) {
        _event = machineDefinition.event(_address, _command, data);
      } else {
        _event = new DeviceEvent(_address, _command, Array.isArray(data) ? data : undefined);
      }
      //Execute StM
      if (changeState) {
        Machine.receive(device, _event);
      }
      //Return event
      return _event;
    }
  }

  public static receive(device: Device, event: DeviceEvent): StateResult | undefined {
    //Check address match
    if (device?.address.includes(event.address)) {
      //Find transition matching DeviceEvent among allowed transitions
      const transition = Machine.getAllowedTransitions(device, event).find(
        (transition: Transition) => Command[transition?.command] === event?.command,
      );
      return Machine.execute(device, transition, event);
    }
  }
}
