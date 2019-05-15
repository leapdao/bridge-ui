import * as React from 'react';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react';
import { BigIntType } from 'jsbi-utils';
import { tokensStore } from '../stores/tokens';

interface TokenValueProps {
  value: BigIntType | BigIntType[];
  color: number;
  precision?: number;
  tokenLink?: boolean;
}

const round = (n: number, precision?: number) => {
  if (precision === undefined) {
    return n;
  }
  const dec = 10 ** precision;
  return Math.round(n * dec) / dec;
};

const TokenValue: React.FC<TokenValueProps> = ({
  value,
  color,
  precision,
  tokenLink,
}) => {
  const token = tokensStore.tokenForColor(color);

  if (!token || !token.ready || value === undefined) {
    return null;
  }

  return (
    <React.Fragment>
      {token.isNft
        ? (value as BigIntType[]).length
        : round(token.toTokens(value as BigIntType), precision)}{' '}
      {!tokenLink && token.symbol}
      {tokenLink && (
        <Link to={`/explorer/address/${token.address}`}>{token.symbol}</Link>
      )}
    </React.Fragment>
  );
};

export default observer(TokenValue);
