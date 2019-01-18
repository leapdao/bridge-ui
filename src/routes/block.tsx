import * as React from 'react';
import { observable, reaction } from 'mobx';
import { inject, observer } from 'mobx-react';
import { Card, Button, Alert, Spin } from 'antd';
import { Link } from 'react-router-dom';

import TransctionList from '../components/transactionList';
import NodeStore from '../stores/node';
import Web3Store from '../stores/web3/';
import Explorer from '../stores/explorer';
import { match } from 'react-router';

const dateFormat = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: false,
});

interface BlockRouteProps {
  node: NodeStore;
  web3: Web3Store;
  explorer: Explorer;
  match: match<{
    hashOrNumber: string;
  }>;
}

@inject('explorer', 'node', 'web3')
@observer
class Block extends React.Component<BlockRouteProps, any> {
  constructor(props) {
    super(props);
    this.fetch(props.match.params.hashOrNumber);

    reaction(
      () => this.props.node.latestBlock,
      () => {
        if (!props.match.params.hashOrNumber) {
          this.fetch();
        }
      }
    );
  }

  componentWillReceiveProps(nextProps) {
    const {
      match: {
        params: { hashOrNumber: param },
      },
    } = this.props;
    const {
      match: {
        params: { hashOrNumber: nextParam },
      },
    } = nextProps;

    if (param !== nextParam) {
      this.fetch(nextParam);
    }
  }

  @observable
  block = null;
  @observable
  fetching = false;
  @observable
  success = false;

  fetch(hashOrNumber?: string | number) {
    const { explorer, web3 } = this.props;
    this.fetching = true;

    (hashOrNumber
      ? Promise.resolve(hashOrNumber)
      : web3.plasma.instance.eth.getBlockNumber()
    ).then(param => {
      explorer.getBlock(param).then(block => {
        this.fetching = false;
        this.success = !!block;
        this.block = block;
      });
    });
  }

  render() {
    const { node } = this.props;

    if (!this.success && !this.fetching) {
      return <Alert type="error" message="Block not found" />;
    }

    if (!this.block || this.fetching) {
      return <Spin />;
    }

    return (
      <Card title={`Block ${this.block.number}`} className="explorer-section">
        <div className="explorer-nav">
          {this.block.number > 0 && (
            <Button>
              <Link to={`/explorer/block/${this.block.number - 1}`}>Prev</Link>
            </Button>
          )}
          {this.block.number < node.latestBlock && (
            <Button>
              <Link to={`/explorer/block/${this.block.number + 1}`}>Next</Link>
            </Button>
          )}
        </div>
        <h3>Hash:</h3>
        {this.block.hash}
        <h3>Timestamp:</h3>
        {dateFormat.format(this.block.timestamp * 1000)}
        <h3>Transactions:</h3>
        <TransctionList txs={this.block.transactions} />
      </Card>
    );
  }
}

export default Block;
