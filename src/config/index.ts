export const { CONFIG_NAME } = require('./env') || { CONFIG_NAME: 'localnet' };

let config;

try {
  config = require(`./${CONFIG_NAME}/config.json`);
} catch (e) {
  config = {
    'name': 'localnet',
    'rootNetworkId': '4',
    'nodes': [
      'http://localhost:8645'
    ]
  };
}

export const CONFIG = config;
