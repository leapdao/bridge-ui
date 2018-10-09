import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { inject, observer } from 'mobx-react';

const TokenValue = ({ value, color, tokens }) => {
  const token = tokens && tokens.tokenForColor(color);

  if (!token || !token.ready) {
    return null;
  }

  return (
    <Fragment>
      {token.toTokens(value)} {token.symbol}
    </Fragment>
  );
};

TokenValue.propTypes = {
  value: PropTypes.oneOfType([PropTypes.number, PropTypes.string]).isRequired,
  color: PropTypes.number.isRequired,
  tokens: PropTypes.object,
};

export default inject('tokens')(observer(TokenValue));
