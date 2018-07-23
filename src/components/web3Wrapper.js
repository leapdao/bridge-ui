import React, { cloneElement } from 'react';
import PropTypes from 'prop-types';
import { Spin } from 'antd';

import getWeb3 from '../utils/getWeb3';
import * as abis from '../utils/abis';
import { DEFAULT_NETWORK } from '../utils';
import Message from './message';

if (!process.env.BRIDGE_ADDR) {
  console.error(
    'Missing Bridge contract address. Please rebuild with BRIDGE_ADDR env variable set'
  );
}

const getBridgeAddress = () => {
  const hash = window.location.hash.replace('#', '');
  if (hash.startsWith('0x') && hash.length === 42) {
    return hash;
  }

  return process.env.BRIDGE_ADDR;
};

export default class Web3Wrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ready: false,
      network: process.env.NETWORK_ID || DEFAULT_NETWORK,
    };
  }

  componentDidMount() {
    this.loadData();
  }

  loadData() {
    const web3 = getWeb3();
    const bridge = new web3.eth.Contract(abis.bridge, getBridgeAddress());

    bridge.methods
      .tokens(0)
      .call()
      .then()
      .then(({ addr: tokenAddress }) => {
        this.setState({ tokenAddress });
        const token = new web3.eth.Contract(abis.token, tokenAddress);

        const promises = [
          token.methods.decimals().call(),
          token.methods
            .symbol()
            .call()
            .catch(e => console.error('Failed to read token symbol', e)),
        ];

        if (window.web3) {
          const iWeb3 = getWeb3(true);
          promises.push(iWeb3.eth.getAccounts());
          promises.push(iWeb3.eth.net.getId());

          setInterval(() => {
            iWeb3.eth.getAccounts().then(accounts => {
              if (this.state.account !== accounts[0]) {
                this.setState({ account: accounts[0] });
              }
            });
          }, 1000);
        }
        Promise.all(promises).then(
          ([decimals, symbol, accounts, mmNetwork]) => {
            this.setState({
              account: accounts && accounts[0],
              decimals: 10 ** decimals,
              symbol,
              ready: true,
              mmNetwork: String(mmNetwork),
            });
          }
        );
      });
  }

  render() {
    const {
      ready,
      account,
      network,
      mmNetwork,
      decimals,
      symbol,
      tokenAddress,
    } = this.state;

    if (!ready) {
      return (
        <Message hideBg>
          <Spin size="large" />
        </Message>
      );
    }

    return cloneElement(this.props.children, {
      account,
      decimals,
      symbol,
      network,
      tokenAddress,
      canSubmitTx: !!window.web3 && !!account && network === mmNetwork,
      bridgeAddress: getBridgeAddress(),
      defaultBridgeAddress: process.env.BRIDGE_ADDR,
    });
  }
}

Web3Wrapper.propTypes = {
  children: PropTypes.any,
};
