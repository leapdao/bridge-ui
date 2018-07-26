/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React, { Fragment } from 'react';
import { observer, inject } from 'mobx-react';
import PropTypes from 'prop-types';
import { NETWORKS } from '../utils';

const Info = ({ network, bridge, psc }) => {
  return (
    <Fragment>
      <h1>Chain info</h1>
      <dl className="info">
        <dt>Network</dt>
        <dd>{NETWORKS[network.network].name || network.network}</dd>
        <dt>Bridge contract address</dt>
        <dd>{bridge.address}</dd>
        {psc && (
          <Fragment>
            <dt>Token contract address</dt>
            <dd>{psc.address}</dd>
          </Fragment>
        )}
      </dl>
    </Fragment>
  );
};

export default inject(stores => ({
  psc: stores.tokens.list && stores.tokens.list[0],
  network: stores.network,
  bridge: stores.bridge,
}))(observer(Info));

Info.propTypes = {
  network: PropTypes.object,
  psc: PropTypes.object,
  bridge: PropTypes.object,
};
