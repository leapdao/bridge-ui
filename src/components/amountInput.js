import React, { Fragment } from 'react';
import { Output } from 'leap-core';
import PropTypes from 'prop-types';
import { computed } from 'mobx';
import { inject, observer } from 'mobx-react';
import { Form, Select, Input } from 'antd';
import autobind from 'autobind-decorator';

@inject('tokens')
@observer
export default class AmountInput extends React.Component {
  static propTypes = {
    color: PropTypes.number.isRequired,
    tokens: PropTypes.object,
    plasma: PropTypes.bool,
    onColorChange: PropTypes.func,
    onChange: PropTypes.func,
    onBlur: PropTypes.func,
    width: PropTypes.number,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  };

  componentWillReceiveProps({ color: nextColor, onChange }) {
    const { color } = this.props;
    if (color !== nextColor) {
      if (
        (Output.isNFT(nextColor) !== Output.isNFT(color) ||
          Output.isNFT(nextColor)) &&
        typeof onChange === 'function'
      ) {
        onChange('');
      }
    }
  }

  @computed
  get token() {
    const { tokens, color } = this.props;
    return tokens && tokens.tokenForColor(color);
  }

  @autobind
  handleChange(e) {
    const { onChange } = this.props;
    if (typeof onChange === 'function') {
      onChange(e.target.value);
    }
  }

  @autobind
  handleNFTChange(tokenId) {
    const { onChange } = this.props;
    if (typeof onChange === 'function') {
      onChange(tokenId);
    }
  }

  @autobind
  handleBlur(e) {
    const { onChange, onBlur, value } = this.props;
    if (!this.token.isNft && typeof onChange === 'function') {
      onChange(Number(value) || 0);
    }

    if (typeof onBlur === 'function') {
      onBlur(e);
    }
  }

  @autobind
  handleColorChange(newColor) {
    const { onColorChange } = this.props;
    if (typeof onColorChange === 'function') {
      onColorChange(newColor);
    }
  }

  renderColorsSelect() {
    const { tokens, color } = this.props;
    return (
      <Select
        value={color}
        style={{ width: this.token.isNft ? 120 : 80 }}
        onChange={this.handleColorChange}
      >
        {tokens.list.map(token => (
          <Select.Option key={token} value={token.color}>
            {token.symbol}
          </Select.Option>
        ))}
      </Select>
    );
  }

  render() {
    const { onColorChange, value, width = 250, plasma } = this.props;
    const balance = plasma ? this.token.plasmaBalance : this.token.balance;

    return (
      <Fragment>
        {this.token.isNft && (
          <Fragment>
            <Form.Item>
              <Select
                value={value}
                style={{ width }}
                onChange={this.handleNFTChange}
                notFoundContent="No tokens"
                allowClear
              >
                {(balance || []).map(id => (
                  <Select.Option key={id} value={id}>
                    {id}
                  </Select.Option>
                ))}
              </Select>
            </Form.Item>
            {onColorChange && (
              <Form.Item>{this.renderColorsSelect()}</Form.Item>
            )}
          </Fragment>
        )}
        {!this.token.isNft && (
          <Form.Item>
            <Input
              {...this.props}
              value={value}
              onChange={this.handleChange}
              onBlur={this.handleBlur}
              addonAfter={
                onColorChange ? this.renderColorsSelect() : this.token.symbol
              }
              style={{ width }}
            />
          </Form.Item>
        )}
      </Fragment>
    );
  }
}
