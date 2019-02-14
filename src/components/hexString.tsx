import * as React from 'react';
import MediaQuery from 'react-responsive';

import { shortenHex } from '../utils';

const { Fragment } = React;

interface HexStringProps {}

function copyToClipboard(text: string) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  const result = document.execCommand('copy');
  document.body.removeChild(textArea);
  return result;
}

const HexString: React.SFC<HexStringProps> = ({ children }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = React.useCallback(() => {
    if (copyToClipboard(String(children))) {
      setCopied(true);
    }
  }, [children]);

  React.useEffect(() => {
    if (copied) {
      const timeout = setTimeout(() => {
        setCopied(false);
      }, 400);

      return () => {
        clearTimeout(timeout);
      };
    }
  }, [copied]);

  const width = String(children).length < 60 ? 450 : 600;

  return (
    <Fragment>
      {copied && <span className="copied-msg">Copied</span>}
      <MediaQuery minWidth={width}>{children}</MediaQuery>
      <MediaQuery maxWidth={width - 1}>
        <span title={String(children)} onClick={handleCopy}>
          {shortenHex(children)}
        </span>
      </MediaQuery>
    </Fragment>
  );
};

export default HexString;
