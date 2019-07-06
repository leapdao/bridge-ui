import * as React from 'react';
import { Link } from 'react-router-dom';
import { observer } from 'mobx-react';
import { BigIntType, isBigInt } from 'jsbi-utils';
import { tokensStore } from '../stores/tokens';

interface TokenValueProps {
  value: BigIntType | BigIntType[];
  color: number;
  tokenLink?: boolean;
}

const nftValue = (value: BigIntType | BigIntType[]) => {
  if (isBigInt(value)) {
    return value.toString();
  } else {
    return (value as BigIntType[]).length;
  }
};

const maybeSymbol = (token, value: BigIntType | BigIntType[]): string => {
  // do not return symbol if showing NFT token id
  if (token.isNft && isBigInt(value)) {
    return;
  }

  // showing ERC20 value or NFT balance
  return token.symbol;
};

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
        ? nftValue(value)
        : token.toTokens(value as BigIntType).toString()}{' '}
      {!tokenLink && maybeSymbol(token, value)}
      {tokenLink && (
        <Link to={`/explorer/address/${token.address}`}>{token.symbol}</Link>
      )}
    </React.Fragment>
  );
};

export default observer(TokenValue);
