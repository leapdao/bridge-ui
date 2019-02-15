import * as React from 'react';
import { inject } from 'mobx-react';

import { Button } from 'antd';
import Web3Store from '../stores/web3';

interface ConnectWeb3Props {
  onClick: () => void;
  web3?: Web3Store;
}

const ConnectWeb3: React.SFC<ConnectWeb3Props> = ({ onClick }) => {
  const { ethereum } = window as any;
  if (ethereum.isStatus) {
    return (<Button onClick={onClick}>Connect Status</Button>);
  }

  return (
    <Button onClick={onClick}>
      <span
        role="img"
        aria-label="fox"
        style={{ bottom: -1, position: 'relative' }}
      >
        🦊
      </span>{' '}
      Connect MetaMask
    </Button>
  );
};

export default inject("web3")(ConnectWeb3);
