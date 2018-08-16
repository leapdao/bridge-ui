/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React, { Fragment } from 'react';
import { observer, inject } from 'mobx-react';
import PropTypes from 'prop-types';

import { Form, Input, Button } from 'antd';
import Block from '../components/explorer/block';

@inject(stores => ({
  explorer: stores.explorer,
}))
@observer
export default class Explorer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {
      value: '',
      sending: false,
    };
    this.handleSubmit = this.handleSubmit.bind(this);
  }

  handleSubmit(e) {
    e.preventDefault();
    const { explorer } = this.props;
    explorer.getBlock(this.state.value);
  }

  render() {
    const { explorer } = this.props;
    const { value, sending } = this.state;

    return (
      <Fragment>
        <h1>Block Explorer</h1>
        <Form onSubmit={this.handleSubmit} layout="inline">
          <Form.Item>
            <Input
              addonBefore="Block number"
              value={value}
              style={{ width: 400 }}
              onChange={e =>
                this.setState({
                  value: e.target.value,
                })
              }
            />
          </Form.Item>
          <Form.Item>
            <Button htmlType="submit" type="primary" loading={sending}>
              Go!
            </Button>
          </Form.Item>
        </Form>
        <Block block={explorer.current} />
      </Fragment>
    );
  }
}

Explorer.propTypes = {
  explorer: PropTypes.object,
};
