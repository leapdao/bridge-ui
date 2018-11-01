import React, { Fragment } from 'react';
import { inject, observer } from 'mobx-react';
import PropTypes from 'prop-types';
import { Alert, Button } from 'antd';
import { NETWORKS } from '../utils';

@inject('network', 'account', 'web3')
@observer
class Web3SubmitWarning extends React.Component {
  render() {
    const { network, account, web3 } = this.props;

    if (!web3.injectedAvailable) {
      return (
        <Alert
          type="warning"
          style={{ marginBottom: 10 }}
          message="To be able to send transactions you need to install MetaMask"
        />
      );
    }

    if (!web3.injected) {
      return (
        <Alert
          type="warning"
          style={{ marginBottom: 10 }}
          message={
            <Fragment>
              To be able to send transactions you need to{' '}
              <Button onClick={() => web3.enable()}>
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

    if (network.mmNetwork && network.network !== network.mmNetwork) {
      return (
        <Alert
          type="warning"
          style={{ marginBottom: 10 }}
          message={`To be able to send transactions you need to switch MetaMask to ${
            NETWORKS[network.network].name
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

Web3SubmitWarning.propTypes = {
  network: PropTypes.object,
  account: PropTypes.object,
  web3: PropTypes.object,
};

export default Web3SubmitWarning;
