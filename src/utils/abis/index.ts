export { default as bridge } from './bridge';
export { default as operator } from './operator';
export { default as exitHandler } from './exitHandler';
export { default as erc20 } from './erc20';
export { default as erc721 } from './erc721';
export { default as governance } from './governance';

import { default as newBridge } from './newBridgeAbis';
import { default as proxy } from './proxy';

const governable = newBridge.concat(proxy);

export { governable as governable };
