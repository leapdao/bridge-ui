import React from 'react';
import PropTypes from 'prop-types';

import { Alert } from 'antd';

import { observer, inject } from 'mobx-react';

import Block from './block';
import Address from './address';
import Transaction from './transaction';

const Active = ({ explorer }) => {
  const branch = {
    BLOCK: <Block />,
    TRANSACTION: <Transaction />,
    ADDRESS: <Address />,
  };

  return (
    <div>
      {!explorer.success && (
        <Alert type="error" message="No results found for your search." />
      )}
      {!explorer.initialSync ? (
        branch[explorer.currentType]
      ) : (
        <Alert
          type="info"
          message="Syncing state with node, this may take some time..."
        />
      )}
    </div>
  );
};

Active.propTypes = {
  explorer: PropTypes.any,
};

export default inject('explorer')(observer(Active));
