/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React, { Fragment } from 'react';
import { observable, action } from 'mobx';
import { observer, inject } from 'mobx-react';
import PropTypes from 'prop-types';
import { Form, Input, Button, Divider, Alert } from 'antd';
import autobind from 'autobind-decorator';
import AppLayout from '../components/appLayout';

import requestApi from '../utils/api';

const URL = 'https://sarrsmlpsg.execute-api.eu-west-1.amazonaws.com/v0';
const api = requestApi(URL);

const requestFund = tweetUrl => api('post', 'tweetFund', { tweetUrl });

@inject(stores => ({
  account: stores.account,
}))
@observer
export default class Faucet extends React.Component {
  @observable
  value = '';
  @observable
  sending = false;
  @observable
  error = null;
  @observable
  success = null;

  @autobind
  @action
  handleSuccess() {
    this.value = '';
    this.sending = false;
    this.success = 'Cool! Wait a minute, we are sending tokens to you';
  }

  @autobind
  @action
  handleError(err) {
    this.sending = false;
    this.error = err.message;
  }

  @autobind
  @action
  handleChange(e) {
    this.value = e.target.value;
    this.success = null;
    this.error = null;
  }

  @autobind
  @action
  handleSubmit(e) {
    e.preventDefault();
    this.sending = true;
    requestFund(this.value)
      .then(this.handleSuccess)
      .catch(this.handleError);
  }

  render() {
    const { account } = this.props;

    return (
      <AppLayout>
        <h1>Get tokens</h1>
        <Form onSubmit={this.handleSubmit} layout="inline">
          {this.success && <Alert type="success" message={this.success} />}
          {this.error && <Alert type="error" message={this.error} />}
          {(this.success || this.error) && <Divider />}

          <Form.Item>
            <Input
              addonBefore="Tweet url"
              value={this.value}
              style={{ width: 400 }}
              onChange={this.handleChange}
            />
          </Form.Item>

          <Form.Item>
            <Button htmlType="submit" type="primary" loading={this.sending}>
              Request tokens
            </Button>
          </Form.Item>
          {account.address && (
            <Fragment>
              <Divider />
              <Button
                href={`https://twitter.com/intent/tweet?text=${`Requesting faucet funds into ${
                  account.address
                } on the @leapdao test network.`}`}
                target="_blank"
                className="twitter-share-button"
              >
                Make a tweet
              </Button>
            </Fragment>
          )}
        </Form>
      </AppLayout>
    );
  }
}

Faucet.propTypes = {
  account: PropTypes.object,
};
