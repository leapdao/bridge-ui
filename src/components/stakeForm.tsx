import * as React from 'react';
import { Fragment } from 'react';
import { observer } from 'mobx-react';
import { observable, computed } from 'mobx';
import { Input, Button } from 'antd';
import autobind from 'autobind-decorator';

const fieldValue = v => String(v >= 0 ? v : '');

interface StakeFormProps {
  value: number | string;
  minValue: number;
  maxValue: number;
  ownStake: number;
  disabled: boolean;
  symbol: string;
  onChange: (newValue: number) => void;
  onSubmit: () => void;
}

@observer
class StakeForm extends React.Component<StakeFormProps, any> {
  static defaultProps = {
    minValue: 0,
  };
  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      this.value = fieldValue(nextProps.value);
    }
  }

  @computed
  get disabled() {
    const { minValue, maxValue, disabled, ownStake } = this.props;
    const { value } = this;

    if (value === 0 || value === '0') {
      return false;
    }

    return (
      disabled ||
      !value ||
      Number(value) > maxValue + ownStake ||
      Number(value) < minValue
    );
  }

  @observable
  value: number | string = fieldValue(this.props.value);

  @autobind
  handleUpdate() {
    const { minValue, onChange } = this.props;
    const zero = this.value === 0 || this.value === '0';
    onChange(zero ? 0 : Math.max(Number(minValue), Number(this.value)));
  }

  @autobind
  handleChange(e) {
    this.value = e.target.value;
  }

  render() {
    const { symbol, minValue, onSubmit } = this.props;

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
            value={this.value || ''}
            style={{ width: 150, font: 'inherit' }}
            onChange={this.handleChange}
            onBlur={this.handleUpdate}
            addonAfter={symbol}
          />
          &nbsp;
          <span style={{ fontSize: 11 }}>{`${
            minValue > 0 ? `>= ${minValue}` : ''
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
