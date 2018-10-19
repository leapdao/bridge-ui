import React, { Fragment } from 'react';
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
    width: PropTypes.number,
    value: PropTypes.oneOfType([PropTypes.string, PropTypes.number]),
  };

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
  handleBlur() {
    const { onChange, value } = this.props;
    if (!this.token.isNft && typeof onChange === 'function') {
      onChange(Number(value) || 0);
    }
  }

  @autobind
  handleColorChange(newColor) {
    const { color, onColorChange, tokens } = this.props;
    if (typeof onColorChange === 'function') {
      onColorChange(newColor);
    }
    if (
      tokens.tokenForColor(newColor).isNft !==
        tokens.tokenForColor(color).isNft ||
      tokens.tokenForColor(newColor).isNft
    ) {
      this.value = '';
    }
  }

  renderColorsSelect() {
    const { tokens, color } = this.props;
    return (
      <Select
        defaultValue={color}
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
    const { onColorChange, width = 250, plasma } = this.props;
    const balance = plasma ? this.token.plasmaBalance : this.token.balance;

    return (
      <Fragment>
        {this.token.isNft && (
          <Fragment>
            <Form.Item>
              <Select
                defaultValue={this.value}
                style={{ width }}
                onChange={this.handleNFTChange}
              >
                {balance.map(id => (
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
              value={this.value}
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
