export const env = require('./env');

export const CONFIG_NAME = env.CONFIG_NAME || 'localnet';

export const CONFIG = require(`./${CONFIG_NAME}/config.json`);
