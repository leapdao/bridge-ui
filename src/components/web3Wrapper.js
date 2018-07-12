import React from 'react';
import { Provider } from 'mobx-react';
import PropTypes from 'prop-types';
import { Spin } from 'antd';

import getWeb3 from '../utils/getWeb3';
import { DEFAULT_NETWORK } from '../utils';
import Message from './message';

import Tokens from '../stores/tokens.ts';
import Bridge from '../stores/bridge.ts';
import Account from '../stores/account.ts';
import Network from '../stores/network.ts';
import Blocks from '../stores/blocks';

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
    };
    const account = new Account();
    const tokens = new Tokens(account, getBridgeAddress());
    const bridge = new Bridge(account, getBridgeAddress());
    const network = new Network(
      account,
      process.env.NETWORK_ID || DEFAULT_NETWORK
    );

    this.stores = {
      account,
      tokens,
      bridge,
      network,
      blocks: new Blocks(),
    };
  }

  componentDidMount() {
    this.loadData();
  }

  loadData() {
    if (window.web3) {
      const iWeb3 = getWeb3(true);

      setInterval(() => {
        iWeb3.eth.getAccounts().then(accounts => {
          if (this.state.account !== accounts[0]) {
            this.setState({ account: accounts[0] });
            this.stores.account.address = accounts[0]; // eslint-disable-line
          }
        });
      }, 1000);

      iWeb3.eth.getAccounts().then(accounts => {
        this.stores.account.address = accounts[0]; // eslint-disable-line

        this.setState({
          account: accounts && accounts[0],
          ready: true,
        });
      });
    } else {
      this.setState({
        ready: true,
      });
    }
  }

  render() {
    const { ready } = this.state;

    if (!ready) {
      return (
        <Message hideBg>
          <Spin size="large" />
        </Message>
      );
    }

    return <Provider {...this.stores}>{this.props.children}</Provider>;
  }
}

Web3Wrapper.propTypes = {
  children: PropTypes.any,
};
