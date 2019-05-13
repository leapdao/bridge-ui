import * as React from 'react';
import { observable, reaction } from 'mobx';
import { observer } from 'mobx-react';
import { Card, Button, Alert, Spin } from 'antd';
import { Link } from 'react-router-dom';

import TransactionList from '../../components/transactionList';
import { match } from 'react-router';
import HexString from '../../components/hexString';
import { nodeStore } from '../../stores/node';
import { web3PlasmaStore } from '../../stores/web3/plasma';
import { explorerStore } from '../../stores/explorer';

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
  match: match<{
    hashOrNumber: string;
  }>;
}

@observer
class Block extends React.Component<BlockRouteProps, any> {
  constructor(props: BlockRouteProps) {
    super(props);
    this.fetch(props.match.params.hashOrNumber);

    reaction(
      () => nodeStore.latestBlock,
      () => {
        if (!props.match.params.hashOrNumber) {
          this.fetch();
        }
      }
    );
  }

  public componentWillReceiveProps(nextProps) {
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
  private block = null;
  @observable
  private fetching = false;
  @observable
  private success = false;

  private fetch(hashOrNumber?: string | number) {
    this.fetching = true;

    (hashOrNumber
      ? Promise.resolve(hashOrNumber)
      : web3PlasmaStore.instance.eth.getBlockNumber()
    ).then(param => {
      explorerStore.getBlock(param).then(block => {
        this.fetching = false;
        this.success = !!block;
        this.block = block;
      });
    });
  }

  public render() {
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
          {this.block.number < nodeStore.latestBlock && (
            <Button>
              <Link to={`/explorer/block/${this.block.number + 1}`}>Next</Link>
            </Button>
          )}
        </div>
        <h3>Hash:</h3>
        <HexString>{this.block.hash}</HexString>
        <h3>Timestamp:</h3>
        {dateFormat.format(this.block.timestamp * 1000)}
        <h3>Transactions:</h3>
        <TransactionList txs={this.block.transactions} />
      </Card>
    );
  }
}

export default Block;
