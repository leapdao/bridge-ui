/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Form, Input, Button, Divider, Alert } from 'antd';

import requestApi from '../api';

const URL = 'https://sarrsmlpsg.execute-api.eu-west-1.amazonaws.com/v0';
const api = requestApi(URL);

const requestFund = tweetUrl => api('post', 'tweetFund', { tweetUrl });

export default class Faucet extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
      sending: false,
      error: null,
      success: null,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();
    this.setState({ sending: true });
    requestFund(this.state.value)
      .then(() => {
        this.setState({
          value: '',
          sending: false,
          success: 'Cool! Wait a minute, we are sending tokens to you',
        });
      })
      .catch(err => {
        this.setState({ sending: false, error: err.message });
      });
  }

  render() {
    const { account } = this.props;
    const { value, sending, error, success } = this.state;
    const tweetText = `Requesting faucet funds into ${account} on the @Parsec_Labs test network.`;

    return (
      <Fragment>
        <h1>Get tokens</h1>
        <Form onSubmit={this.handleSubmit} layout="inline">
          {success && <Alert type="success" message={success} />}
          {error && <Alert type="error" message={error} />}
          {(success || error) && <Divider />}

          <Form.Item>
            <Input
              addonBefore="Tweet url"
              value={value}
              style={{ width: 400 }}
              onChange={e =>
                this.setState({
                  value: e.target.value,
                  success: null,
                  error: null,
                })
              }
            />
          </Form.Item>

          <Form.Item>
            <Button htmlType="submit" type="primary" loading={sending}>
              Request tokens
            </Button>
          </Form.Item>
          <Divider />
          <Button
            href={`https://twitter.com/intent/tweet?text=${tweetText}`}
            target="_blank"
            className="twitter-share-button"
          >
            Make a tweet
          </Button>
        </Form>
      </Fragment>
    );
  }
}

Faucet.propTypes = {
  account: PropTypes.string.isRequired,
};
