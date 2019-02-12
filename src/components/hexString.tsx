import * as React from 'react';

import { shortenHex } from '../utils';

const { Fragment } = React;

interface HexStringProps {}

const HexString: React.SFC<HexStringProps> = ({ children }) => {
  return (
    <Fragment>
      <span className="leap-hex-full">{children}</span>
      <span className="leap-hex-short" title={children as string}>
        {shortenHex(children)}
      </span>
    </Fragment>
  );
};

export default HexString;
