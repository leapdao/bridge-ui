import * as React from 'react';
import { Link } from 'react-router-dom';
import { inject, observer } from 'mobx-react';
import Tokens from '../stores/tokens';
import { BigIntType } from 'jsbi-utils';

interface TokenValueProps {
  value: BigIntType | BigIntType[];
  color: number;
  tokenLink?: boolean;
  tokens?: Tokens;
}

const TokenValue: React.SFC<TokenValueProps> = ({
  value,
  color,
  tokens,
  tokenLink,
}) => {
  const token = tokens && tokens.tokenForColor(color);

  if (!token || !token.ready || value === undefined) {
    return null;
  }

  return (
    <React.Fragment>
      {token.isNft
        ? (value as BigIntType[]).length
        : token.toTokens(value as BigIntType).toString()}{' '}
      {!tokenLink && token.symbol}
      {tokenLink && (
        <Link to={`/explorer/address/${token.address}`}>{token.symbol}</Link>
      )}
    </React.Fragment>
  );
};

export default inject('tokens')(observer(TokenValue));
