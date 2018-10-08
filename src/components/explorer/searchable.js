import React from 'react';
import PropTypes from 'prop-types';

import { Link } from 'react-router-dom';

const Searchable = ({ text, title }) => {
  /* eslint-disable */
  return <Link to={`/explorer/${text}`}>{title || text}</Link>;
  /* eslint-enable */
};

Searchable.propTypes = {
  text: PropTypes.any,
  title: PropTypes.any,
};

export default Searchable;
