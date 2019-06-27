# UI for Leap DAO plasma bridge contract

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

You can:

- Deposit tokens on plasma
- Transfer plasma tokens
- Exit UTXOs from plasma to the root chain
- Browse network with block explorer
- Register token contract
- Get some tokens
- View pending [governance](https://leapdao.org/blog/Minimal-Viable-Governance/) proposals
- ...

## Links

Testnet: https://testnet.leapdao.org/

Mainnet: https://mainnet.leapdao.org/

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
yarn build:testnet
yarn deploy:testnet
```

Mainnet:
```
yarn build:mainnet
yarn deploy:mainnet
```
