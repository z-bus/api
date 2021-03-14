import { DimmerData, ZBus } from './index';

import { Observable, Subject } from 'rxjs';
import { DeviceEvent } from './deviceEvent';
import { SceneEvent } from './sceneEvent';
import { toArray } from 'rxjs/operators';
import { DimmerDevice } from './dimmerDevice';

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
    { address: 0, command: 3, data: [0x03, 0xff] },
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

  const test = new DimmerDevice(0);
  test.toggle();
  test.on();
  test.off();
  test.transmit('toggle');
  test.transmit('on');
  test.transmit('off');
  test.transmit(0);
  test.transmit(3);
  test.transmit(12);
  test.transmit('on', 1.0);
  test.dim(1.0);
  test.dim(0.5);
  test.dim(0.0);
  test.dim(1.0, 160);
  test.dim(1.0, 0.04);
  transmission.complete();
});

test('read data', () => {
  let data = DimmerData.unpack([0x03, 0xff]);
  expect(data.duration).toBeCloseTo(8.0, 0);
  expect(data.brightness).toEqual(1.0);
  expect(data.direction).toEqual(0);

  data = DimmerData.unpack([0x03, 0x80]);
  expect(data.brightness).toBeCloseTo(0.5, 1);

  data = DimmerData.unpack([0x03, 0x00]);
  expect(data.brightness).toEqual(0.0);

  data = DimmerData.unpack([0x3f, 0x00]);
  expect(data.duration).toBeCloseTo(161.0, 0);

  data = DimmerData.unpack([0x7f, 0x00]);
  expect(data.duration).toBeCloseTo(0.04, 1);
});

test('throw', () => {
  expect(() => {
    new DimmerDevice(-1);
  }).toThrow(/address/);
  expect(() => {
    new DimmerDevice(243);
  }).toThrow(/address/);
  expect(() => {
    new DimmerDevice(0).transmit(-1);
  }).toThrow(/command/);
  expect(() => {
    new DimmerDevice(0).transmit(256);
  }).toThrow(/command/);
  expect(() => {
    new DimmerDevice(0).transmit('no-nii' as any);
  }).toThrow(/command/);
  expect(() => {
    new DimmerDevice(0).dim(-1);
  }).toThrow(/brightness/);
  expect(() => {
    new DimmerDevice(0).dim(1.1);
  }).toThrow(/brightness/);
  expect(() => {
    new DimmerDevice(0).dim(1.0, 0.03);
  }).toThrow(/duration/);
  expect(() => {
    new DimmerDevice(0).dim(1.0, 161);
  }).toThrow(/duration/);
});
