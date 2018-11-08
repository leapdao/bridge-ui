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
NETWORK_ID=4 PLASMA_NODE=1 BRIDGE_ADDR=0x099303c83fda47570b255a8fcebf5f8dd86e015e yarn start
```

## Build for deployment

Provide proper network id and addresses for token and bridge contracts.

```
NETWORK_ID=4 BRIDGE_ADDR=0x099303c83fda47570b255a8fcebf5f8dd86e015e yarn run build
```

## Build params (env variables)

- `NETWORK_ID` — root network (1 — mainnet, 4 — rinkeby and so on)
- `PLASMA_NODE` — plasma node id (0 — local, 1 — testnet 1, 2 — testnet 2)
- `BRIDGE_ADDR` — default bridge address

## Deploy to S3

Dev: `yarn run deploy:dev`

Testnet: `yarn run deploy:testnet`

Mainnet: `yarn run deploy:mainnet`
