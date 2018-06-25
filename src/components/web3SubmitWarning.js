import React from 'react';
import PropTypes from 'prop-types';
import { Alert } from 'antd';
import { NETWORKS } from '../utils';
import getWeb3 from '../utils/getWeb3';
import promisifyWeb3Call from '../utils/promisifyWeb3Call';

class Web3SubmitWarning extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    if (window.web3) {
      promisifyWeb3Call(getWeb3(true).version.getNetwork).then(mmNetwork => {
        this.setState({ mmNetwork });
      });
    }
  }

  render() {
    const { account, network } = this.props;
    const { mmNetwork } = this.state;
    if (!window.web3) {
      return (
        <Alert
          type="warning"
          style={{ marginBottom: 10 }}
          message="To be able to send transactions you need to install MetaMask"
        />
      );
    }

    if (mmNetwork && network !== mmNetwork) {
      return (
        <Alert
          type="warning"
          style={{ marginBottom: 10 }}
          message={`To be able to send transactions you need to switch MetaMask to ${
            NETWORKS[network].name
          }`}
        />
      );
    }

    if (!account) {
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
  account: PropTypes.string,
  network: PropTypes.string.isRequired,
};

export default Web3SubmitWarning;
