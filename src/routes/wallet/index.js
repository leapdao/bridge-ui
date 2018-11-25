/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React from 'react';
import { observable, computed } from 'mobx';
import { observer, inject } from 'mobx-react';
import PropTypes from 'prop-types';

import Web3SubmitWarning from '../../components/web3SubmitWarning';

import Deposit from './deposit';
import Transfer from './transfer';
import Exit from './exit';
import AppLayout from '../../components/appLayout';

@inject('tokens', 'bridge')
@observer
export default class Wallet extends React.Component {
  @computed
  get selectedToken() {
    const { tokens } = this.props;
    return tokens && tokens.tokenForColor(this.color);
  }

  @observable
  color = 0;

  render() {
    const { tokens } = this.props;

    if (!tokens.ready) {
      return null;
    }

    if (tokens.list.length === 0) {
      return (
        <div style={{ textAlign: 'center', margin: 50, fontSize: 18 }}>
          You need to register some token first
        </div>
      );
    }

    if (!this.selectedToken || !this.selectedToken.ready) {
      return null;
    }

    return (
      <AppLayout section="wallet">
        <Web3SubmitWarning />

        <Deposit
          color={this.color}
          onColorChange={color => {
            this.color = color;
          }}
        />

        <Transfer color={this.color} />

        <Exit color={this.color} />
      </AppLayout>
    );
  }
}

Wallet.propTypes = {
  tokens: PropTypes.object,
};
