import { zBus } from './index';

import { DeviceEvent } from './deviceEvent';

import { of, Subject } from 'rxjs';
import { toArray } from 'rxjs/operators';

const transmission = new Subject<DeviceEvent>();
//const reception = new Observable<DeviceEvent>();
zBus.link(transmission, undefined, undefined);

test('transmit', (done) => {
  const expectedTransmission = [
    new DeviceEvent(98, 'on'),
    new DeviceEvent(98, 3),
    new DeviceEvent(5, 'down'),
    new DeviceEvent(1, 'down'),
    new DeviceEvent(2, 'down'),
    new DeviceEvent(3, 'down'),
    new DeviceEvent(4, 'down'),
    new DeviceEvent(5, 'down'),
    new DeviceEvent(5, 3, [0x03, 0xff]),
  ];

  transmission.pipe(toArray()).subscribe((events: Array<DeviceEvent>) => {
    expect(events).toEqual(expectedTransmission);
    done();
  });

  zBus.transmit(98, 'on');
  zBus.transmit(98, 3);
  zBus.transmit(5, 'down');
  zBus.transmit([1, 2, 3, 4, 5], 'down');
  zBus.transmit(5, 'on', [0x03, 0xff]);

  transmission.complete();
});

test('invalid transmit throws', () => {
  expect(() => {
    zBus.transmit(-1, 'on');
  }).toThrow(/address/);
  expect(() => {
    zBus.transmit(243, 'on');
  }).toThrow(/address/);
  expect(() => {
    zBus.transmit(0, -1);
  }).toThrow(/command/);
  expect(() => {
    zBus.transmit(0, 256);
  }).toThrow(/command/);
  expect(() => {
    zBus.transmit(0, 'no-nii' as any);
  }).toThrow(/command/);
  expect(() => {
    zBus.transmit(5, 'on', [0x03, 256]);
  }).toThrow(/value/);
  expect(() => {
    zBus.transmit(5, 'on', [-1, 255]);
  }).toThrow(/value/);
  expect(() => {
    zBus.transmit(5, 'on', [0]);
  }).toThrow(/length/);
  expect(() => {
    zBus.transmit(5, 'on', [0, 0, 0]);
  }).toThrow(/length/);
});

test.only('receive', (done) => {
  zBus.reception = of(new DeviceEvent(0, 0), new DeviceEvent(0, 0), new DeviceEvent(1, 2), new DeviceEvent(2, 0));

  const all = jest.fn();
  zBus.receive(all);
  expect(all).toHaveBeenCalledTimes(4);

  const many = jest.fn();
  zBus.receive([0, 1], many);
  expect(many).toHaveBeenCalledTimes(3);

  const zero = jest.fn();
  zBus.receive(0, zero);
  expect(zero).toHaveBeenCalledTimes(2);

  zBus.receive(0, (event) => {
    expect(event.address).toBe(0);
    expect(event.data).toBeUndefined();
  });
  zBus.receive([0, 1], (event) => {
    expect(event.address === 0 || event.address === 1).toBe(true);
  });
  zBus.receive(0, 0, (event) => {
    expect(event.address).toBe(0);
    expect(event.command).toBe(0);
    expect(event.data).toBeUndefined();
  });
  zBus.receive(0, 'toggle', (event) => {
    expect(event.address).toBe(0);
    expect(event.command).toBe(0);
    expect(event.data).toBeUndefined();
  });
  zBus.receive(1, 2, (event) => {
    expect(event.address).toBe(1);
    expect(event.command).toBe(2);
    expect(event.data).toBeUndefined();
  });
  done();
});
