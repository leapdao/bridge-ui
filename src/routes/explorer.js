/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import React, { Fragment } from 'react';
import { observer, inject } from 'mobx-react';
import { observable } from 'mobx';
import PropTypes from 'prop-types';
import { Link } from 'react-router-dom';

import { Form, Input, Button } from 'antd';
import Active from '../components/explorer/active';

@inject(stores => ({
  explorer: stores.explorer,
}))
@observer
export default class Explorer extends React.Component {
  componentWillReceiveProps(nextProps) {
    const { explorer } = this.props;
    explorer.search(nextProps.match.params.search);
  }

  @observable value;

  render() {
    const { explorer } = this.props;

    return (
      <Fragment>
        <h1>Block Explorer</h1>
        <Form layout="inline">
          <Form.Item>
            <Input
              addonBefore="Search"
              value={this.value}
              style={{ width: 700 }}
              onChange={e => {
                this.value = e.target.value;
              }}
            />
          </Form.Item>
          <Form.Item>
            <Button type="primary" loading={explorer.searching}>
              <Link to={`/explorer/${this.value}`}>Go!</Link>
            </Button>
          </Form.Item>
        </Form>
        <Active />
      </Fragment>
    );
  }
}

Explorer.propTypes = {
  explorer: PropTypes.object,
  match: PropTypes.object,
};
