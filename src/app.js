import React from 'react';
import Slots from './slots'; // eslint-disable-line
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
    };
  }

  componentDidMount() {
    const web3 = getWeb3();
    this.token = web3.eth.contract(tokenAbi).at(tokenAddress);
    this.bridge = getWeb3(true)
      .eth.contract(bridgeAbi)
      .at(bridgeAddress);

    this.loadData();
    const allEvents = this.bridge.allEvents({ toBlock: 'latest' });
    allEvents.watch(() => {
      this.loadData();
    });
  }

  loadData() {
    const { account } = this.props;
    Promise.all([
      promisifyWeb3Call(this.token.balanceOf, account),
      promisifyWeb3Call(this.bridge.lastCompleteEpoch),
    ]).then(([balance, lastCompleteEpoch]) => {
      this.setState({ balance, lastCompleteEpoch });
    });
  }

  render() {
    const { balance, lastCompleteEpoch } = this.state;
    const { decimals, symbol } = this.props;
    if (!balance) {
      return null;
    }
    return (
      <div style={{ fontFamily: 'Helvetica, Arial, sans-serif', fontSize: 15 }}>
        <p>
          Balance: {Number(balance.div(decimals))} {symbol}
        </p>
        <p>Last complete epoch: {Number(lastCompleteEpoch)}</p>
        <hr />
        <Deposit {...this.props} balance={balance} />
        <hr />
        <Slots {...this.props} balance={balance} />
      </div>
    );
  }
}
