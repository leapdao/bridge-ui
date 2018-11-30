/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { Fragment } from 'react';
import { observable } from 'mobx';
import { observer, inject } from 'mobx-react';
import * as ethUtil from 'ethereumjs-util';
import { Form, Input, Divider } from 'antd';

import Web3SubmitWarning from '../components/web3SubmitWarning';
import StakeForm from '../components/stakeForm';
import TokenValue from '../components/tokenValue';
import AppLayout from '../components/appLayout';
import Bridge from '../stores/bridge';
import Account from '../stores/account';
import Network from '../stores/network';
import { match } from 'react-router';
import Tokens from '../stores/tokens';

const addrCmp = (a1, a2) =>
  ethUtil.toChecksumAddress(a1) === ethUtil.toChecksumAddress(a2);

const cellStyle = {
  textAlign: 'left',
  verticalAlign: 'top',
  padding: 10,
  borderRight: '1px solid #ccc',
} as any;

const formCellStyle = Object.assign(
  {
    borderTop: '1px solid #ccc',
  },
  cellStyle
) as any;

const thCellStyle = Object.assign(
  {
    whiteSpace: 'nowrap',
  },
  cellStyle
) as any;

interface SlotsProps {
  bridge: Bridge;
  account: Account;
  network: Network;
  tokens: Tokens;
  match: match<{ bridgeAddr: string }>;
}

@inject('tokens', 'bridge', 'account', 'network')
@observer
export default class Slots extends React.Component<SlotsProps, any> {
  @observable
  private stakes = {};

  @observable
  private signerAddr = window.localStorage.getItem('signerAddr');

  @observable
  private tenderPubKey = window.localStorage.getItem('tenderPubKey');

  private get psc() {
    return this.props.tokens.list && this.props.tokens.list[0];
  }

  private setStake(i, stake) {
    this.stakes[i] = isNaN(Number(stake)) ? undefined : stake;
  }

  private handleChange(key, e) {
    const value = e.target.value.trim();
    window.localStorage.setItem(key, value);
    this[key] = value;
  }

  private handleSignerChange(e: React.ChangeEvent) {
    this.handleChange('signerAddr', e);
  }

  private handleTenderPubKeyChange(e: React.ChangeEvent) {
    this.handleChange('tenderPubKey', e);
  }

  private handleBet(slotId) {
    const { bridge } = this.props;
    const { signerAddr, tenderPubKey } = this;
    const stake = this.psc.toCents(this.stakes[slotId]);

    bridge
      .bet(this.psc, slotId, stake, signerAddr, tenderPubKey)
      .then(({ futureReceipt }) => {
        futureReceipt.once('transactionHash', betTxHash => {
          console.log('bet', betTxHash); // eslint-disable-line
          this.setStake(slotId, undefined);
        });
      });
  }

  renderRow(
    title: string,
    key: string,
    newKey?: string,
    renderer?: (value: any) => any
  ) {
    const { bridge } = this.props;
    return (
      <tr key={key}>
        <th style={cellStyle}>
          <div style={{ width: 80 }}>{title}</div>
        </th>
        {bridge.slots.map((slot, i) => {
          const willChange = slot.willChange && newKey;
          const currentValuesStyle = {
            display: 'block',
            textDecoration: willChange ? 'line-through' : 'none',
            color: willChange ? '#999' : '#000',
          };

          return (
            <td key={i} style={cellStyle}>
              {!slot.isFree && (
                <Fragment>
                  <span style={currentValuesStyle}>
                    {renderer ? renderer(slot[key]) : slot[key]}
                  </span>
                  {willChange &&
                    (renderer ? renderer(slot[newKey]) : slot[newKey])}
                </Fragment>
              )}
            </td>
          );
        })}
      </tr>
    );
  }

  renderSlots() {
    const { signerAddr, stakes, tenderPubKey } = this;
    const { account, network, bridge } = this.props;

    return (
      <table style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={thCellStyle} />
            {bridge.slots.map((slot, i) => (
              <th style={thCellStyle} key={i}>
                Slot {i}{' '}
                {account.address &&
                  addrCmp(slot.owner, account.address) &&
                  '(owner)'}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {this.renderRow('Owner', 'owner', 'newOwner')}
          {this.renderRow('Validator addr', 'signer', 'newSigner', val => (
            <span
              style={{
                backgroundColor:
                  signerAddr && addrCmp(val, signerAddr)
                    ? '#ff0'
                    : 'transparent',
              }}
            >
              {val}
            </span>
          ))}
          {this.renderRow(
            'Validator ID',
            'tendermint',
            'newTendermint',
            val => {
              const key = val.replace('0x', '').toUpperCase();
              return (
                <span
                  style={{
                    backgroundColor:
                      tenderPubKey && tenderPubKey.toUpperCase() === key
                        ? '#ff0'
                        : 'transparent',
                  }}
                >
                  {key}
                </span>
              );
            }
          )}
          {this.renderRow('Stake', 'stake', 'newStake', val => (
            <TokenValue value={val} color={0} />
          ))}
          {this.renderRow('Act. epoch', 'activationEpoch')}
          {this.psc && this.psc.ready && (
            <tr>
              <th style={formCellStyle} />
              {bridge.slots.map((slot, i) => {
                const minStake = Math.max(slot.stake, slot.newStake) * 1.05;
                const minValue = this.psc.toTokens(minStake);
                const ownStake = addrCmp(slot.owner, account.address || '')
                  ? minValue
                  : 0;

                return (
                  <td key={i} style={formCellStyle}>
                    {network && network.canSubmit && (
                      <StakeForm
                        value={stakes[i]}
                        onChange={value => this.setStake(i, value)}
                        symbol={this.psc.symbol}
                        disabled={!signerAddr}
                        onSubmit={() => this.handleBet(i)}
                        minValue={minValue}
                        ownStake={ownStake}
                        maxValue={this.psc.decimalsBalance}
                      />
                    )}
                  </td>
                );
              })}
            </tr>
          )}
        </tbody>
      </table>
    );
  }

  render() {
    const { signerAddr, tenderPubKey } = this;
    const { bridge, match } = this.props;

    const slotsTable = this.renderSlots();

    return (
      <AppLayout section="slots" bridgeAddr={match.params.bridgeAddr}>
        <h1>Slots auction</h1>

        <Web3SubmitWarning />
        <Form layout="inline">
          <Form.Item>
            <Input
              addonBefore="Validator address"
              value={signerAddr}
              onChange={this.handleSignerChange}
              style={{ width: 500 }}
            />
          </Form.Item>
          <Form.Item>
            <Input
              addonBefore="Validator ID"
              value={tenderPubKey}
              onChange={this.handleTenderPubKeyChange}
              style={{ width: 620 }}
            />
          </Form.Item>
        </Form>
        <Divider />
        {bridge.lastCompleteEpoch !== undefined && (
          <Fragment>
            <p>
              <strong>Last complete epoch:</strong> {bridge.lastCompleteEpoch}
            </p>
            <Divider />
          </Fragment>
        )}

        <div style={{ position: 'relative' }}>
          <div
            style={{
              position: 'absolute',
              backgroundColor: '#FFF',
              height: 'calc(100% - 20px)',
              width: 101,
              overflow: 'hidden',
              zIndex: 1,
            }}
          >
            {slotsTable}
          </div>
          <div
            style={{
              width: '100%',
              overflowX: 'auto',
              paddingBottom: 20,
            }}
          >
            {slotsTable}
          </div>
        </div>
      </AppLayout>
    );
  }
}
