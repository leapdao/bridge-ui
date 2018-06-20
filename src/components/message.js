import React from 'react';
import PropTypes from 'prop-types';
import { Layout, Card } from 'antd';

const Message = ({ children, hideBg = false }) => {
  return (
    <Layout>
      <Layout.Content
        style={{
          display: 'flex',
          backgroundColor: '#efefef',
          minHeight: '100vh',
          justifyContent: 'center',
          alignItems: 'center',
        }}
      >
        {!hideBg && (
          <Card
            bodyStyle={{
              fontSize: 21,
              lineHeight: '24px',
              maxWidth: 500,
              textAlign: 'center',
            }}
          >
            {children}
          </Card>
        )}
        {hideBg && children}
      </Layout.Content>
    </Layout>
  );
};

Message.propTypes = {
  children: PropTypes.any,
  hideBg: PropTypes.bool,
};

export default Message;
