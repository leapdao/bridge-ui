import * as React from 'react';
import MediaQuery from 'react-responsive';

import { shortenHex } from '../utils';

const { Fragment } = React;

interface HexStringProps {}

const HexString: React.SFC<HexStringProps> = ({ children }) => {
  const width = String(children).length < 60 ? 450 : 600;
  return (
    <Fragment>
      <MediaQuery minWidth={width}>{children}</MediaQuery>
      <MediaQuery maxWidth={width - 1}>
        <span title={String(children)}>{shortenHex(children)}</span>
      </MediaQuery>
    </Fragment>
  );
};

export default HexString;
