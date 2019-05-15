import * as React from 'react';
import { colorFromAddr } from '../utils';

interface ColorBadgeProps {
  address: string;
}

const ColorBadge: React.FC<ColorBadgeProps> = ({ address }) => {
  return (
    <span
      style={{
        backgroundColor: colorFromAddr(address, 80, 50),
        width: 10,
        height: 10,
        display: 'inline-block',
        borderRadius: '50%',
        marginLeft: 5,
      }}
    />
  );
};

export default ColorBadge;
