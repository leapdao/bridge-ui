import { observer } from 'mobx-react';
import React from 'react';
import PropTypes from 'prop-types';
import { List, Icon } from 'antd';
import TimeAgo from 'react-timeago';

@observer
export default class Explorer extends React.Component {
  constructor(props) {
    super(props);
    this.state = {};
  }

  render() {
    const { blocks } = this.props;
    return (
      <div style={{ width: 400, padding: 20, border: '1px solid lightgray' }}>
        <h1>Blocks</h1>
        <List
          itemLayout="horizontal"
          dataSource={blocks}
          pagination={{
            size: 'small',
            pageSize: 20,
          }}
          renderItem={item => (
            <List.Item>
              <List.Item.Meta
                avatar={<Icon type="database" />}
                title={`Block #${item.number}`}
                description={
                  <div>
                    <div>#{item.hash.substring(0, 20)}...</div>
                    <div>{item.transactions.length} txns</div>
                  </div>
                }
              />
              <div style={{ whiteSpace: 'nowrap' }}>
                <TimeAgo date={item.timestamp * 1000} />
              </div>
            </List.Item>
          )}
        />
      </div>
    );
  }
}

Explorer.propTypes = {
  blocks: PropTypes.array,
};
