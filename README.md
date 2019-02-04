# UI for Leap DAO plasma bridge contract

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

You can:

- View and buy slots (if PoS plasma contract is set)
- Make deposit
- Transfer plasma tokens
- Exit UTXOs
- Browse network with block explorer
- Register token contract
- Get some tokens
- ...

## Links

Dev: http://bridge-dev.leapdao.org/

Testnet: http://testnet.leapdao.org/

Mainnet: http://mainnet.leapdao.org/

## Install

`yarn`

## Run locally

```
yarn start
```

This will use config from `presets/localnet/config.json`

## Build params (env variables) 

- `CONFIG` - name of config preset. Possible values: `localnet` (default), `testnet`, `mainnet`.

## Deployment

Testnet:
```
CONFIG=testnet yarn build
yarn deploy:testnet
```

Mainnet:
```
CONFIG=mainnet yarn build
yarn deploy:mainnet
```
