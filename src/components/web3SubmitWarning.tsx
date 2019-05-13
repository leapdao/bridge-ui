import * as React from 'react';
import { Fragment } from 'react';
import { observer } from 'mobx-react';
import { Alert, Button } from 'antd';
import { web3InjectedStore } from '../stores/web3/injected';
import { networkStore } from '../stores/network';
import { web3RootStore } from '../stores/web3/root';
import { accountStore } from '../stores/account';

interface Web3SubmitWarningProps {}

@observer
class Web3SubmitWarning extends React.Component<Web3SubmitWarningProps, any> {
  public render() {
    if (!web3InjectedStore.available) {
      return (
        <Alert
          type="warning"
          style={{ marginBottom: 10 }}
          message="To be able to send transactions you need to install MetaMask"
        />
      );
    }

    if (!web3InjectedStore.instance) {
      return (
        <Alert
          type="warning"
          style={{ marginBottom: 10 }}
          message={
            <Fragment>
              To be able to send transactions you need to{' '}
              <Button onClick={() => web3InjectedStore.enable()}>
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

    if (networkStore.wrongNetwork) {
      return (
        <Alert
          type="warning"
          style={{ marginBottom: 10 }}
          message={`To be able to send transactions you need to switch MetaMask to ${
            web3RootStore.name
          }`}
        />
      );
    }

    if (!accountStore.address) {
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
