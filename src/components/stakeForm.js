import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Input, Button } from 'antd';
import BigNumber from 'bignumber.js';

const fieldValue = v => String(v >= 0 ? v : '');

class StakeForm extends React.PureComponent {
  constructor(props) {
    super(props);
    this.state = {
      value: fieldValue(props.value),
    };
    this.handleUpdate = this.handleUpdate.bind(this);
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      this.setState({
        value: fieldValue(nextProps.value),
      });
    }
  }

  get disabled() {
    const { minValue, maxValue, disabled, ownStake } = this.props;
    const { value } = this.state;

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

  handleUpdate() {
    const { minValue, onChange } = this.props;
    const { value } = this.state;
    const minStake = new BigNumber(minValue);
    const zero = value === 0 || value === '0';
    onChange(zero ? 0 : Math.max(Number(minStake), Number(value)));
  }

  render() {
    const { symbol, minValue, onSubmit } = this.props;
    const { value } = this.state;

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
            value={value || ''}
            style={{ width: 150, font: 'inherit' }}
            onChange={e => this.setState({ value: e.target.value })}
            onBlur={this.handleUpdate}
            addonAfter={symbol}
          />&nbsp;
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

StakeForm.propTypes = {
  value: PropTypes.number,
  minValue: PropTypes.number,
  maxValue: PropTypes.number,
  ownStake: PropTypes.number,
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  symbol: PropTypes.string.isRequired,
};

StakeForm.defaultProps = {
  minValue: 0,
};

export default StakeForm;
