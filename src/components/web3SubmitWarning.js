import React from 'react';
import { inject } from 'mobx-react';
import PropTypes from 'prop-types';
import { Alert } from 'antd';
import { NETWORKS } from '../utils';

@inject(stores => ({
  network: stores.network,
  account: stores.account,
}))
class Web3SubmitWarning extends React.Component {
  render() {
    const { network, account } = this.props;

    if (!window.web3) {
      return (
        <Alert
          type="warning"
          style={{ marginBottom: 10 }}
          message="To be able to send transactions you need to install MetaMask"
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
};

export default Web3SubmitWarning;
