import { observer, inject } from 'mobx-react';
import React from 'react';
import PropTypes from 'prop-types';
import { Row, Col } from 'antd';
import Blocks from './blocks/';

import './style.scss';

@inject(stores => ({
  store: stores.blocks,
}))
@observer
export default class Explorer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { store, style } = this.props;
    return (
      <div className="explorer" style={style}>
        <Row type="flex" gutter={16}>
          <Col span={12}>
            <Blocks blocks={store.blocks} />
          </Col>
          <Col span={12}>
            <Blocks blocks={store.blocks} />
          </Col>
        </Row>
      </div>
    );
  }
}

Explorer.propTypes = {
  store: PropTypes.object,
  style: PropTypes.object,
};
