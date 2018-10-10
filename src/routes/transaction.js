import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { observable } from 'mobx';
import { inject, observer } from 'mobx-react';
import { Type } from 'parsec-lib';
import { Card, List, Alert, Spin } from 'antd';
import { Link } from 'react-router-dom';

import TokenValue from '../components/tokenValue';
import { swapObject } from '../utils';

const TYPES = swapObject(Type);

const InputItem = observer(({ input }) => {
  return (
    <List.Item>
      <Link to={`/explorer/tx/${input.hash}`}>{input.hash}</Link>: {input.index}
    </List.Item>
  );
});

@inject('explorer')
@observer
class Transaction extends React.Component {
  constructor(props) {
    super(props);
    this.fetch(props.match.params.hash);
  }

  componentWillReceiveProps(nextProps) {
    const {
      match: {
        params: { hash: param },
      },
    } = this.props;
    const {
      match: {
        params: { hash: nextParam },
      },
    } = nextProps;

    if (param !== nextParam) {
      this.fetch(nextParam);
    }
  }

  @observable
  tx = null;
  @observable
  fetching = false;
  @observable
  success = false;

  fetch(hash) {
    const { explorer } = this.props;
    this.fetching = true;

    explorer.getTransaction(hash).then(tx => {
      this.fetching = false;
      this.success = !!tx;
      this.tx = tx;
    });
  }

  render() {
    if (!this.success && !this.fetching) {
      return (
        <Alert
          type="error"
          message={`Transaction ${this.props.match.params.hash} not found`}
        />
      );
    }

    if (!this.tx || this.fetching) {
      return <Spin />;
    }

    return (
      <Card title="Transaction" className="explorer-section">
        <h3>Hash:</h3>
        {this.tx.hash}
        <h3>Block:</h3>
        <Link to={`/explorer/block/${this.tx.blockHash}`}>
          {this.tx.blockHash}
        </Link>
        <h3>ID in block:</h3>
        {this.tx.transactionIndex}
        {this.tx.from && (
          <Fragment>
            <h3>From:</h3>
            <Link to={`/explorer/address/${this.tx.from}`}>{this.tx.from}</Link>
          </Fragment>
        )}
        {this.tx.to && (
          <Fragment>
            <h3>To:</h3>
            <Link to={`/explorer/address/${this.tx.to}`}>{this.tx.to}</Link>
          </Fragment>
        )}
        <h3>Value:</h3>
        {this.tx.outputs && this.tx.outputs[0] ? (
          <TokenValue value={this.tx.value} color={this.tx.outputs[0].color} />
        ) : (
          this.tx.value
        )}
        <h3>Type:</h3>
        {TYPES[this.tx.type]}
        <h3>Inputs:</h3>
        <List
          itemLayout="vertical"
          dataSource={this.tx.inputs}
          renderItem={input => <InputItem input={input} />}
        />
        <h3>Outputs:</h3>
        <List
          itemLayout="vertical"
          dataSource={this.tx.outputs}
          renderItem={output => (
            <List.Item>
              Address:{' '}
              <Link to={`/explorer/address/${output.address}`}>
                {output.address}
              </Link>
              <br />
              Color: {output.color}
              <br />
              Value: <TokenValue {...output} />
            </List.Item>
          )}
        />
      </Card>
    );
  }
}

Transaction.propTypes = {
  match: PropTypes.object,
  explorer: PropTypes.object,
};

export default Transaction;
