import * as React from 'react';
import { Fragment } from 'react';
import { inject, observer } from 'mobx-react';
import Tokens from '../stores/tokens';
import { BigIntType, isBigInt } from 'jsbi-utils';

interface TokenValueProps {
  value: BigIntType | BigIntType[];
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
      {token.isNft ? (value as BigIntType[]).length : token.toTokens(value as BigIntType).toString()}{' '}
      {token.symbol}
    </Fragment>
  );
};

export default inject('tokens')(observer(TokenValue));
