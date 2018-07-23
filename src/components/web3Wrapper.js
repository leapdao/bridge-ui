import React, { cloneElement } from 'react';
import { Provider } from 'mobx-react';
import PropTypes from 'prop-types';
import { Spin } from 'antd';

import getWeb3 from '../utils/getWeb3';
import { DEFAULT_NETWORK } from '../utils';
import Message from './message';

import Tokens from '../stores/tokens.ts';
import Account from '../stores/account.ts';

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
    const promises = [];

    if (window.web3) {
      const iWeb3 = getWeb3(true);
      promises.push(iWeb3.eth.getAccounts());
      promises.push(iWeb3.eth.net.getId());

      setInterval(() => {
        iWeb3.eth.getAccounts().then(accounts => {
          if (this.state.account !== accounts[0]) {
            this.setState({ account: accounts[0] });
            this.stores.account.address = accounts[0]; // eslint-disable-line
          }
        });
      }, 1000);
    }
    Promise.all(promises).then(([accounts, mmNetwork]) => {
      const account = new Account(accounts[0]);
      const tokens = new Tokens(account, getBridgeAddress());
      this.stores = {
        account,
        tokens,
      };
      this.setState({
        account: accounts && accounts[0],
        ready: true,
        mmNetwork: String(mmNetwork),
      });
    });
  }

  render() {
    const { ready, account, network, mmNetwork } = this.state;

    if (!ready) {
      return (
        <Message hideBg>
          <Spin size="large" />
        </Message>
      );
    }

    return (
      <Provider {...this.stores}>
        {cloneElement(this.props.children, {
          account,
          network,
          canSubmitTx: !!window.web3 && !!account && network === mmNetwork,
          bridgeAddress: getBridgeAddress(),
          defaultBridgeAddress: process.env.BRIDGE_ADDR,
        })}
      </Provider>
    );
  }
}

Web3Wrapper.propTypes = {
  children: PropTypes.any,
};
