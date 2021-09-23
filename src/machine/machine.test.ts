import { DimmerDevice, ZBus } from '../index';

import { Machine } from './machine';
import { Device } from '../device';
import { Observable, Subject } from 'rxjs';
import { DeviceEvent } from '../deviceEvent';
import { SceneEvent } from '../sceneEvent';
import { Command } from '../command';

const transmission = new Subject<DeviceEvent>();
ZBus.linkInstance(transmission, new Observable<DeviceEvent>(), new Observable<SceneEvent>());

test('switchingDevice', () => {
  const device: Device = { address: [0], type: 'switch' };
  Machine.receive(device, { address: 0, command: 0 });
  Machine.receive(device, { address: 0, command: 0 });
  expect(device.state).toBeUndefined();
  Machine.receive(device, { address: 0, command: 3 });
  expect(device.state).toEqual('on');
  Machine.receive(device, { address: 0, command: 0 });
  expect(device.state).toEqual('off');
  Machine.receive(device, { address: 0, command: 12 });
  expect(device.state).toEqual('off');
  Machine.receive(device, { address: 0, command: 13 });
  expect(device.state).toEqual('off');
  Machine.receive(device, { address: 0, command: 0 });
  expect(device.state).toEqual('on');
});

test('switchingDevice allowedTransitions', () => {
  let device: Device = { address: [0], type: 'switch' };
  expect(Machine.getTransitions(device)).toMatchObject([['on', 'off']]);
  device = { address: [0], type: 'switch', state: 'off' };
  expect(Machine.getTransitions(device)).toMatchObject([['toggle', 'on', 'off']]);
  device = { address: [0], type: 'switch', state: 'on' };
  expect(Machine.getTransitions(device)).toMatchObject([['toggle', 'on', 'off']]);
});

test('dimmerDevice rx', () => {
  const device: Device = { address: [0], type: 'dimmer' };
  Machine.receive(device, { address: 0, command: 0 });
  expect(device.state).toBeUndefined();
  Machine.receive(device, { address: 0, command: 3 });
  expect(device.state).toEqual('on');
  Machine.receive(device, { address: 0, command: 0 });
  expect(device.state).toEqual('off');
  Machine.receive(device, { address: 0, command: 12 });
  expect(device.state).toEqual('off');
  Machine.receive(device, { address: 0, command: 13 });
  expect(device.state).toEqual('off');
  Machine.receive(device, { address: 0, command: 0 });
  expect(device.state).toEqual('on');
  Machine.receive(device, { address: 0, command: 12 });
  expect(device.state).toEqual('off');
  Machine.receive(device, DimmerDevice.createEvent(0, 'on', { brightness: 0.5, duration: 8, direction: 0 }));
  expect(device.state).toEqual('on');
  expect((device as any)?.brightness).toBeDefined();
  expect((device as any)?.brightness).toBeCloseTo(0.5, 1);
  Machine.receive(device, DimmerDevice.createEvent(0, 'on', { brightness: 1.0, duration: 8, direction: 0 }));
  expect((device as any)?.brightness).toBeCloseTo(1.0, 1);
  Machine.receive(device, { address: 0, command: 12 });
  expect((device as any)?.brightness).toBeCloseTo(0.0, 1);
  Machine.receive(device, DimmerDevice.createEvent(0, 'on', { brightness: 0.5, duration: 8, direction: 0 }));
  expect((device as any)?.brightness).toBeCloseTo(0.5, 1);
  Machine.receive(device, { address: 0, command: 0 });
  expect(device.state).toEqual('off');
  expect((device as any)?.memory).toBeCloseTo(0.5, 1);
  Machine.receive(device, { address: 0, command: 0 });
  expect(device.state).toEqual('on');
  expect((device as any)?.brightness).toBeCloseTo(0.5, 1);
});

test('dimmerDevice tx', () => {
  let device: Device = { address: [0], type: 'dimmer' };
  expect(Machine.transmit(device, 'on')).toMatchObject({ address: 0, command: 3 });
  expect(Machine.transmit(device, 'off')).toMatchObject({ address: 0, command: 12 });
  expect(Machine.transmit(device, 'toggle')).toMatchObject({ address: 0, command: 0 });
  device = { address: [0], type: 'dimmer' };
  expect(Machine.transmit(device, 'default')).toMatchObject({ address: 0, command: 3 });
  expect(Machine.transmit(device, 'default')).toMatchObject({ address: 0, command: 12 });
  expect(Machine.transmit(device, 'default')).toMatchObject({ address: 0, command: 3 });
  device = { address: [0], type: 'dimmer' };
  expect(Machine.transmit(device, 'on')).toMatchObject({ address: 0, command: 3 });
  expect(Machine.transmit(device, 'on')).toMatchObject({ address: 0, command: 3 });
  expect(Machine.transmit(device, 'off')).toMatchObject({ address: 0, command: 12 });
  expect(Machine.transmit(device, 'off')).toMatchObject({ address: 0, command: 12 });
  device = { address: [0], type: 'dimmer' };
  expect(Machine.transmit(device, 'toggle')).toMatchObject({ address: 0, command: 0 });
  expect(Machine.transmit(device, 'toggle')).toMatchObject({ address: 0, command: 0 });
  device = { address: [0], type: 'dimmer', state: 'on' };
  expect(Machine.transmit(device, 'on')).toMatchObject({ address: 0, command: 3 });
  expect(Machine.transmit(device, 'off')).toMatchObject({ address: 0, command: 12 });
  expect(Machine.transmit(device, 'toggle')).toMatchObject({ address: 0, command: 0 });
  expect(Machine.transmit(device, 'default')).toMatchObject({ address: 0, command: 12 });
  //Dimming capabilities
  expect(Machine.transmit(device, 'on', { brightness: 1, duration: 8, direction: 0 })).toMatchObject({
    address: 0,
    command: 3,
    data: [0x03, 0xff],
  });
});

test('dimmingDevice allowedTransitions', () => {
  let device: Device = { address: [0], type: 'dimmer' };
  expect(Machine.getTransitions(device)).toMatchObject([['on', 'off']]);
  device = { address: [0], type: 'dimmer', state: 'off' };
  expect(Machine.getTransitions(device)).toMatchObject([['toggle', 'on', 'off']]);
  device = { address: [0], type: 'dimmer', state: 'on' };
  expect(Machine.getTransitions(device)).toMatchObject([['toggle', 'on', 'off']]);
});

test('directionalDevice rx', () => {
  const device: Device = { address: [0], type: 'directional' };
  Machine.receive(device, { address: 0, command: 0 });
  Machine.receive(device, { address: 0, command: 48 });
  expect(device.state).toBeUndefined();
  Machine.receive(device, { address: 0, command: 3 });
  expect(device.state).toEqual('up');
  Machine.receive(device, { address: 0, command: 15 });
  expect(device.state).toEqual('stop');
  Machine.receive(device, { address: 0, command: 12 });
  expect(device.state).toEqual('down');
  Machine.receive(device, { address: 0, command: 15 });
  expect(device.state).toEqual('stop');
  Machine.receive(device, { address: 0, command: 3 });
  expect(device.state).toEqual('up');
  Machine.receive(device, { address: 0, command: 12 });
  expect(device.state).toEqual('down');
  Machine.receive(device, { address: 0, command: 48 });
  expect(device.state).toEqual('up');
  Machine.receive(device, { address: 0, command: 48 });
  expect(device.state).toEqual('stop');
  Machine.receive(device, { address: 0, command: 48 });
  expect(device.state).toEqual('up');
  Machine.receive(device, { address: 0, command: 192 });
  expect(device.state).toEqual('down');
  Machine.receive(device, { address: 0, command: 192 });
  expect(device.state).toEqual('stop');
  Machine.receive(device, { address: 0, command: 192 });
  expect(device.state).toEqual('down');
});

test('directionalDevice tx', () => {
  let device: Device = { address: [0], type: 'directional' };
  expect(Machine.transmit(device, 'up')).toMatchObject({ address: 0, command: 3 });
  expect(Machine.transmit(device, 'down')).toMatchObject({ address: 0, command: 12 });
  expect(Machine.transmit(device, 'stop')).toMatchObject({ address: 0, command: 15 });
  device = { address: [0], type: 'directional' };
  expect(Machine.transmit(device, 'default')).toMatchObject({ address: 0, command: 3 });
  expect(device.state).toEqual('up');
  expect(Machine.transmit(device, 'default')).toMatchObject({ address: 0, command: 15 });
  expect(device.state).toEqual('stop');
  expect(Machine.transmit(device, 'default')).toMatchObject({ address: 0, command: 12 });
  expect(device.state).toEqual('down');
  expect(Machine.transmit(device, 'default')).toMatchObject({ address: 0, command: 15 });
  expect(device.state).toEqual('stop');
  expect(Machine.transmit(device, 'default')).toMatchObject({ address: 0, command: 3 });
  expect(device.state).toEqual('up');
  device = { address: [0], type: 'directional' };
  expect(Machine.transmit(device, 'up-stop')).toMatchObject({ address: 0, command: Command['up-stop'] });
  expect(device.state).toBeUndefined();
  expect(Machine.transmit(device, 'down-stop')).toMatchObject({ address: 0, command: Command['down-stop'] });
  expect(device.state).toBeUndefined();
  expect(Machine.transmit(device, 'stop')).toMatchObject({ address: 0, command: 15 });
  expect(Machine.transmit(device, 'up-stop')).toMatchObject({ address: 0, command: Command['up-stop'] });
  expect(device.state).toEqual('up');
  expect(Machine.transmit(device, 'up-stop')).toMatchObject({ address: 0, command: Command['up-stop'] });
  expect(device.state).toEqual('stop');
  expect(Machine.transmit(device, 'down-stop')).toMatchObject({ address: 0, command: Command['down-stop'] });
  expect(device.state).toEqual('down');
  expect(Machine.transmit(device, 'down-stop')).toMatchObject({ address: 0, command: Command['down-stop'] });
  expect(device.state).toEqual('stop');
});

test('directionalDevice allowedTransitions', () => {
  let device: Device = { address: [0], type: 'directional' };
  expect(Machine.getTransitions(device)).toMatchObject([['up', 'down', 'stop']]);
  device = { address: [0], type: 'directional', state: 'stop' };
  expect(Machine.getTransitions(device)).toMatchObject([['up-stop', 'down-stop', 'up', 'down', 'stop']]);
  device = { address: [0], type: 'directional', state: 'up' };
  expect(Machine.getTransitions(device)).toMatchObject([['up-stop', 'down-stop', 'up', 'down', 'stop']]);
  device = { address: [0], type: 'directional', state: 'down' };
  expect(Machine.getTransitions(device)).toMatchObject([['up-stop', 'down-stop', 'up', 'down', 'stop']]);
});

test('directionalGroupDevice rx', () => {
  const device: Device = { address: [0, 1, 2], type: 'directional-group' };

  //Undefined states
  Machine.receive(device, { address: 0, command: Command['up'] });
  expect(device.state).toBeUndefined();
  Machine.receive(device, { address: 0, command: Command['down'] });
  expect(device.state).toBeUndefined();
  Machine.receive(device, { address: 0, command: Command['stop'] });
  expect(device.state).toBeUndefined();
  Machine.receive(device, { address: 1, command: Command['up-stop'] });
  expect(device.state).toBeUndefined();
  Machine.receive(device, { address: 1, command: Command['down-stop'] });
  expect(device.state).toBeUndefined();
  Machine.receive(device, { address: 2, command: Command['up-stop'] });
  expect(device.state).toBeUndefined();
  Machine.receive(device, { address: 2, command: Command['down-stop'] });
  expect(device.state).toBeUndefined();
  Machine.receive(device, { address: 0, command: Command['up-stop'] });
  expect(device.state).toBeUndefined();
  Machine.receive(device, { address: 0, command: Command['down-stop'] });
  expect(device.state).toBeUndefined();

  //Undefined states
  Machine.receive(device, { address: 1, command: Command['up'] });
  expect(device.state).toEqual('up');
  Machine.receive(device, { address: 1, command: Command['down'] });
  expect(device.state).toEqual('down');
  Machine.receive(device, { address: 1, command: Command['stop'] });
  expect(device.state).toEqual('stop');
  Machine.receive(device, { address: 0, command: Command['up-stop'] });
  expect(device.state).toEqual('up');
  Machine.receive(device, { address: 0, command: Command['up-stop'] });
  expect(device.state).toEqual('stop');
  Machine.receive(device, { address: 0, command: Command['down-stop'] });
  expect(device.state).toEqual('down');
  Machine.receive(device, { address: 0, command: Command['down-stop'] });
  expect(device.state).toEqual('stop');
});

test('directionalGroupDevice tx', () => {
  let device: Device = { address: [0, 1, 2], type: 'directional-group' };
  expect(Machine.transmit(device, 'up', undefined, 1)).toMatchObject({ address: 1, command: 3 });
  expect(Machine.transmit(device, 'down', undefined, 1)).toMatchObject({ address: 1, command: 12 });
  expect(Machine.transmit(device, 'stop', undefined, 1)).toMatchObject({ address: 1, command: 15 });
  device = { address: [0], type: 'directional-group', state: 'stop' };
  expect(Machine.transmit(device, 'default')).toMatchObject({ address: 0, command: Command['up-stop'] });
  expect(device.state).toEqual('up');
  expect(Machine.transmit(device, 'default')).toMatchObject({ address: 0, command: Command['up-stop'] });
  expect(device.state).toEqual('stop');
  expect((device as any).memory).toEqual('up');
  expect(Machine.transmit(device, 'default')).toMatchObject({ address: 0, command: Command['down-stop'] });
  expect(device.state).toEqual('down');
  expect(Machine.transmit(device, 'default')).toMatchObject({ address: 0, command: Command['down-stop'] });
  expect(device.state).toEqual('stop');
  expect(Machine.transmit(device, 'default')).toMatchObject({ address: 0, command: Command['up-stop'] });
  expect(device.state).toEqual('up');
  device = { address: [0, 1, 2], type: 'directional-group' };
  expect(Machine.transmit(device, 'up-stop', undefined, 0)).toMatchObject({ address: 0, command: Command['up-stop'] });
  expect(device.state).toBeUndefined();
  expect(Machine.transmit(device, 'down-stop', undefined, 0)).toMatchObject({
    address: 0,
    command: Command['down-stop'],
  });
  expect(device.state).toBeUndefined();
  expect(Machine.transmit(device, 'stop', undefined, 1)).toMatchObject({ address: 1, command: 15 });
  expect(device.state).toEqual('stop');
  expect(Machine.transmit(device, 'up', undefined, 1)).toMatchObject({ address: 1, command: 3 });
  expect(device.state).toEqual('up');
  expect(Machine.transmit(device, 'down', undefined, 1)).toMatchObject({ address: 1, command: 12 });
  expect(device.state).toEqual('down');
});

test('directionalGroupDevice allowedTransitions', () => {
  let device: Device = { address: [0, 1, 2], type: 'directional-group' };
  expect(Machine.getTransitions(device)).toMatchObject([[], ['up', 'down', 'stop'], ['up', 'down', 'stop']]);
  device = { address: [0, 1, 2], type: 'directional-group', state: 'stop' };
  expect(Machine.getTransitions(device)).toMatchObject([
    ['up-stop', 'down-stop'],
    ['up', 'down', 'stop'],
    ['up', 'down', 'stop'],
  ]);
  device = { address: [0, 1, 2], type: 'directional-group', state: 'up' };
  expect(Machine.getTransitions(device)).toMatchObject([
    ['up-stop', 'down-stop'],
    ['up', 'down', 'stop'],
    ['up', 'down', 'stop'],
  ]);
  device = { address: [0, 1, 2], type: 'directional-group', state: 'down' };
  expect(Machine.getTransitions(device)).toMatchObject([
    ['up-stop', 'down-stop'],
    ['up', 'down', 'stop'],
    ['up', 'down', 'stop'],
  ]);
});
