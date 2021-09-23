import { Observable, pipe, UnaryFunction } from 'rxjs';
import { filter } from 'rxjs/operators';

import { DeviceEvent } from '../deviceEvent';

import { Command, isCommand } from '../command';

/**
 * Filter {@link DeviceEvent}s emitted by the source Observable by only this address and/or event
 *
 * #### Example
 * ```js
 * const { receive } = require('@z-bus/api/operators');
 * zBus.reception.pipe(receive(80)).subscribe((event) => {
 *   console.log('Received', event.event, 'on address 80');
 * });
 * ```
 *
 * @param address If an emitted {@link DeviceEvent} matches this address (or one of these addresses), it is passed on, and filtered otherwise
 * @param command If an emitted {@link DeviceEvent} matches this event (or one of these commands), it is passed on, and filtered otherwise
 */
export function receive(
  address?: number | number[],
  command?: number | keyof typeof Command | Array<number | keyof typeof Command>,
): UnaryFunction<Observable<DeviceEvent>, Observable<DeviceEvent>> {
  //: MonoTypeOperatorFunction<DeviceEvent> {
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
          //Filter if event doesn't match number
          if (e.command !== command) {
            return false;
          }
        } else if (typeof command === 'object') {
          //Filter if event doesn't match any array entry
          if (command.every((command) => (typeof command === 'number' ? command : Command[command]) !== e.command)) {
            return false;
          }
        } else if (isCommand(command)) {
          //Filter if event doesn't match event
          if (e.command != Command[command]) {
            return false;
          }
        }
      }
      return true;
    }),
  );
}
