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
NETWORK_ID=4 PLASMA_NODE=1 yarn start
```

## Build for deployment

Provide proper network id, plasma node instance to use and governance contract address.

```
NETWORK_ID=4 PLASMA_NODE=1 GOVERNANCE_ADDR=0xeae90e8b0e4ddfa355558ee179a8b5c3eb73116b yarn run build
```

## Build params (env variables)

- `NETWORK_ID` — root network (1 — mainnet, 4 — rinkeby and so on)
- `PLASMA_NODE` — plasma node id (0 — local, 1 — testnet 1, 2 — testnet 2)
- `GOVERNANCE_ADDR` — address of the Governance contract.

## Deploy to S3

Dev: `yarn run deploy:dev`

Testnet: `yarn run deploy:testnet`

Mainnet: `yarn run deploy:mainnet`
