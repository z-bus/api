import { ZBus } from './index';

import { Observable, Subject } from 'rxjs';
import { DeviceEvent } from './deviceEvent';
import { SceneEvent } from './sceneEvent';
import { toArray } from 'rxjs/operators';
import { SwitchingDevice } from './switchingDevice';

test('transmit', (done) => {
  const transmission = new Subject<DeviceEvent>();
  ZBus.linkInstance(transmission, new Observable<DeviceEvent>(), new Observable<SceneEvent>());

  const expectedTransmission = [
    { address: 0, command: 0 },
    { address: 0, command: 3 },
    { address: 0, command: 12 },
    { address: 0, command: 0 },
    { address: 0, command: 3 },
    { address: 0, command: 12 },
    { address: 0, command: 0 },
    { address: 0, command: 3 },
    { address: 0, command: 12 },
  ];

  transmission.pipe(toArray()).subscribe((events: Array<DeviceEvent>) => {
    expect(events).toEqual(expectedTransmission);
    done();
  });

  const test = new SwitchingDevice(0);
  test.toggle();
  test.on();
  test.off();
  test.transmit('toggle');
  test.transmit('on');
  test.transmit('off');
  test.transmit(0);
  test.transmit(3);
  test.transmit(12);
  transmission.complete();
});

test('throw', () => {
  expect(() => {
    new SwitchingDevice(-1);
  }).toThrow(/address/);
  expect(() => {
    new SwitchingDevice(243);
  }).toThrow(/address/);
  expect(() => {
    new SwitchingDevice(0).transmit(-1);
  }).toThrow(/command/);
  expect(() => {
    new SwitchingDevice(0).transmit(256);
  }).toThrow(/command/);
  expect(() => {
    new SwitchingDevice(0).transmit('no-nii' as any);
  }).toThrow(/command/);
});
