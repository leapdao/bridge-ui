import * as React from 'react';
import { inject, observer } from 'mobx-react';

import { shortenHex } from '../utils';
import Web3Store from '../stores/web3';

const { Fragment } = React;

interface EtherscanLinkProps {
  value: string;
  web3?: Web3Store;
}

const EtherscanLink: React.SFC<EtherscanLinkProps> = ({ value, web3 }) => {
  if (!value) return (<Fragment/>);
  
  const { etherscanBase } = web3.root;
  
  if (!etherscanBase) {
    return (
      <Fragment>
        {shortenHex(value)}
      </Fragment>
    )
  }

  const etherscanLink = (ref) => {
    if (ref.length == 42) return `${etherscanBase}/address/${ref}`;

    return `${etherscanBase}/tx/${value}`;
  }

  return (
    <a href={etherscanLink(value)} title={value} target="_blank" rel="noopener noreferrer">
      {shortenHex(value)}
    </a>
  );
};

export default inject('network')(observer(EtherscanLink));
