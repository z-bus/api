/**
 * JS scripting API
 *
 * This is module links the Z-Bus smart home event bus system to the JS scripting environment of the [Z-Bus Interface](https://z-bus.de/produkte/interface) home server and IoT gateway.
 *
 * @module api
 */
import { ZBus } from './ZBus';

/**
 * The global `zBus` object is an instance of {@link ZBus} which is loaded into the
 * [Z-Bus Home Script](https://home.z-bus.com/script) scripting runtime environment.
 * It allows you to access and control the Z-Bus smart home system:
 *  * receiving Z-Bus device events (and react to sensory input from these devices)
 *  * transmitting Z-Bus device events (to control these devices)
 *  * dimming lights
 *  * controlling lighting scenes
 *  * creating logic control flows and central control
 *  * designing timers and presence simulations
 *
 * These library functions are described in the {@link ZBus} class
 */
export const zBus = ZBus?.getInstance();

export { ZBus, DeviceEventNotification, SceneEventNotification } from './ZBus';

export { DeviceEvent } from './deviceEvent';
export { SceneEvent } from './sceneEvent';

export { Device } from './device';
export { Transmitter } from './transmitter';
export { Receiver } from './receiver';
export { SwitchingDevice } from './switchingDevice';
export { DirectionalDevice } from './directionalDevice';
export { DirectionalGroupDevice } from './directionalGroupDevice';
export { DimmerDevice } from './dimmerDevice';
export { DimmerData } from './dimmerData';

export { Command } from './command';
