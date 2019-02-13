/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { Fragment } from 'react';
import { observable, action } from 'mobx';
import { observer, inject } from 'mobx-react';
import { Form, Input, Button, Divider, Alert } from 'antd';
import autobind from 'autobind-decorator';
import AppLayout from '../components/appLayout';

import requestApi from '../utils/api';
import Account from '../stores/account';
import { CONFIG } from '../config';

const api = requestApi(CONFIG.denverFaucet);

const requestFund = address => api('post', '', { address });

interface FaucetProps {
  account: Account;
}

@inject('account')
@observer
export default class Faucet extends React.Component<FaucetProps, any> {
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
  handleSuccess(data) {
    this.sending = false;
    if (data.errorMessage) {
      this.error = data.errorMessage;
      return;
    }
    this.value = '';
    this.error = '';
    this.success =
      'Cool! You should receive your tokens already. Now go to the Wallet and play around.';
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
    requestFund(this.props.account.address)
      .then(this.handleSuccess)
      .catch(this.handleError);
  }

  render() {
    const { account } = this.props;

    if (!CONFIG.denverFaucet) {
      return (
        <AppLayout section="faucet">
          <span>Faucet is not set up</span>
        </AppLayout>
      );
    }

    return (
      <AppLayout section="faucet">
        <h1>Welcome to ETHDenver 2019!</h1>
        <p>
          Get some tokens to test Plasma here!
        </p>
        <Form onSubmit={this.handleSubmit} layout="inline">
          {this.success && <Alert type="success" message={this.success} />}
          {this.error && <Alert type="error" message={this.error} />}
          {(this.success || this.error) && <Divider />}

          {account.address && (
            <Button htmlType="submit" type="primary" loading={this.sending}>
              Request tokens
            </Button>
          )}
        </Form>
      </AppLayout>
    );
  }
}
