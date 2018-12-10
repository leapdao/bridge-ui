import { default as bridge } from './bridge';
import { default as operator } from './operator';
import { default as exitHandler } from './exitHandler';
import { default as proxy } from './proxy';

const governable = proxy.concat(operator, bridge, exitHandler)


export { default as erc20 } from './erc20';
export { default as erc721 } from './erc721';
export { default as governance } from './governance';
export { 
  bridge, operator, exitHandler, governable
};
