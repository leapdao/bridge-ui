import React from 'react';
import Slots from './slots'; // eslint-disable-line
import Allowance from './allowance'; // eslint-disable-line
import Deposit from './deposit'; // eslint-disable-line
import promisifyWeb3Call from './promisifyWeb3Call';
import getWeb3 from './getWeb3';
import { token as tokenAbi, bridge as bridgeAbi } from './abis';
import { tokenAddress, bridgeAddress } from './addrs';

export default class App extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      balance: null,
      allowance: null,
    };
  }

  componentDidMount() {
    // const web3 = getWeb3();
    this.token = getWeb3(true)
      .eth.contract(tokenAbi)
      .at(tokenAddress);
    this.bridge = getWeb3(true)
      .eth.contract(bridgeAbi)
      .at(bridgeAddress);

    this.loadData();

    const bridgeEvents = this.bridge.allEvents({ toBlock: 'latest' });
    bridgeEvents.watch(() => {
      this.loadData();
    });

    const approvalEvents = this.token.Approval({ toBlock: 'latest' });
    approvalEvents.watch((err, e) => {
      if (e.args.owner === this.props.account) {
        this.loadData();
      }
    });
  }

  loadData() {
    const { account } = this.props;
    Promise.all([
      promisifyWeb3Call(this.token.balanceOf, account),
      promisifyWeb3Call(this.token.allowance, account, bridgeAddress),
      promisifyWeb3Call(this.bridge.lastCompleteEpoch),
    ]).then(([balance, allowance, lastCompleteEpoch]) => {
      this.setState({ balance, allowance, lastCompleteEpoch });
    });
  }

  render() {
    const { balance, lastCompleteEpoch, allowance } = this.state;
    const { decimals, symbol } = this.props;
    if (!balance || !allowance) {
      return null;
    }
    return (
      <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 15 }}>
        <p>
          Balance: {Number(balance.div(decimals))} {symbol}
        </p>
        <p>Last complete epoch: {Number(lastCompleteEpoch)}</p>
        <hr />
        <Deposit {...this.props} balance={balance} allowance={allowance} />
        <hr />
        <Slots {...this.props} balance={balance} allowance={allowance} />
      </div>
    );
  }
}
