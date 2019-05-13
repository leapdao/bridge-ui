import * as React from 'react';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react';
import { BigIntType } from 'jsbi-utils';
import { tokensStore } from '../stores/tokens';

interface TokenValueProps {
  value: BigIntType | BigIntType[];
  color: number;
  tokenLink?: boolean;
}

const TokenValue: React.SFC<TokenValueProps> = ({
  value,
  color,
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
        : token.toTokens(value as BigIntType).toString()}{' '}
      {!tokenLink && token.symbol}
      {tokenLink && (
        <Link to={`/explorer/address/${token.address}`}>{token.symbol}</Link>
      )}
    </React.Fragment>
  );
};

export default observer(TokenValue);
