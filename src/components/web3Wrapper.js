import React, { cloneElement } from 'react';
import PropTypes from 'prop-types';
import { Spin } from 'antd';

import getWeb3 from '../utils/getWeb3';
import * as abis from '../utils/abis';
import promisifyWeb3Call from '../utils/promisifyWeb3Call';
import { bridgeAddress } from '../utils/addrs';
import { DEFAULT_NETWORK } from '../utils';
import Message from './message';

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
    const bridge = getWeb3()
      .eth.contract(abis.bridge)
      .at(bridgeAddress);

    promisifyWeb3Call(bridge.tokens, 0).then(([tokenAddress]) => {
      console.log(tokenAddress);
      this.setState({ tokenAddress });
      const token = getWeb3()
        .eth.contract(abis.token)
        .at(tokenAddress);

      const promises = [
        promisifyWeb3Call(token.decimals),
        promisifyWeb3Call(token.symbol).catch(e =>
          console.error('Failed to read token symbol', e)
        ),
      ];

      if (window.web3) {
        promises.push(promisifyWeb3Call(getWeb3(true).eth.getAccounts));

        setInterval(() => {
          promisifyWeb3Call(getWeb3(true).eth.getAccounts).then(accounts =>
            this.setState({ account: accounts[0] })
          );
        }, 1000);
      }

      Promise.all(promises).then(([decimals, symbol, accounts]) => {
        const web3 = getWeb3();
        this.setState({
          account: accounts && accounts[0],
          decimals: new web3.BigNumber(10).pow(decimals),
          symbol,
          ready: true,
        });
      });
    });
  }

  render() {
    const {
      ready,
      account,
      network,
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
    });
  }
}

Web3Wrapper.propTypes = {
  children: PropTypes.any,
};
