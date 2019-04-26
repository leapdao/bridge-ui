import * as React from 'react';
import MediaQuery from 'react-responsive';
import CopyToClipboard from '../components/copyToClipboard';
import { shortenHex } from '../utils';

const { Fragment } = React;

interface HexStringProps {}

const HexString: React.SFC<HexStringProps> = ({ children }) => {
  const width = String(children).length < 60 ? 450 : 600;

  return (
    <Fragment>
      <MediaQuery minWidth={width}>{children}</MediaQuery>
      <MediaQuery maxWidth={width - 1}>
        <CopyToClipboard copyString={String(children)} title={String(children)}>
          {shortenHex(children)}
        </CopyToClipboard>
      </MediaQuery>
    </Fragment>
  );
};

export default HexString;
