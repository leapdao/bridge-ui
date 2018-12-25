# UI for Leap DAO plasma bridge contract

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

You can:

- View and buy slots
- Make deposit
- Transfer plasma tokens
- Exit UTXOs
- Browse network with block explorer
- Register token contract
- Get some tokens
- ...

## Links

Dev: http://bridge-dev.leapdao.org/

Mainnet: N/A

## Install

`yarn`

## Run locally

```
yarn start
```

## Build params (env variables) 

- `NETWORK_ID` — root network (1 — mainnet, 4 — rinkeby and so on)
- `PLASMA_NODE_URL` - url for plasma node JSON RPC
- `CONFIG` - name of config preset. Possible values: `localnet` (default), `testnet`

## Deployment

Dev: 
```
NETWORK_ID=4 PLASMA_NODE_URL=http://node1.testnet.leapdao.org:8645 yarn build
yarn deploy:dev
```

Testnet:
```
CONFIG=testnet yarn build
yarn deploy:testnet
```

Mainnet: `yarn run deploy:mainnet`
