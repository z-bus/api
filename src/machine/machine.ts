import { Device } from '../device';
import { DeviceEvent } from '../deviceEvent';
import { State } from '../state';
import { SwitchingDevice } from '../switchingDevice';
import { Command } from '../command';
import { DimmerDevice } from '../dimmerDevice';
import { DirectionalDevice } from '../directionalDevice';

export type Action = (device: any, deviceEvent: DeviceEvent) => void;
export type Guard = (device: any) => boolean;

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
  default: keyof typeof Command | Transition | Array<Transition>;
  transitions?: Transitions;
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

/*export interface MachineDefinitions {
  //switch: MachineDefinition;
  dimmer: MachineDefinition;
  //directional?: StateDefinitions;
}*/

const machineDefinitions = {
  switch: SwitchingDevice.Machine,
  dimmer: DimmerDevice.Machine,
  directional: DirectionalDevice.Machine,
};

export abstract class Machine {
  static States: any;

  private static getMachineDefinition(type: keyof typeof machineDefinitions): MachineDefinition {
    return machineDefinitions[type] ?? {};
  }

  public static transmit(
    device: Device,
    transition: keyof typeof Command | 'default' | number,
    data?: Array<number> | any,
  ): DeviceEvent | undefined {
    const _address = device.address[0];
    let _command: number | keyof typeof Command | undefined = undefined;
    const _data: Array<number> | undefined = undefined;

    const machineDefinition = Machine.getMachineDefinition(device.type);

    if (transition === 'default') {
      //Using the default transition
      //Get state definitions

      const currentStateDefinition = machineDefinition.states[device?.state ?? 'undefined'] ?? ({} as StateDefinition);

      //Parse transition
      let _transition: Array<Transition> = [];
      if (typeof currentStateDefinition.default === 'string') {
        //Typeof _command name
        const t: Transition | undefined =
          currentStateDefinition?.transitions?.[currentStateDefinition?.default] ??
          machineDefinition?.transitions?.[currentStateDefinition?.default];
        if (t) _transition.push(t);
      } else if (Array.isArray(currentStateDefinition.default)) {
        //typeof Array
        _transition = currentStateDefinition.default;
      } else {
        //typeof Transition
        _transition.push(currentStateDefinition.default);
      }

      //Filter guards
      _transition = _transition.filter((transition) => (transition?.guard ? transition.guard(device) : true));
      _command = _transition.length === 1 ? Command[_transition[0]?.command] : undefined;
    } else {
      //Using a number or the transition name
      _command = transition;
    }

    if (_address !== undefined && _command !== undefined) {
      let _event: DeviceEvent;
      if (machineDefinition?.event && !Array.isArray(data)) {
        _event = machineDefinition.event(_address, _command, data);
      } else {
        _event = new DeviceEvent(_address, _command, Array.isArray(data) ? data : undefined);
      }
      //Execute StM
      this.receive(device, _event);
      //Return event
      return _event;
    }
  }

  public static receive(device: Device, event: DeviceEvent): keyof typeof State | undefined {
    //Check address match
    if (device?.address.includes(event.address)) {
      //Get state definitions for device type
      if (device?.type in machineDefinitions) {
        const machineDefinition: MachineDefinition = machineDefinitions[device.type];
        //Get state definition fur current state
        if (device?.state ?? 'undefined' in machineDefinition.states) {
          const currentStateDefinition =
            machineDefinition.states[device?.state ?? 'undefined'] ?? ({} as StateDefinition);
          //Find current transition for event (for global or specific states)
          const transition: Transition | undefined = [
            ...Object.values(currentStateDefinition?.transitions ?? {}),
            ...Object.values(machineDefinition?.transitions ?? {}),
          ].find((transition: Transition) => Command[transition?.command] === event?.command);
          //If transition is allowed…
          if (transition) {
            //Get target state
            const targetState = transition.target;
            //Get target state definition
            const targetStateDefinition = machineDefinition.states[targetState];
            //Execute exit actions
            currentStateDefinition?.exit?.forEach((exit) => {
              exit(device, event);
            });
            //Execute transition actions
            transition.actions?.forEach((action) => {
              action(device, event);
            });
            //Execute entry actions
            targetStateDefinition?.enter?.forEach((enter) => {
              enter(device, event);
            });
            //Execute transition
            device.state = targetState;
            return device.state;
          }
        }
      }
    }
    return device?.state;
  }
}
