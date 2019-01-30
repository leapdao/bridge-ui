import * as React from 'react';
import { Fragment } from 'react';
import { isValidAddress } from 'ethereumjs-util';
import { observable } from 'mobx';
import { observer, inject } from 'mobx-react';
import { Input, Button, Form } from 'antd';
import autobind from 'autobind-decorator';
import AmountInput from './amountInput';
import Tokens from '../stores/tokens';
import { BigIntType, lessThanOrEqual, greaterThan, biMax, ZERO } from 'jsbi-utils';

interface TransferFormProps {
  tokens?: Tokens;
  color: number;
  disabled: boolean;
  onSubmit: (address: string, value: string | number) => Promise<any>;
}

@inject('tokens')
@observer
class TransferForm extends React.Component<TransferFormProps, any> {
  public get token() {
    const { tokens, color } = this.props;
    return tokens && tokens.tokenForColor(color);
  }

  get valueError() {
    if (!this.value) {
      return 'Required';
    }

    if (!this.token.isNft) {
      const maxValue = this.token.plasmaBalance;
      if (maxValue && greaterThan(this.token.toCents(this.value), maxValue as BigIntType)) {
        return `Should <= ${this.token.toTokens(maxValue as BigIntType)}`;
      }
    }

    return undefined;
  }

  get receiverError() {
    if (String(this.receiver || '').trim().length === 0) {
      return 'Required';
    }

    if (!isValidAddress(this.receiver)) {
      return 'Invalid address';
    }

    return undefined;
  }

  get disabled() {
    return this.props.disabled || this.submitting;
  }

  @observable
  value = this.token.isNft ? '' : 0;

  @observable
  receiver = '';

  @observable
  submitting = false;

  @observable
  showErrors = false;

  @autobind
  handleSubmit(e) {
    e.preventDefault();
    const { onSubmit } = this.props;

    if (this.valueError || this.receiverError) {
      this.showErrors = true;
    } else if (onSubmit) {
      this.submitting = true;
      Promise.resolve(onSubmit(this.receiver, this.value)).then(
        () => {
          this.value = '';
          this.receiver = '';
          this.submitting = false;
          this.showErrors = false;
        },
        () => {
          this.submitting = false;
        }
      );
    }
  }

  @autobind
  handleChange(value) {
    this.value = value;
  }

  @autobind
  handleReceiverChange(e) {
    this.receiver = e.target.value;
  }

  render() {
    const { color, tokens } = this.props;

    if (!tokens) {
      return null;
    }

    if (!this.token || !this.token.ready) {
      return null;
    }

    return (
      <Form onSubmit={this.handleSubmit} className="transferForm">
        <AmountInput
          plasma
          width={450}
          color={color}
          onChange={this.handleChange}
          value={this.value}
          placeholder="Amount to transfer"
        />
        {this.showErrors && this.valueError && (
          <Fragment>
            <br />
            <span style={{ color: 'red' }}>{this.valueError}</span>
          </Fragment>
        )}
        <Form.Item>
          <Input
            value={this.receiver}
            style={{ width: 450, font: 'inherit' }}
            onChange={this.handleReceiverChange}
            placeholder="Receiver address"
          />
          {this.showErrors && this.receiverError && (
            <Fragment>
              <br />
              <span style={{ color: 'red' }}>{this.receiverError}</span>
            </Fragment>
          )}
        </Form.Item>
        <Form.Item>
          <Button type="primary" htmlType="submit" disabled={this.disabled}>
            Send
          </Button>
        </Form.Item>
      </Form>
    );
  }
}

export default TransferForm;
