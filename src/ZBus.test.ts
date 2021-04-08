import { ZBus } from './index';

import { DeviceEvent } from './deviceEvent';

import { Observable, of, Subject } from 'rxjs';
import { toArray } from 'rxjs/operators';
import { SceneEvent } from './index';

test('transmit', (done) => {
  const transmission = new Subject<DeviceEvent>();
  const zBus = ZBus.linkInstance(transmission, new Observable<DeviceEvent>(), new Observable<SceneEvent>());

  const expectedTransmission = [
    { address: 98, command: 3 },
    { address: 98, command: 3 },
    { address: 5, command: 12 },
    { address: 1, command: 12 },
    { address: 2, command: 12 },
    { address: 3, command: 12 },
    { address: 4, command: 12 },
    { address: 5, command: 12 },
    { address: 5, command: 3, data: [0x03, 0xff] },
    { address: 0, command: 3, data: [0x03, 0xff] },
    { address: 0, command: 3, data: [0x03, 0x80] },
    { address: 0, command: 3, data: [0x03, 0x00] },
    { address: 0, command: 3, data: [0x3f, 0xff] },
    { address: 0, command: 3, data: [0x7f, 0xff] },
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
  zBus.dim(0, 1.0);
  zBus.dim(0, 0.5);
  zBus.dim(0, 0.0);
  zBus.dim(0, 1.0, 160);
  zBus.dim(0, 1.0, 0.04);

  transmission.complete();
});

test('invalid transmit throws', () => {
  const zBus = ZBus.linkInstance(
    new Subject<DeviceEvent>(),
    new Observable<DeviceEvent>(),
    new Observable<SceneEvent>(),
  );
  expect(() => {
    zBus.transmit(-1, 'on');
  }).toThrow(/address/);
  expect(() => {
    zBus.transmit(243, 'on');
  }).toThrow(/address/);
  expect(() => {
    zBus.transmit(0, -1);
  }).toThrow(/event/);
  expect(() => {
    zBus.transmit(0, 256);
  }).toThrow(/event/);
  expect(() => {
    zBus.transmit(0, 'no-nii' as any);
  }).toThrow(/event/);
  expect(() => {
    zBus.transmit(5, 'on', [0x03, 256]);
  }).toThrow(/data/);
  expect(() => {
    zBus.transmit(5, 'on', [-1, 255]);
  }).toThrow(/data/);
  expect(() => {
    zBus.transmit(5, 'on', [0]);
  }).toThrow(/length/);
  expect(() => {
    zBus.transmit(5, 'on', [0, 0, 0]);
  }).toThrow(/length/);
});

test('receive', (done) => {
  const zBus = ZBus.linkInstance(
    new Subject<DeviceEvent>(),
    of({ address: 0, command: 0 }, { address: 0, command: 0 }, { address: 1, command: 2 }, { address: 2, command: 0 }),
    new Observable<SceneEvent>(),
  );
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

test('reception callback', (done) => {
  const zBus = ZBus.linkInstance(
    new Subject<DeviceEvent>(),
    of({ address: 0, command: 0 }, { address: 99, command: 3 }, { address: 99, command: 12 }),
    new Observable<SceneEvent>(),
  );

  const counter = jest.fn();
  zBus.receive((event) => {
    expect(event.address).toBeGreaterThanOrEqual(0);
    expect(event.command).toBeGreaterThanOrEqual(0);
    expect(event.data).toBeUndefined();
    counter();
  });
  expect(counter).toHaveBeenCalledTimes(3);

  let count = 0;
  function switchEverything(event: any) {
    expect(event.address).toBe(99);
    expect(event.command === 3 || event.command === 12).toBeTruthy();
    count++;
  }
  zBus.receive(99, ['on', 'off'], switchEverything);
  expect(count).toBe(2);
  done();
});
