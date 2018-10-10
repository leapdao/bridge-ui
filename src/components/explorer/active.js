import React from 'react';
import PropTypes from 'prop-types';

import { observer, inject } from 'mobx-react';

import { Types } from '../../stores/explorer.ts';

import Block from './block';
import Address from './address';
import Transaction from './transaction';

const Active = ({ explorer }) => {
  const branch = {
    [Types.BLOCK]: <Block />,
    [Types.TRANSACTION]: <Transaction />,
    [Types.ADDRESS]: <Address />,
  };

  return branch[explorer.currentType] || null;
};

Active.propTypes = {
  explorer: PropTypes.any,
};

export default inject('explorer')(observer(Active));
