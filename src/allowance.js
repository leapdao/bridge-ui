import React from 'react';

import getWeb3 from './getWeb3';
import promisifyWeb3Call from './promisifyWeb3Call';
import { token as tokenAbi } from './abis';
import { bridgeAddress, tokenAddress } from './addrs';

export default class Allowance extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: 0,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();
    const { decimals, account } = this.props;
    const { BigNumber } = getWeb3();
    const value = new BigNumber(this.state.value).mul(decimals);
    const web3 = getWeb3(true);
    const token = web3.eth.contract(tokenAbi).at(tokenAddress);

    promisifyWeb3Call(token.approve.sendTransaction, bridgeAddress, value, {
      from: account,
    }).then(approveTxHash => {
      console.log('approve', approveTxHash); // eslint-disable-line
      this.setState({ value: 0 });
    });
  }

  render() {
    const { symbol, balance, decimals } = this.props;
    const { value } = this.state;
    const bal = Number(balance.div(decimals));

    return (
      <form onSubmit={this.handleSubmit}>
        <h2>Allowance</h2>
        <p>
          To be able to buy a slot you need to set allowance on token contract
          first
        </p>
        <input
          value={value}
          onChange={e => this.setState({ value: Number(e.target.value) })}
        />{' '}
        {symbol}
        <br />
        <button type="submit" disabled={!value || value > bal}>
          Submit
        </button>
      </form>
    );
  }
}
