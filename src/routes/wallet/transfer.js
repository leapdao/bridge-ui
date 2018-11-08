/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React, { Fragment } from 'react';
import { computed } from 'mobx';
import { observer, inject } from 'mobx-react';
import PropTypes from 'prop-types';

import TransferForm from '../../components/transferForm';

@inject('tokens', 'network')
@observer
export default class Transfer extends React.Component {
  @computed
  get selectedToken() {
    const { tokens, color } = this.props;
    return tokens && tokens.tokenForColor(color);
  }

  render() {
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
                : this.selectedToken.toCents(amount)
            )
          }
          disabled={!network || !network.canSubmit}
        />
      </Fragment>
    );
  }
}

Transfer.propTypes = {
  color: PropTypes.number,
  tokens: PropTypes.object,
  network: PropTypes.object,
};
