import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { observable, reaction } from 'mobx';
import { inject, observer } from 'mobx-react';
import { Card, Alert, Spin } from 'antd';

import TransctionList from '../components/transactionList';
import TokenValue from '../components/tokenValue';

@inject('explorer', 'tokens')
@observer
class Address extends React.Component {
  constructor(props) {
    super(props);
    if (props.tokens.ready) {
      this.fetch(props.match.params.addr);
    } else {
      reaction(
        () => props.tokens.ready,
        () => {
          this.fetch(props.match.params.addr);
        }
      );
    }
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
  account = null;
  @observable
  fetching = false;
  @observable
  success = false;

  fetch(address) {
    const { explorer } = this.props;
    this.fetching = true;

    explorer.getAddress(address).then(account => {
      this.fetching = false;
      this.success = !!account;
      this.account = account;
    });
  }

  render() {
    if (!this.success && !this.fetching && this.props.tokens.ready) {
      return (
        <Alert
          type="error"
          message={`Address ${this.props.match.params.addr} not found`}
        />
      );
    }

    if (!this.account || this.fetching || !this.props.tokens.ready) {
      return <Spin />;
    }

    return (
      <Card title={`Address ${this.account.address}`}>
        {!this.account.token && (
          <Fragment>
            <h3>Balance</h3>
            <TokenValue value={this.account.balance} color={0} />
          </Fragment>
        )}
        {this.account.token && (
          <Fragment>
            <h3>Token</h3>
            <dl className="info">
              <dt>Name</dt>
              <dd>{this.account.token.name}</dd>
              <dt>Symbol</dt>
              <dd>{this.account.token.symbol}</dd>
              <dt>Decimals</dt>
              <dd>{this.account.token.decimals}</dd>
            </dl>
          </Fragment>
        )}
        <h3>Transactions</h3>
        <TransctionList txs={this.account.txs} />
      </Card>
    );
  }
}

Address.propTypes = {
  match: PropTypes.object,
  explorer: PropTypes.object,
  tokens: PropTypes.object,
};

export default Address;
