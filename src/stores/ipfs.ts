import * as bs58 from 'bs58';
import * as BufferList from 'bl/BufferList';
const ipfsHttpClient = require('ipfs-http-client');
import { bufferToHex } from 'ethereumjs-util';

// cut IPFS preamble (first 2 bytes)
export const cidToHex = (cid: string): string =>
  bufferToHex(bs58.decode(cid).slice(2));

// Add our default ipfs preamble:
// function:0x12=sha2, size:0x20=256 bits
export const hexToCid = (bytes32: string): string => {
  const hashHex = `1220${bytes32.slice(2)}`;
  return bs58.encode(Buffer.from(hashHex, 'hex'));
};

export const ipfs = ipfsHttpClient({
  host: 'ipfs.infura.io',
  port: 5001,
  protocol: 'https',
});

export const add = async (data: string): Promise<string> => {
  for await (const result of ipfs.add(data)) {
    return result.cid.toString();
  }
};

export const get = async (ipfsHash: string): Promise<string> => {
  for await (const data of ipfs.get(ipfsHash)) {
    const content = new BufferList();
    for await (const chunk of data.content) {
      content.append(chunk);
    }
    return content.toString();
  }
};
