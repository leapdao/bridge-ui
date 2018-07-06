/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import ethUtil from 'ethereumjs-util';
import { Form, Input, Divider } from 'antd';

import getWeb3 from '../utils/getWeb3';
import promisifyWeb3Call from '../utils/promisifyWeb3Call';
import { bridge as bridgeAbi, token as tokenAbi } from '../utils/abis';
import { bridgeAddress, tokenAddress } from '../utils/addrs';
import Web3SubmitWrapper from '../components/web3SubmitWrapper';
import Web3SubmitWarning from '../components/web3SubmitWarning';
import StakeForm from '../components/stakeForm';

const addrCmp = (a1, a2) =>
  ethUtil.toChecksumAddress(a1) === ethUtil.toChecksumAddress(a2);

const EMPTY_ADDRESS = '0x0000000000000000000000000000000000000000';

const readSlots = (web3, bridge) => {
  return promisifyWeb3Call(bridge.epochLength)
    .then(epochLength => {
      const proms = [];
      for (let slotId = 0; slotId < epochLength; slotId += 1) {
        proms.push(promisifyWeb3Call(bridge.getSlot, slotId));
      }

      return Promise.all(proms);
    })
    .then(slots =>
      slots.map(
        ([
          owner,
          stake,
          signer,
          tendermint,
          activationEpoch,
          newOwner,
          newStake,
          newSigner,
          newTendermint,
        ]) => ({
          owner,
          stake,
          signer,
          tendermint,
          activationEpoch: activationEpoch.toNumber(),
          newOwner,
          newStake,
          newSigner,
          newTendermint,
        })
      )
    );
};

const cellStyle = {
  textAlign: 'left',
  verticalAlign: 'top',
  padding: 10,
  borderRight: '1px solid #ccc',
};

const formCellStyle = Object.assign(
  {
    borderTop: '1px solid #ccc',
  },
  cellStyle
);

export default class Slots extends React.Component {
  constructor(props) {
    super(props);

    const signerAddr = window.localStorage.getItem('signerAddr');
    const tenderPubKey = window.localStorage.getItem('tenderPubKey');
    this.state = {
      slots: [],
      stakes: {},
      signerAddr,
      tenderPubKey,
    };
    this.handleSignerChange = this.handleChange.bind(this, 'signerAddr');
    this.handleTenderPubKeyChange = this.handleChange.bind(
      this,
      'tenderPubKey'
    );
  }

  componentDidMount() {
    this.refreshSlots();
    if (window.web3) {
      // need to use websocket provider for watching events without MetaMask
      const web3 = getWeb3(true);
      const bridge = web3.eth.contract(bridgeAbi).at(bridgeAddress);
      const allEvents = bridge.allEvents({ toBlock: 'latest' });
      allEvents.watch(() => {
        this.refreshSlots();
      });
    }
  }

  setStake(i, stake) {
    this.setState(state => {
      return {
        stakes: Object.assign({}, state.stakes, {
          [i]: isNaN(Number(stake)) ? undefined : stake,
        }),
      };
    });
  }

  refreshSlots() {
    const web3 = getWeb3();
    const bridge = web3.eth.contract(bridgeAbi).at(bridgeAddress);
    readSlots(web3, bridge).then(slots => {
      this.setState({ slots });
    });
  }

  handleChange(key, e) {
    const value = e.target.value.trim();
    window.localStorage.setItem(key, value);
    this.setState({
      [key]: value,
    });
  }

  handleBet(slotId) {
    const { decimals, account } = this.props;
    const { signerAddr, tenderPubKey } = this.state;
    const { BigNumber } = getWeb3();
    const stake = new BigNumber(this.state.stakes[slotId]).mul(decimals);
    const web3 = getWeb3(true);
    const bridge = web3.eth.contract(bridgeAbi).at(bridgeAddress);

    // do approveAndCall to token
    const data = bridge.bet.getData(
      slotId,
      stake,
      signerAddr,
      `0x${tenderPubKey}`,
      account
    );
    const token = web3.eth.contract(tokenAbi).at(tokenAddress);
    promisifyWeb3Call(
      token.approveAndCall.sendTransaction,
      bridgeAddress,
      stake,
      data,
      { from: account }
    ).then(betTxHash => {
      console.log('bet', betTxHash); // eslint-disable-line
      this.setStake(slotId, undefined);
    });
  }

  renderRow(title, key, newKey, renderer) {
    const { slots } = this.state;
    return (
      <tr key={key}>
        <th style={cellStyle}>
          <div style={{ width: 80 }}>{title}</div>
        </th>
        {slots.map((slot, i) => {
          const isFree = slot.owner === EMPTY_ADDRESS;
          const willChange = slot.newSigner !== EMPTY_ADDRESS;
          const currentValuesStyle = {
            display: 'block',
            textDecoration: willChange ? 'line-through' : 'none',
            color: willChange ? '#999' : '#000',
          };

          return (
            <td key={i} style={cellStyle}>
              {!isFree && (
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
    const { slots, signerAddr, stakes, tenderPubKey } = this.state;
    const { decimals, symbol, balance, account, network } = this.props;

    return (
      <table style={{ borderCollapse: 'collapse' }}>
        <thead>
          <tr>
            <th style={cellStyle} />
            {slots.map((slot, i) => (
              <th style={cellStyle} key={i}>
                Slot {i} {account && addrCmp(slot.owner, account) && '(owner)'}
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
          {this.renderRow(
            'Stake',
            'stake',
            'newStake',
            val => `${val.div(decimals).toNumber()} ${symbol}`
          )}
          {this.renderRow('Act. epoch', 'activationEpoch')}
          <tr>
            <th style={formCellStyle} />
            {slots.map((slot, i) => {
              const { BigNumber } = getWeb3();
              const minStake = BigNumber.max(slot.stake, slot.newStake).mul(
                1.05
              );
              const minValue = minStake.div(decimals).toNumber();
              const ownStake = addrCmp(slot.owner, account) ? minValue : 0;

              return (
                <td key={i} style={formCellStyle}>
                  <Web3SubmitWrapper account={account} network={network}>
                    {canSubmitTx =>
                      canSubmitTx && (
                        <StakeForm
                          value={stakes[i]}
                          onChange={value => this.setStake(i, value)}
                          symbol={symbol}
                          disabled={!signerAddr}
                          onSubmit={() => this.handleBet(i)}
                          minValue={minValue}
                          ownStake={ownStake}
                          maxValue={balance && Number(balance.div(decimals))}
                        />
                      )
                    }
                  </Web3SubmitWrapper>
                </td>
              );
            })}
          </tr>
        </tbody>
      </table>
    );
  }

  render() {
    const { signerAddr, tenderPubKey } = this.state;
    const { account, network } = this.props;
    const slotsTable = this.renderSlots();

    return (
      <Fragment>
        <h1>Slots auction</h1>
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

        <Web3SubmitWarning account={account} network={network} />
      </Fragment>
    );
  }
}

Slots.propTypes = {
  decimals: PropTypes.object.isRequired,
  account: PropTypes.string,
  symbol: PropTypes.string.isRequired,
  network: PropTypes.string.isRequired,
  balance: PropTypes.object,
};
