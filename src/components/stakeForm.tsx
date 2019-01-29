import * as React from 'react';
import { Fragment } from 'react';
import { observer } from 'mobx-react';
import { observable, computed } from 'mobx';
import { Input, Button } from 'antd';
import autobind from 'autobind-decorator';
import Token from '../stores/token';
import { BigIntType, BigInt, bi, biMax, biEqual, greaterThan, lessThan, add, ZERO } from 'jsbi-utils';

const fieldValue = (v: BigIntType) => biMax(v, ZERO);

interface StakeFormProps {
  value: BigIntType;
  minValue: BigIntType;
  maxValue: BigIntType;
  ownStake: BigIntType;
  disabled: boolean;
  token: Token;
  onChange: (newValue: BigIntType) => void;
  onSubmit: () => void;
}

@observer
class StakeForm extends React.Component<StakeFormProps, any> {
  static defaultProps = {
    minValue: 0,
  };
  componentWillReceiveProps(nextProps) {
    if (!biEqual(nextProps.value, this.props.value)) {
      this.value = fieldValue(nextProps.value);
    }
  }

  @computed
  get disabled() {
    const { minValue, maxValue, disabled, ownStake } = this.props;
    const { value } = this;

    if (biEqual(value, 0)) {
      return false;
    }

    return (
      disabled ||
      !value ||
      greaterThan(bi(value), add(bi(maxValue), bi(ownStake))) ||
      lessThan(bi(value), bi(minValue))
    );
  }

  @observable
  value: BigIntType = fieldValue(this.props.value);

  @autobind
  handleUpdate() {
    const { minValue, onChange } = this.props;
    const zero = biEqual(this.value, 0);
    onChange(zero ? ZERO : biMax(minValue, this.value));
  }

  @autobind
  handleChange(e) {
    this.value = e.target.value;
  }

  render() {
    const { token, minValue, onSubmit } = this.props;

    return (
      <Fragment>
        <div
          style={{
            whiteSpace: 'nowrap',
            marginBottom: 10,
            display: 'flex',
            alignItems: 'center',
          }}
        >
          <Input
            value={BigInt(this.value).toString() || ''}
            style={{ width: 150, font: 'inherit' }}
            onChange={this.handleChange}
            onBlur={this.handleUpdate}
            addonAfter={token.symbol}
          />
          &nbsp;
          <span style={{ fontSize: 11 }}>{`${
            greaterThan(bi(minValue), ZERO) ? `>= ${token.toTokens(minValue)}` : ''
          }`}</span>
        </div>
        <Button type="primary" disabled={this.disabled} onClick={onSubmit}>
          Stake
        </Button>
      </Fragment>
    );
  }
}

export default StakeForm;
