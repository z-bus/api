/**
 * JS scripting API
 *
 * This is module links the Z-Bus smart home event bus system to the JS scripting environment of the [Z-Bus Interface](https://z-bus.de/produkte/interface) home server and IoT gateway.
 *
 * @module api
 */
import { ZBus } from './ZBus';

/**
 * The global `zBus` object is an instance of {@link ZBus} to access the Z-Bus smart home system
 */
export const zBus: ZBus = new ZBus();

export { ZBus } from './ZBus';

export { DeviceEvent } from './deviceEvent';
export { DimmerEvent } from './dimmerEvent';
export { SceneEvent } from './sceneEvent';

export { Device } from './device';

export { Command } from './deviceTypes';
