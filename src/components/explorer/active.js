import React from 'react';
import PropTypes from 'prop-types';

import { Alert } from 'antd';

import { observer, inject } from 'mobx-react';

import Block from './block';
import Address from './address';
import Transaction from './transaction';

const Active = inject('explorer')(
  observer(({ explorer }) => {
    const branch = {
      BLOCK: <Block />,
      TRANSACTION: <Transaction />,
      ADDRESS: <Address />,
    };
    const error = 'No results found for your search.';
    const init = 'Syncing state with node, this may take some time...';

    return (
      <div>
        {!explorer.success && <Alert type="error" message={error} />}
        {!explorer.initialSync ? (
          branch[explorer.currentType]
        ) : (
          <Alert type="info" message={init} />
        )}
      </div>
    );
  })
);

Active.propTypes = {
  explorer: PropTypes.any,
};

export default Active;
