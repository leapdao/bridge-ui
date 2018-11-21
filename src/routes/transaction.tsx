import * as React from 'react';
import { Fragment } from 'react';
import { observable } from 'mobx';
import { inject, observer } from 'mobx-react';
import { Type } from 'leap-core';
import { Card, List, Alert, Spin } from 'antd';
import { match } from 'react-router';
import { Link } from 'react-router-dom';

import TokenValue from '../components/tokenValue';
import { swapObject } from '../utils';
import Explorer from '../stores/explorer';

const TYPES = swapObject(Type);

interface MatchParams {
  hash: string;
}

interface TransactionRouteProps {
  explorer: Explorer;
  match: match<MatchParams>;
}

const InputItem = observer(({ input }) => {
  return (
    <List.Item>
      <Link to={`/explorer/tx/${input.hash}`}>{input.hash}</Link>: {input.index}
    </List.Item>
  );
});

@inject('explorer')
@observer
class Transaction extends React.Component<TransactionRouteProps, any> {
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
        <h3>Hash</h3>
        {this.tx.hash}
        <h3>Block</h3>
        <Link to={`/explorer/block/${this.tx.blockHash}`}>
          {this.tx.blockHash}
        </Link>
        <h3>ID in block</h3>
        {this.tx.transactionIndex}
        {this.tx.from && (
          <Fragment>
            <h3>From</h3>
            <Link to={`/explorer/address/${this.tx.from}`}>{this.tx.from}</Link>
          </Fragment>
        )}
        {this.tx.to && (
          <Fragment>
            <h3>To</h3>
            <Link to={`/explorer/address/${this.tx.to}`}>{this.tx.to}</Link>
          </Fragment>
        )}
        <h3>Value</h3>
        <TokenValue value={this.tx.value} color={this.tx.color} />
        <h3>Type</h3>
        {TYPES[this.tx.type]}
        {this.tx.inputs && this.tx.inputs.length > 0 && (
          <Fragment>
            <h3>Inputs</h3>
            <List
              itemLayout="vertical"
              dataSource={this.tx.inputs}
              renderItem={input => <InputItem input={input} />}
            />
          </Fragment>
        )}
        {this.tx.outputs && this.tx.outputs.length > 0 && (
          <Fragment>
            <h3>Outputs</h3>
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
          </Fragment>
        )}
        {this.tx.options && (
          <Fragment>
            <h3>Options:</h3>
            <pre>{JSON.stringify(this.tx.options, null, 2)}</pre>
          </Fragment>
        )}
      </Card>
    );
  }
}

export default Transaction;
