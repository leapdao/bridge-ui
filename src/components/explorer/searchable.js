import React from 'react';
import PropTypes from 'prop-types';

import { inject } from 'mobx-react';

const Searchable = ({ explorer, text }) => {
  /* eslint-disable */
  return <a onClick={() => explorer.search(text)}>{text}</a>;
  /* eslint-enable */
};

Searchable.propTypes = {
  explorer: PropTypes.any,
  text: PropTypes.any,
};

export default inject('explorer')(Searchable);
