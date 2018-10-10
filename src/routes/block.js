import React from 'react';
import PropTypes from 'prop-types';
import { observable } from 'mobx';
import { inject, observer } from 'mobx-react';
import { Card, Button, Alert, Spin } from 'antd';
import { Link } from 'react-router-dom';

import TransctionList from '../components/transactionList';
import getParsecWeb3 from '../utils/getParsecWeb3';

const dateFormat = new Intl.DateTimeFormat('en-US', {
  year: 'numeric',
  month: 'long',
  day: 'numeric',
  hour: 'numeric',
  minute: 'numeric',
  second: 'numeric',
  hour12: false,
});

@inject('explorer')
@observer
class Block extends React.Component {
  constructor(props) {
    super(props);
    this.fetch(props.match.params.hashOrNumber);
  }

  componentWillReceiveProps(nextProps) {
    const {
      match: {
        params: { hashOrNumber: param },
      },
    } = this.props;
    const {
      match: {
        params: { hashOrNumber: nextParam },
      },
    } = nextProps;

    if (param !== nextParam) {
      this.fetch(nextParam);
    }
  }

  @observable
  block = null;
  @observable
  fetching = false;
  @observable
  success = false;

  fetch(hashOrNumber) {
    const { explorer } = this.props;
    this.fetching = true;

    (hashOrNumber
      ? Promise.resolve(hashOrNumber)
      : getParsecWeb3().eth.getBlockNumber()
    ).then(param => {
      explorer.getBlock(param).then(block => {
        this.fetching = false;
        this.success = !!block;
        this.block = block;
      });
    });
  }

  render() {
    if (!this.success && !this.fetching) {
      return <Alert type="error" message="Block not found" />;
    }

    if (!this.block || this.fetching) {
      return <Spin />;
    }

    return (
      <Card title={`Block ${this.block.number}`} className="explorer-section">
        <div className="explorer-nav">
          {this.block.number > 2 && (
            <Button>
              <Link to={`/explorer/block/${this.block.number - 1}`}>Prev</Link>
            </Button>
          )}
          <Button>
            <Link to={`/explorer/block/${this.block.number + 1}`}>Next</Link>
          </Button>
        </div>
        <h3>Hash:</h3>
        {this.block.hash}
        <h3>Timestamp:</h3>
        {dateFormat.format(this.block.timestamp * 1000)}
        <h3>Transactions:</h3>
        <TransctionList txs={this.block.transactions} />
      </Card>
    );
  }
}

Block.propTypes = {
  match: PropTypes.object,
  explorer: PropTypes.object,
};

export default Block;
