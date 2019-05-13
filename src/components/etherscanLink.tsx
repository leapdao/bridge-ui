import * as React from 'react';
import { observer } from 'mobx-react';

import { shortenHex } from '../utils';
import { web3RootStore } from '../stores/web3/root';

const { Fragment } = React;

interface EtherscanLinkProps {
  value: string;
}

const EtherscanLink: React.SFC<EtherscanLinkProps> = ({ value }) => {
  if (!value) {
    return <Fragment />;
  }

  const { etherscanBase } = web3RootStore;

  if (!etherscanBase) {
    return <Fragment>{shortenHex(value)}</Fragment>;
  }

  const etherscanLink = ref => {
    if (ref.length === 42) {
      return `${etherscanBase}/address/${ref}`;
    }

    return `${etherscanBase}/tx/${value}`;
  };

  return (
    <a
      href={etherscanLink(value)}
      title={value}
      target="_blank"
      rel="noopener noreferrer"
    >
      {shortenHex(value)}
    </a>
  );
};

export default observer(EtherscanLink);
