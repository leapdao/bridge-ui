import React from 'react';
import PropTypes from 'prop-types';
import getWeb3 from '../utils/getWeb3';

class Web3SubmitWrapper extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
    if (window.web3) {
      getWeb3(true)
        .eth.net.getId()
        .then(mmNetwork => {
          this.setState({ mmNetwork: String(mmNetwork) });
        });
    }
  }

  render() {
    const { account, network, children } = this.props;
    const { mmNetwork } = this.state;
    const canSubmit = !!window.web3 && !!account && network === mmNetwork;

    return children(canSubmit);
  }
}

Web3SubmitWrapper.propTypes = {
  account: PropTypes.string,
  network: PropTypes.string.isRequired,
  children: PropTypes.func.isRequired,
};

export default Web3SubmitWrapper;
