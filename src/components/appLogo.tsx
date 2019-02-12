import * as React from 'react';
import { CONFIG } from '../config';

const leapLogo = require('../leaplogo.svg');

const AppLogo = () => {
  return (
    <div
      style={{
        whiteSpace: 'nowrap',
        color: 'rgba(0,0,0,.65)',
        marginRight: 10,
        position: 'relative',
      }}
    >
      <img
        src={leapLogo}
        width="50"
        height="50"
        className="logo"
        style={{
          flexShrink: 0,
          position: 'absolute',
          left: '50%',
          top: '50%',
          marginLeft: -25,
          marginTop: -25,
        }}
        alt=""
      />
      <div
        style={{
          display: 'inline-flex',
          flexDirection: 'column',
          color: '#000',
          textAlign: 'center',
          lineHeight: 1,
        }}
      >
        <span
          style={{
            fontFamily: 'ChivoLogo',
            fontSize: 16,
            position: 'relative',
            zIndex: 1,
          }}
        >
          LeapDAO
        </span>
        <span
          style={{
            lineHeight: '1rem',
            fontSize: 13,
            position: 'relative',
            zIndex: 1,
          }}
        >
          {CONFIG.name}
        </span>
      </div>
    </div>
  );
};

export default AppLogo;
