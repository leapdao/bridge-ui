import React, { cloneElement } from 'react';
import PropTypes from 'prop-types';
import { Spin } from 'antd';

import getWeb3 from '../utils/getWeb3';
import * as abis from '../utils/abis';
import promisifyWeb3Call from '../utils/promisifyWeb3Call';
import { tokenAddress } from '../utils/addrs';
import { NETWORKS } from '../utils';
import Message from './message';

export default class Web3Wrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      ready: false,
    };
  }

  componentDidMount() {
    if (window.web3) {
      this.loadData();
    }
  }

  loadData() {
    const token = getWeb3()
      .eth.contract(abis.token)
      .at(tokenAddress);

    Promise.all([
      promisifyWeb3Call(getWeb3(true).eth.getAccounts),
      promisifyWeb3Call(token.decimals),
      promisifyWeb3Call(token.symbol),
      promisifyWeb3Call(getWeb3().version.getNetwork),
      promisifyWeb3Call(getWeb3(true).version.getNetwork),
    ]).then(([accounts, decimals, symbol, network, mmNetwork]) => {
      const web3 = getWeb3();
      this.setState({
        account: accounts[0],
        decimals: new web3.BigNumber(10).pow(decimals),
        symbol,
        network,
        mmNetwork,
        ready: true,
      });
    });

    setInterval(() => {
      promisifyWeb3Call(getWeb3(true).eth.getAccounts).then(accounts =>
        this.setState({ account: accounts[0] })
      );
    }, 1000);
  }

  render() {
    const { ready, account, network, mmNetwork, decimals, symbol } = this.state;
    if (!window.web3) {
      return (
        <Message>
          You need to{' '}
          <a
            href="https://metamask.io/"
            target="_blank"
            rel="noopener noreferrer"
          >
            install MetaMask
          </a>{' '}
          first
        </Message>
      );
    }

    if (!ready) {
      return (
        <Message hideBg>
          <Spin size="large" />
        </Message>
      );
    }

    if (!account) {
      return <Message>You need to unlock MetaMask</Message>;
    }

    if (mmNetwork !== network) {
      return (
        <Message>You need to switch MetaMask to {NETWORKS[network]}</Message>
      );
    }

    return cloneElement(this.props.children, {
      account,
      decimals,
      symbol,
      network,
    });
  }
}

Web3Wrapper.propTypes = {
  children: PropTypes.any,
};
