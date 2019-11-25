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
import { observer } from 'mobx-react';
import { Button, Table, Tooltip } from 'antd';
import { bufferToHex } from 'ethereumjs-util';
import { BigInt } from 'jsbi-utils';

import TokenValue from '../../components/tokenValue';
import FinalizeExitButton from '../../components/finalizeExitButton';
import { shortenHex } from '../../utils';
import { CONFIG } from '../../config';
import { tokensStore } from '../../stores/tokens';
import { unspentsStore } from '../../stores/unspents';

interface ExitProps {
  color: number;
}

@observer
export default class Exit extends React.Component<ExitProps, any> {
  @computed
  private get selectedToken() {
    const { color } = this.props;
    return tokensStore.tokenForColor(color);
  }

  public render() {
    const utxoList = unspentsStore.listForColor(this.selectedToken.color);
    const { pendingFastExits } = unspentsStore;

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
                onClick={() =>
                  unspentsStore.consolidate(this.selectedToken.color)
                }
                style={{ marginLeft: 10 }}
              >
                Consolidate&nbsp;{this.selectedToken.symbol}
              </Button>
            </Fragment>
          )}
        </h2>
        <div className="leap-table">
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
                const utxoId = u.outpoint.hex();
                return {
                  key: utxoId,
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
                  height: u.transaction.blockNumber,
                  exit: !CONFIG.bridgeDisabled && (
                    <Fragment>
                      {u.pendingFastExit && (
                        <Fragment>
                          <Tooltip
                            title={
                              <Fragment>
                                ⚡ Fast exit
                                <br />
                                <br />
                                {!pendingFastExits[utxoId].sig &&
                                  'Signature required'}
                              </Fragment>
                            }
                          >
                            <span>🕐 Exiting</span>
                          </Tooltip>
                          {!pendingFastExits[utxoId].sig && (
                            <Button
                              size="small"
                              style={{ marginLeft: '10px' }}
                              onClick={() => {
                                unspentsStore.signFastExit(u);
                              }}
                            >
                              🔑 Sign
                            </Button>
                          )}
                        </Fragment>
                      )}
                      {!u.pendingFastExit && (
                        <Fragment>
                          <Tooltip
                            title={
                              unspentsStore.periodBlocksRange[0] <=
                              u.transaction.blockNumber
                                ? 'Exit can be started after height ' +
                                  unspentsStore.periodBlocksRange[1]
                                : ''
                            }
                          >
                            <Button
                              size="small"
                              disabled={
                                unspentsStore.periodBlocksRange[0] <=
                                u.transaction.blockNumber
                              }
                              onClick={() => {
                                unspentsStore.exitUnspent(u);
                              }}
                            >
                              🐌Normal
                            </Button>
                          </Tooltip>
                          <Button
                            size="small"
                            style={{ marginLeft: '10px' }}
                            disabled={CONFIG.exitMarketMaker === ''}
                            onClick={() => {
                              unspentsStore.fastExitUnspent(u);
                            }}
                          >
                            ⚡Fast
                          </Button>
                        </Fragment>
                      )}
                    </Fragment>
                  ),
                };
              })}
          />
        </div>

        <FinalizeExitButton token={this.selectedToken} />
      </Fragment>
    );
  }
}
