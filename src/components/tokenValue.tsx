import * as React from 'react';
import { Fragment } from 'react';
import { inject, observer } from 'mobx-react';
import Tokens from '../stores/tokens';

interface TokenValueProps {
  value: number | string | string[];
  color: number;
  tokens?: Tokens;
}

const TokenValue: React.SFC<TokenValueProps> = ({ value, color, tokens }) => {
  const token = tokens && tokens.tokenForColor(color);

  if (!token || !token.ready || value === undefined) {
    return null;
  }

  return (
    <Fragment>
      {Array.isArray(value) ? value.length : token.toTokens(Number(value))}{' '}
      {token.symbol}
    </Fragment>
  );
};

export default inject('tokens')(observer(TokenValue));
