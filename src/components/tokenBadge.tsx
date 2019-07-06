import * as React from 'react';
import { observer } from 'mobx-react';
import { Tag } from 'antd';
import { TokenStore } from '../stores/token';

interface TokenBadgeProps {
  token: TokenStore;
}

const tokenDescription = token => {
  if (token.isNst) {
    return {
      label: 'ERC1948',
      description: 'Non-fungible Storage Token',
    };
  }

  if (token.isNft) {
    return {
      label: 'ERC721',
      description: 'Non-fungible Token',
    };
  }

  return {
    label: 'ERC20',
  };
};

const TokenBadge: React.SFC<TokenBadgeProps> = ({ token }) => {
  if (!token || !token.ready) {
    return null;
  }

  const { label, description } = tokenDescription(token);

  return (
    <Tag
      title={description}
      style={{
        border: 0,
        height: 'auto',
        backgroundColor: 'rgba(0,0,0,.05)',
      }}
    >
      {label}
    </Tag>
  );
};

export default observer(TokenBadge);
