import * as React from 'react';
import { Fragment } from 'react';
import { computed } from 'mobx';
import { inject, observer } from 'mobx-react';
import { Form, Select, Input } from 'antd';
import autobind from 'autobind-decorator';
import Tokens from '../stores/tokens';
import { isNFT, nftDisplayValue } from '../utils';
import { BigIntType, bi } from 'jsbi-utils';

interface AmountInputProps {
  color: number;
  tokens?: Tokens;
  plasma?: boolean;
  onChange: (newValue: string | number) => void;
  onBlur?: (e: React.FocusEvent) => void;
  onColorChange?: (color: number) => void;
  value: string | number;
  width?: number;
}

type HTMLProps = React.HtmlHTMLAttributes<HTMLInputElement>;
type HTMLPropsWithoutColor = Pick<HTMLProps, Exclude<keyof HTMLProps, 'color'>>;

@inject('tokens')
@observer
export default class AmountInput extends React.Component<
  AmountInputProps & HTMLPropsWithoutColor,
  any
> {
  componentWillReceiveProps(nextProps) {
    const { color: nextColor, onChange } = nextProps;
    const { color } = this.props;
    if (color !== nextColor) {
      if (
        (isNFT(nextColor) !== isNFT(color) || isNFT(nextColor)) &&
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
      const numVal = Number(value) && Number(value) > 0;
      onChange(numVal ? value : 0);
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
          <Select.Option key={String(token.color)} value={token.color}>
            {token.symbol}
          </Select.Option>
        ))}
      </Select>
    );
  }

  render() {
    const { onColorChange, value, width = 250, plasma, ...rest } = this.props;
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
                {((balance as BigIntType[]) || []).map(id => (
                  <Select.Option key={nftDisplayValue(id)} value={nftDisplayValue(id)}>
                    {nftDisplayValue(id)}
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
              {...rest as any}
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
