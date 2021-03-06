import { Observable, pipe, UnaryFunction } from 'rxjs';
import { filter, tap } from 'rxjs/operators';

import { DeviceEvent } from '../deviceEvent';
import { Command, isCommand } from '../deviceTypes';

import { zBus } from '../index';

export function receive(
  address?: number | number[],
  command?: number | keyof typeof Command | Array<number | keyof typeof Command>,
): UnaryFunction<Observable<DeviceEvent>, Observable<DeviceEvent>> {
  return pipe(
    filter((e: DeviceEvent) => {
      if (address !== undefined) {
        if (typeof address === 'number') {
          //Filter if address doesn't match number
          if (e.address !== address) {
            return false;
          }
        } else {
          //Filter if address doesn't match any array entry
          if (address.every((address) => address !== e.address)) {
            return false;
          }
        }
      }
      if (command !== undefined) {
        if (typeof command === 'number') {
          //Filter if command doesn't match number
          if (e.command !== command) {
            return false;
          }
        } else if (typeof command === 'object') {
          //Filter if command doesn't match any array entry
          if (command.every((command) => (typeof command === 'number' ? command : Command[command]) !== e.command)) {
            return false;
          }
        } else if (isCommand(command)) {
          //Filter if command doesn't match command
          if (e.command != Command[command]) {
            return false;
          }
        }
        /*if (command !== undefined && e.command !== (typeof command === 'number' ? command : Command[command])) {
          return false;
        }*/
      }
      return true;
    }),
  );
}

export function transmit(
  address?: number | Array<number>,
  command?: number | Command,
  data?: Array<number>,
): UnaryFunction<Observable<DeviceEvent>, Observable<DeviceEvent>> {
  return pipe(
    tap((e: DeviceEvent) => {
      zBus.transmit(address ?? e.address, command ?? e.command, data ?? e.data);
    }),
  );
}
