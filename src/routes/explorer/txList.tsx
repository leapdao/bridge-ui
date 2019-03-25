// https://b1cdbjhcsi.execute-api.eu-west-1.amazonaws.com/v0/transactions?from=0xc254CAA1d116a2CF7a906f12CcC602CD93ca8C8d

import * as React from 'react';
import { Button } from 'antd';
import { Tx } from 'leap-core';
import TransactionListComponent from '../../components/transactionList';
import { CONFIG } from '../../config';

type Props = {
  from?: string;
  to?: string;
  color?: string;
};

class TransactionList extends React.Component<Props> {
  public state: {
    txs: any[];
    nextToken?: string;
  };
  constructor(props) {
    super(props);
    this.state = {
      txs: [],
      nextToken: undefined,
    };
  }

  componentDidMount() {
    this.fetchStuff(this.props);
  }

  componentDidUpdate(prevProps: Props) {
    if (
      prevProps.from !== this.props.from ||
      prevProps.to !== this.props.to ||
      prevProps.color !== this.props.color
    ) {
      this.setState({
        txs: [],
      });
      this.fetchStuff(this.props);
    }
  }

  fetchStuff({ from, to, color }: Props) {
    if (!CONFIG.txStorage) {
      return;
    }

    const qs = [
      from && `from=${from}`,
      to && `to=${to}`,
      color && `color=${color}`,
    ]
      .filter(a => a)
      .join('&');
    const url = `${CONFIG.txStorage}/transactions?${qs}`;
    fetch(url)
      .then(r => r.json())
      .then(response => {
        this.setState({
          txs: response.transactions.map(tx => ({
            ...tx,
            ...Tx.fromRaw(tx.raw),
          })),
          nextToken: response.nextToken,
        });
      });
  }

  render() {
    return (
      <>
        <TransactionListComponent txs={this.state.txs} />
        {this.state.nextToken && <Button>Load more</Button>}
      </>
    );
  }
}

export default TransactionList;
