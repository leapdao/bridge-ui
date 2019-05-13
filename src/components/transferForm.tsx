import * as React from 'react';
import { Fragment } from 'react';
import { isValidAddress } from 'ethereumjs-util';
import { observable } from 'mobx';
import { observer, inject } from 'mobx-react';
import { Input, Button, Form } from 'antd';
import autobind from 'autobind-decorator';
import AmountInput from './amountInput';
import { BigIntType, greaterThan } from 'jsbi-utils';
import { tokensStore } from '../stores/tokens';

interface TransferFormProps {
  color: number;
  disabled: boolean;
  onSubmit: (address: string, value: string | number) => Promise<any>;
}

@observer
class TransferForm extends React.Component<TransferFormProps, any> {
  public get token() {
    const { color } = this.props;
    return tokensStore.tokenForColor(color);
  }

  get valueError() {
    if (!this.value) {
      return 'Required';
    }

    if (!this.token.isNft) {
      const maxValue = this.token.plasmaBalance;
      if (
        maxValue &&
        greaterThan(this.token.toCents(this.value), maxValue as BigIntType)
      ) {
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
  private value = this.token.isNft ? '' : 0;

  @observable
  private receiver = '';

  @observable
  private submitting = false;

  @observable
  private showErrors = false;

  @autobind
  private handleSubmit(e) {
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
  private handleChange(value) {
    this.value = value;
  }

  @autobind
  private handleReceiverChange(e) {
    this.receiver = e.target.value;
  }

  public render() {
    const { color } = this.props;

    if (!this.token || !this.token.ready) {
      return null;
    }

    return (
      <Form onSubmit={this.handleSubmit} className="transferForm">
        <div className="wallet-input">
          <AmountInput
            plasma
            color={color}
            onChange={this.handleChange}
            value={this.value}
            placeholder="Amount to transfer"
          />
        </div>
        {this.showErrors && this.valueError && (
          <Fragment>
            <br />
            <span style={{ color: 'red' }}>{this.valueError}</span>
          </Fragment>
        )}
        <Form.Item className="wallet-input">
          <Input
            value={this.receiver}
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
