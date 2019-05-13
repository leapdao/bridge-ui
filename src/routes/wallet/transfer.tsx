/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { Fragment } from 'react';
import { computed } from 'mobx';
import { observer } from 'mobx-react';

import TransferForm from '../../components/transferForm';

import { bi } from 'jsbi-utils';
import { tokensStore } from '../../stores/tokens';
import { networkStore } from '../../stores/network';

interface TransferProps {
  color: number;
}

@observer
export default class Transfer extends React.Component<TransferProps, any> {
  @computed
  private get selectedToken() {
    const { color } = this.props;
    return tokensStore.tokenForColor(color);
  }

  public render() {
    return (
      <Fragment>
        <h2>Transfer tokens</h2>
        <TransferForm
          color={this.selectedToken.color}
          onSubmit={(addr, amount) =>
            this.selectedToken
              .transfer(
                addr,
                this.selectedToken.isNft
                  ? bi(amount)
                  : this.selectedToken.toCents(amount)
              )
              .then(a => a.futureReceipt)
          }
          disabled={!networkStore.canSubmit}
        />
      </Fragment>
    );
  }
}
