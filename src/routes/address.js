import React from 'react';
import PropTypes from 'prop-types';
import { observable } from 'mobx';
import { inject, observer } from 'mobx-react';
import { Card, Alert, Spin } from 'antd';

import TransctionList from '../components/transactionList';
import TokenValue from '../components/tokenValue';

@inject('explorer')
@observer
class Address extends React.Component {
  constructor(props) {
    super(props);
    this.fetch(props.match.params.addr);
  }

  componentWillReceiveProps(nextProps) {
    const {
      match: {
        params: { addr: param },
      },
    } = this.props;
    const {
      match: {
        params: { addr: nextParam },
      },
    } = nextProps;

    if (param !== nextParam) {
      this.fetch(nextParam);
    }
  }

  @observable
  addr = null;
  @observable
  fetching = false;
  @observable
  success = false;

  fetch(addr) {
    const { explorer } = this.props;
    this.fetching = true;

    explorer.getAddress(addr).then(tx => {
      this.fetching = false;
      this.success = !!tx;
      this.addr = tx;
    });
  }

  render() {
    if (!this.success && !this.fetching) {
      return (
        <Alert
          type="error"
          message={`Address ${this.props.match.params.addr} not found`}
        />
      );
    }

    if (!this.addr || this.fetching) {
      return <Spin />;
    }

    return (
      <Card title={`Address ${this.addr.address}`}>
        <h3> Balance: </h3>
        <TokenValue value={this.addr.balance} color={0} />
        <h3> Transactions: </h3>
        <TransctionList txs={this.addr.txs} />
      </Card>
    );
  }
}

Address.propTypes = {
  match: PropTypes.object,
  explorer: PropTypes.object,
};

export default Address;
