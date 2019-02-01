import * as React from 'react';
import { inject, observer } from 'mobx-react';

import { shortenHex } from '../utils';
import Network from '../stores/network';

const { Fragment } = React;

interface EtherscanLinkProps {
  value: string;
  network?: Network;
}

const EtherscanLink: React.SFC<EtherscanLinkProps> = ({ value, network }) => {
  if (!value) return (<Fragment/>);
  
  const { etherscanBase } = network;
  
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
