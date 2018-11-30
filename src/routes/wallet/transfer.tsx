/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { Fragment } from 'react';
import { computed } from 'mobx';
import { observer, inject } from 'mobx-react';

import TransferForm from '../../components/transferForm';
import Tokens from '../../stores/tokens';
import Network from '../../stores/network';

interface TransferProps {
  tokens?: Tokens;
  network?: Network;
  color: number;
}

@inject('tokens', 'network')
@observer
export default class Transfer extends React.Component<TransferProps, any> {
  @computed
  private get selectedToken() {
    const { tokens, color } = this.props;
    return tokens && tokens.tokenForColor(color);
  }

  public render() {
    const { network } = this.props;

    return (
      <Fragment>
        <h2>Transfer tokens</h2>
        <TransferForm
          color={this.selectedToken.color}
          onSubmit={(addr, amount) =>
            this.selectedToken.transfer(
              addr,
              this.selectedToken.isNft
                ? amount
                : this.selectedToken.toCents(Number(amount))
            )
          }
          disabled={!network || !network.canSubmit}
        />
      </Fragment>
    );
  }
}
