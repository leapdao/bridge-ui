import React, { Fragment } from 'react';
import ethUtil from 'ethereumjs-util';
import { observable } from 'mobx';
import { observer, inject } from 'mobx-react';
import PropTypes from 'prop-types';
import { Input, Button, Form } from 'antd';
import autobind from 'autobind-decorator';

@inject('tokens')
@observer
class TransferForm extends React.Component {
  get valueError() {
    const { minValue, maxValue } = this.props;

    if (!this.value) {
      return 'Required';
    }

    if (maxValue && Number(this.value) > maxValue) {
      return `Should <= ${maxValue}`;
    }

    if (Number(this.value) < minValue) {
      return `Should >= ${minValue}`;
    }

    return undefined;
  }

  get receiverError() {
    if (String(this.receiver || '').trim().length === 0) {
      return 'Required';
    }

    if (!ethUtil.isValidAddress(this.receiver)) {
      return 'Invalid address';
    }

    return undefined;
  }

  get disabled() {
    return this.props.disabled || this.submitting;
  }

  @observable
  value = 0;

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
  handleBlur() {
    const { minValue } = this.props;
    this.value = Math.max(Number(minValue), Number(this.value));
  }

  @autobind
  handleChange(e) {
    this.value = e.target.value;
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

    const token = tokens.tokenForColor(color);

    if (!token || !token.ready) {
      return null;
    }

    return (
      <Form onSubmit={this.handleSubmit} className="transferForm">
        <Form.Item label="Amount">
          <Input
            value={this.value}
            style={{ width: 450, font: 'inherit' }}
            onChange={this.handleChange}
            onBlur={this.handleBlur}
            addonAfter={token.symbol}
          />
          {this.showErrors &&
            this.valueError && (
              <Fragment>
                <br />
                <span style={{ color: 'red' }}>{this.valueError}</span>
              </Fragment>
            )}
        </Form.Item>
        <Form.Item label="Receiver address">
          <Input
            value={this.receiver}
            style={{ width: 450, font: 'inherit' }}
            onChange={this.handleReceiverChange}
          />
          {this.showErrors &&
            this.receiverError && (
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

TransferForm.propTypes = {
  minValue: PropTypes.number,
  maxValue: PropTypes.number,
  onSubmit: PropTypes.func,
  disabled: PropTypes.bool,
  tokens: PropTypes.object,
  color: PropTypes.number.isRequired,
};

TransferForm.defaultProps = {
  minValue: 0,
};

export default TransferForm;
