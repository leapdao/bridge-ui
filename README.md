# UI for PARSEC Labs plasma bridge contract

[![PRs Welcome](https://img.shields.io/badge/PRs-welcome-brightgreen.svg?style=flat-square)](http://makeapullrequest.com)

![Alt text](screenshot.png)

You can:

- View and buy slots
- Make deposit
- ...

## Links

Dev: http://stake-dev.parseclabs.org/

Testnet: N/A

Mainnet: N/A

## Install

`yarn`

## Run locally

```
BRIDGE_ADDR=0x59298cae9934ea981a60f216fe4bd508be9e804b TOKEN_ADDR=0xa6794e7663add37e44ae6bb1e8544b8de1e238cb yarn start
```

## Build for deployment

Provide proper addresses for token and bridge contracts.

```
BRIDGE_ADDR=0x59298cae9934ea981a60f216fe4bd508be9e804b TOKEN_ADDR=0xa6794e7663add37e44ae6bb1e8544b8de1e238cb yarn run build
```

## Deploy to S3

Dev:
`yarn run deploy:dev`

Testnet: `yarn run deploy:testnet`

Mainnet: `yarn run deploy:mainnet`
