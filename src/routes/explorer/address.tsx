import * as React from 'react';
import { bufferToHex } from 'ethereumjs-util';
import { Link } from 'react-router-dom';
import { match } from 'react-router';
import { Fragment } from 'react';
import { observable, reaction } from 'mobx';
import { inject, observer } from 'mobx-react';
import { Card, Alert, Spin, Table } from 'antd';

import TokenValue from '../../components/tokenValue';
import Explorer, { ExplorerAccount } from '../../stores/explorer';
import Tokens from '../../stores/tokens';
import TransactionList from './txList';
import { BigInt } from 'jsbi-utils';
import { shortenHex } from '../../utils';

interface AddressRouteProps {
  explorer: Explorer;
  tokens: Tokens;
  match: match<{
    addr: string;
  }>;
}

@inject('explorer', 'tokens')
@observer
class Address extends React.Component<AddressRouteProps, any> {
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

  public componentWillReceiveProps(nextProps) {
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

  @observable.shallow
  private account: ExplorerAccount = null;
  @observable
  private fetching = false;
  @observable
  private success = false;

  private fetch(address) {
    const { explorer } = this.props;
    this.fetching = true;

    explorer.getAddress(address).then(account => {
      this.fetching = false;
      this.success = !!account;
      this.account = account;
    });
  }

  public render() {
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
            <h3>Balances</h3>
            <ul>
              {Object.entries(this.account.balances).map(([color, value]) => (
                <li key={color} style={{ listStyle: 'none' }}>
                  <TokenValue color={Number(color)} value={value} tokenLink />
                </li>
              ))}
            </ul>
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
        {this.account.token && (
          <TransactionList color={String(this.account.token.color)} />
        )}
        {!this.account.token && (
          <TransactionList
            from={this.account.address}
            to={this.account.address}
          />
        )}
        {!this.account.token && (
          <Fragment>
            <h3>Unspents</h3>
            <Table
              style={{ marginTop: 15 }}
              columns={[
                { title: 'Value', dataIndex: 'value', key: 'value' },
                { title: 'Input', dataIndex: 'input', key: 'input' },
              ]}
              dataSource={this.account.unspents.map(u => {
                const inputHash = bufferToHex(u.outpoint.hash);
                return {
                  key: u.outpoint.hex(),
                  value: (
                    <TokenValue
                      {...{
                        color: u.output.color,
                        value: BigInt(u.output.value),
                      }}
                    />
                  ),
                  input: (
                    <Fragment>
                      <Link to={`/explorer/tx/${inputHash}`}>
                        {shortenHex(inputHash)}
                      </Link>{' '}
                      ({u.outpoint.index})
                    </Fragment>
                  ),
                };
              })}
            />
          </Fragment>
        )}
      </Card>
    );
  }
}

export default Address;
