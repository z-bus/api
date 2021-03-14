import { Observable, pipe, UnaryFunction } from 'rxjs';
import { filter, tap } from 'rxjs/operators';

import { DeviceEvent } from '../deviceEvent';

import { ZBus } from '../index';

import { Command, isCommand } from '../command';

/**
 * Filter {@link DeviceEvent}s emitted by the source Observable by only this address and/or command
 *
 * #### Example
 * ```js
 * const { receive } = require('@z-bus/api/operators');
 * zBus.reception.pipe(receive(80)).subscribe((event) => {
 *   console.log('Received', event.command, 'on address 80');
 * });
 * ```
 *
 * @param address If an emitted {@link DeviceEvent} matches this address (or one of these addresses), it is passed on, and filtered otherwise
 * @param command If an emitted {@link DeviceEvent} matches this command (or one of these commands), it is passed on, and filtered otherwise
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
      }
      return true;
    }),
  );
}

/**
 * Perform a side transmission for every emission on the source {@link DeviceEvent}, but return an {@link DeviceEvent} that is identical to the source.
 *
 * #### Example
 * This implements an automatic staircase timer by using {@link receive}, `transmit`, and the RxJS [debounceTime](https://rxjs-dev.firebaseapp.com/api/operators/debounceTime) operator.
 * ```js
 * const { receive, transmit } = require('@z-bus/api/operators');
 * const { debounceTime } = require('rxjs/operators');
 * zBus.reception
 *   .pipe(
 *      receive(99), // when 99 is triggered
 *      transmit(99, 'on'), // then switch 99 on
 *      debounceTime(3 * 60 * 1000), // debounce for 3 minutes
 *      transmit(99, 'off') // and switch 99 off (after 3 minutes of silence)
 *   )
 *   .subscribe();
 * ```
 *
 * @param address One or more addresses of the controlled {@link Device}(s) between `0` and `242`
 * @param command Valid {@link Command} (name or `number` between `0` and `255`) to send to the device
 * @param data An optional two-bytes data packet.
 */
export function transmit(
  address?: number | Array<number>,
  command?: number | Command,
  data?: Array<number>,
): UnaryFunction<Observable<DeviceEvent>, Observable<DeviceEvent>> {
  //: MonoTypeOperatorFunction<DeviceEvent> {
  return pipe(
    tap((e: DeviceEvent) => {
      ZBus.getInstance().transmit(address ?? e.address, command ?? e.command, data ?? e.data);
    }),
  );
}
