import * as React from 'react';
import { CONFIG } from '../config';

const leapLogo = require('../leaplogo.svg');


const AppLogo = () => {
  return (
    <div style={{
      whiteSpace: 'nowrap',
      color: 'rgba(0,0,0,.65)',
      marginRight: '10px',
    }}>
      <img	
        src={leapLogo}	
        width="50"	
        height="50"	
        className="logo"	
        style={{ 
          marginRight: '10px',
          flexShrink: 0,
        }}
        alt=""	
      />
      <div style={{ 
        display: 'inline-flex',
        flexDirection: 'column',
        lineHeight: '64px',
      }}>
        <span style={{ fontFamily: 'ChivoLogo', lineHeight: '0.5rem' }}>
          LeapDAO
        </span>
        <span style={{ 
          lineHeight: '1rem',
          fontSize: '0.7rem',
          textAlign: 'right',
        }}>
          {CONFIG.name}
        </span>
      </div>
    </div>
  );
};

export default AppLogo;
