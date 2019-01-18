import * as React from 'react';
import { Fragment } from 'react';
import { inject, observer } from 'mobx-react';
import { Alert, Button } from 'antd';
import Network from '../stores/network';
import Web3Store from '../stores/web3/';
import Account from '../stores/account';

interface Web3SubmitWarningProps {
  network?: Network;
  account?: Account;
  web3?: Web3Store;
}

@inject('network', 'account', 'web3')
@observer
class Web3SubmitWarning extends React.Component<Web3SubmitWarningProps, any> {
  render() {
    const { network, account, web3 } = this.props;

    if (!web3.injected.available) {
      return (
        <Alert
          type="warning"
          style={{ marginBottom: 10 }}
          message="To be able to send transactions you need to install MetaMask"
        />
      );
    }

    if (!web3.injected.instance) {
      return (
        <Alert
          type="warning"
          style={{ marginBottom: 10 }}
          message={
            <Fragment>
              To be able to send transactions you need to{' '}
              <Button onClick={() => web3.injected.enable()}>
                connect MetaMask{' '}
                <span role="img" aria-label="fox">
                  🦊
                </span>
              </Button>
            </Fragment>
          }
        />
      );
    }

    if (network.wrongNetwork) {
      return (
        <Alert
          type="warning"
          style={{ marginBottom: 10 }}
          message={`To be able to send transactions you need to switch MetaMask to ${
            network.name
          }`}
        />
      );
    }

    if (!account.address) {
      return (
        <Alert
          style={{ marginBottom: 10 }}
          type="warning"
          message="To be able to send transactions you need to unlock MetaMask account"
        />
      );
    }

    return null;
  }
}

export default Web3SubmitWarning;
