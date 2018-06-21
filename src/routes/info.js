/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { bridgeAddress, tokenAddress } from '../utils/addrs';
import { NETWORKS } from '../utils';

const Info = ({ network }) => {
  return (
    <Fragment>
      <h1>Chain info</h1>
      <dl className="info">
        <dt>Network</dt>
        <dd>{NETWORKS[network].name || network}</dd>
        <dt>Bridge contract address</dt>
        <dd>{bridgeAddress}</dd>
        <dt>Token contract address</dt>
        <dd>{tokenAddress}</dd>
      </dl>
    </Fragment>
  );
};

export default Info;

Info.propTypes = {
  network: PropTypes.string.isRequired,
};
