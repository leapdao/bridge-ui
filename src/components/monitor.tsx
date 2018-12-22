import * as React from 'react';
import { List } from 'antd';
import { NamedNodeEntry } from '../utils/types.d';

function callMethod(node, method, params = []) {
  return fetch(node, {
    method: 'post',
    body: JSON.stringify({
      jsonrpc: '2.0',
      id: 1,
      method,
      params,
    }),
    headers: {
      'Content-Type': 'application/json',
    },
  });
}

function getNodeStatus(node) {
  return callMethod(node, 'plasma_status')
    .then(r => r.json(), () => ({ result: 'offline' }))
    .then(r => r.result || 'unsupported-node');
}

function getBlockNumber(node) {
  return callMethod(node, 'eth_blockNumber')
    .then(r => r.json())
    .then(r => parseInt(r.result, 16));
}

const nodeIcons = {
  ok: '✅',
  offline: '🛑',
  'waiting-for-period': '🔶',
  'catching-up': '🏃‍',
};

const getStatus = info => info && info.status;

interface MonitorProps {
  nodes: Array<NamedNodeEntry>;
}

interface MonitorState {
  nodesInfo: {
    [key: string]: {
      status: string;
      blockNumber: number;
    };
  };
}

export default class Monitor extends React.Component<
  MonitorProps,
  MonitorState
> {
  constructor(props) {
    super(props);
    this.state = {
      nodesInfo: {},
    };

    this.loadInfo = this.loadInfo.bind(this);
  }

  componentDidMount() {
    this.loadInfo();

    setInterval(this.loadInfo, 10000);
  }

  setNodeInfo(node, status) {
    this.setState(state => ({
      nodesInfo: Object.assign({}, state.nodesInfo, {
        [node]: status,
      }),
    }));
  }

  loadInfo() {
    this.props.nodes.forEach(node => {
      Promise.all([getNodeStatus(node.url), getBlockNumber(node.url)]).then(
        ([status, blockNumber]) => {
          this.setNodeInfo(node.url, {
            status,
            blockNumber,
          });
        }
      );
    });
  }

  render() {
    const { nodes } = this.props;
    const { nodesInfo } = this.state;

    return (
      <List
        className="monitor"
        dataSource={nodes}
        renderItem={node => (
          <List.Item key={node.url}>
            <span className="monitor-node">
              {node.label && (<strong>{node.label}:</strong>)} {node.url}
            </span>
            <span
              className={`monitor-status monitor-status-${getStatus(
                nodesInfo[node.url]
              )}`}
            >
              {nodeIcons[getStatus(nodesInfo[node.url])]}
              {getStatus(nodesInfo[node.url]) || 'Checking...'}
            </span>
            {nodesInfo[node.url] && (
              <span>&nbsp;(height {nodesInfo[node.url].blockNumber})</span>
            )}
          </List.Item>
        )}
      />
    );
  }
}
