/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { Fragment } from 'react';
import { Link } from 'react-router-dom';
import { computed } from 'mobx';
import { observer, inject } from 'mobx-react';
import { Button, Table } from 'antd';
import { bufferToHex } from 'ethereumjs-util';

import TokenValue from '../../components/tokenValue';
import { shortenHex } from '../../utils';
import { BigInt } from 'jsbi-utils';
import Tokens from '../../stores/tokens';
import Unspents from '../../stores/unspents';
import ExitHandler from '../../stores/exitHandler';

interface ExitProps {
  tokens?: Tokens;
  unspents?: Unspents;
  exitHandler?: ExitHandler;
  color: number;
}

@inject('tokens', 'exitHandler', 'network', 'unspents')
@observer
export default class Exit extends React.Component<ExitProps, any> {
  @computed
  private get selectedToken() {
    const { tokens, color } = this.props;
    return tokens.tokenForColor(color);
  }

  public render() {
    const { unspents, exitHandler } = this.props;

    const utxoList =
      unspents && unspents.listForColor(this.selectedToken.color);

    if (!utxoList) {
      return null;
    }

    return (
      <Fragment>
        <h2 style={{ alignItems: 'center', display: 'flex' }}>
          Unspents ({this.selectedToken.symbol})
          {utxoList.length > 1 && (
            <Fragment>
              {' '}
              <Button
                size="small"
                onClick={() => unspents.consolidate(this.selectedToken.color)}
                style={{ marginLeft: 10 }}
              >
                Consolidate {this.selectedToken.symbol}
              </Button>
            </Fragment>
          )}
        </h2>
        <Table
          style={{ marginTop: 15 }}
          columns={[
            { title: 'Value', dataIndex: 'value', key: 'value' },
            { title: 'Input', dataIndex: 'input', key: 'input' },
            { title: 'Height', dataIndex: 'height', key: 'height' },
            { title: 'Exit', dataIndex: 'exit', key: 'exit' },
          ]}
          dataSource={utxoList
            .sort(
              (a, b) => b.transaction.blockNumber - a.transaction.blockNumber
            )
            .map(u => {
              const inputHash = bufferToHex(u.outpoint.hash);
              return {
                key: u.outpoint.hex(),
                value: <TokenValue { ...{ color: u.output.color, value: BigInt(u.output.value) } } />,
                input: (
                  <Fragment>
                    <Link to={`/explorer/tx/${inputHash}`}>
                      {shortenHex(inputHash)}
                    </Link>{' '}
                    ({u.outpoint.index})
                  </Fragment>
                ),
                height: u.transaction.blockNumber,
                exit: (
                  <Fragment>
                    {unspents.periodBlocksRange[0] >
                      u.transaction.blockNumber && (
                      <Button
                        size="small"
                        onClick={() => unspents.exitUnspent(u)}
                      >
                        Exit
                      </Button>
                    )}
                    {unspents.periodBlocksRange[0] <=
                      u.transaction.blockNumber && (
                      <span>
                        Wait until height {unspents.periodBlocksRange[1]}
                      </span>
                    )}
                  </Fragment>
                ),
              };
            })}
        />

        <Button onClick={() => exitHandler.finalizeExits(this.selectedToken.color)}>
          Finalize {this.selectedToken.symbol} top exit
        </Button>
      </Fragment>
    );
  }
}
