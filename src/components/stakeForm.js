import React, { Fragment } from 'react';
import PropTypes from 'prop-types';
import { Input, Button } from 'antd';

class StakeForm extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: String(props.value || ''),
    };
  }

  componentWillReceiveProps(nextProps) {
    if (nextProps.value !== this.props.value) {
      this.setState({
        value: String(nextProps.value || ''),
      });
    }
  }

  get disabled() {
    const { minValue, maxValue, disabled } = this.props;
    const { value } = this.state;
    return (
      disabled || !value || Number(value) > maxValue || Number(value) < minValue
    );
  }

  render() {
    const { symbol, onChange, minValue, onSubmit } = this.props;
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
            onBlur={() => onChange(value)}
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
  onChange: PropTypes.func.isRequired,
  onSubmit: PropTypes.func.isRequired,
  disabled: PropTypes.bool,
  symbol: PropTypes.string.isRequired,
};

StakeForm.defaultProps = {
  minValue: 0,
};

export default StakeForm;
