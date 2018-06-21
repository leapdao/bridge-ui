# UI for PARSEC Labs plasma bridge contract

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

![Alt text](screenshot.png)

You can:

- View and buy slots
- Make deposit
- Get some tokens
- ...

## Links

Dev: http://stake-dev.parseclabs.org/

Testnet: N/A

Mainnet: N/A

## Install

`yarn`

## Run locally

```
NETWORK_ID=4 BRIDGE_ADDR=0x78f353c5e92a6e86418b18815fcec3cc47a2d508 TOKEN_ADDR=0x258daf43d711831b8fd59137f42030784293e9e6 yarn start
```

## Build for deployment

Provide proper network id and addresses for token and bridge contracts.

```
NETWORK_ID=4 BRIDGE_ADDR=0x78f353c5e92a6e86418b18815fcec3cc47a2d508 TOKEN_ADDR=0x258daf43d711831b8fd59137f42030784293e9e6 yarn run build
```

## Deploy to S3

Dev:
`yarn run deploy:dev`

Testnet: `yarn run deploy:testnet`

Mainnet: `yarn run deploy:mainnet`
