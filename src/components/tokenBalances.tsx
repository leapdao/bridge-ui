import * as React from 'react';
import TokenValue from './tokenValue';
import { tokensStore } from '../stores/tokens';

type TokenBalancesProps = {
  color: number;
};

const TokenBalances: React.FC<TokenBalancesProps> = ({ color }) => {
  const token = tokensStore.tokenForColor(color);
  if (!token) {
    return null;
  }

  return (
    <>
      <span
        style={{
          position: 'relative',
          marginRight: 10,
          fontWeight: 'normal',
          display: 'inline-flex',
          flexDirection: 'column',
        }}
      >
        <TokenValue value={token.balance} color={token.color} precision={3} />
        <span
          style={{
            fontSize: 12,
            fontWeight: 'normal',
            opacity: 0.4,
            marginTop: -5,
          }}
        >
          Ethereum
        </span>
      </span>
      <span
        style={{
          position: 'relative',
          marginRight: 10,
          fontWeight: 'normal',
          display: 'inline-flex',
          flexDirection: 'column',
        }}
      >
        <TokenValue
          value={token.plasmaBalance}
          color={token.color}
          precision={3}
        />
        <span
          style={{
            fontSize: 12,
            fontWeight: 'normal',
            opacity: 0.4,
            marginTop: -5,
          }}
        >
          Plasma
        </span>
      </span>
    </>
  );
};

export default TokenBalances;
