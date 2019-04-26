import * as React from 'react';
const { Fragment } = React;

interface HexStringProps {
  copyString: string;
}

function copyToClipboard(text: string) {
  const textArea = document.createElement('textarea');
  textArea.value = text;
  document.body.appendChild(textArea);
  textArea.select();
  const result = document.execCommand('copy');
  document.body.removeChild(textArea);
  return result;
}

const CopyToClipboard: React.FC<
  HexStringProps & React.HTMLProps<HTMLSpanElement>
> = ({ children, copyString, ...props }) => {
  const [copied, setCopied] = React.useState(false);
  const handleCopy = React.useCallback(() => {
    if (copyToClipboard(copyString)) {
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

  return (
    <Fragment>
      {copied && <span className="copied-msg">Copied</span>}
      <span {...props} onClick={handleCopy}>
        {children}
      </span>
    </Fragment>
  );
};

export default CopyToClipboard;
