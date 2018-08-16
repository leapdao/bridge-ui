import React from 'react';
import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';

const Searchable = ({ text }) => {
  /* eslint-disable */
  return <Link to={`/explorer/${text}`}>{text}</Link>;
  /* eslint-enable */
};

Searchable.propTypes = {
  text: PropTypes.any,
};

export default Searchable;
