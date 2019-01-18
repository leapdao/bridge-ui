import { NamedNodeEntry } from '../utils/types.d';

export const { CONFIG_NAME } = require('./env') || { CONFIG_NAME: 'localnet' };

const defaultConfig = {
  'name': 'localnet',
  'consensus': 'poa',
  'nodes': [
    'http://localhost:8645'
  ]
};

const readConfig = (name) => {
  try {
    return require(`./${name}/config.json`);
  } catch (e) {
    return defaultConfig;
  }  
};

const toNamedNodeEntry = (node: string|NamedNodeEntry): NamedNodeEntry => {
  if (typeof node === 'object') return node;

  return { url: node } as NamedNodeEntry;
};

const config = readConfig(CONFIG_NAME);

config.nodes = Object.values(config.nodes).map(toNamedNodeEntry);

export const CONFIG = config;
