import { Observable, pipe, UnaryFunction } from 'rxjs';
import { tap } from 'rxjs/operators';

import { DeviceEvent } from '../deviceEvent';

import { ZBus } from '../ZBus';

import { Command } from '../command';

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
