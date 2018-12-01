/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { observable } from 'mobx';
import { observer, inject } from 'mobx-react';
import { Spin, List } from 'antd';
import TimeAgo from 'react-timeago';

import Web3SubmitWarning from '../components/web3SubmitWarning';
import { NETWORKS } from '../utils';

import AppLayout from '../components/appLayout';
import GovernanceContract from '../stores/governanceContract';
import Network from '../stores/network';

const { Fragment } = React;

const renderDate = (proposal) => {
  const { effectiveDate, cancelled } = proposal;
  if (cancelled) {
    return 'Cancelled';  
  }
  if (effectiveDate < Date.now()) {
    return 'Ready to be finalized';
  }
  return (<Fragment>Effective in <TimeAgo date={effectiveDate} /></Fragment>);
};

interface GovernanceProps {
  governanceContract: GovernanceContract;
  network: Network;
}

const governanceParams = {
  setOperator: {
    name: 'Change the block submission logic with a new contract: ',
  },
  setMinGasPrice: {
    name: 'Set minimum transaction gas price to ',
  },
  setEpochLength: {
    name: 'Set epoch length to ',
  },
  setParentBlockInterval: {
    name: 'Set parent block interval to ',
  },
  registerToken: {
    name: 'Register a new token: ',
  },
  // TODO: once we have https://github.com/leapdao/bridge-ui/issues/68 implemented,
  // use the subject from proposal to show which contract is going to be upgraded
  transferLogic: {
    name: 'Upgrade contract logic to ',
  },
  transferOwnership: {
    name: 'Introduce new governance process at ',
  }
};


@inject('governanceContract', 'network')
@observer
export default class Governance extends React.Component<GovernanceProps, any> {
  
  constructor(props) {
    super(props);
    this.fetch();
  }

  @observable
  proposals = [];
  
  fetching = false;

  fetch() {
    const { governanceContract } = this.props;
    this.fetching = true;

    governanceContract.list().then(proposals => {
      this.fetching = false;
      this.proposals = proposals;
    });
  }

  private formatParam(abi, value) {
    if (abi.inputs[0].type !== 'address') {
      return value;
    }

    const shortenedValue = `${value.substring(0, 8)}...${value.substring(36)}`;

    const etherscanLink = value => `${NETWORKS[this.props.network.network].etherscanBase}/address/${value}`;

    return (
      <a href={etherscanLink(value)}>
        {shortenedValue}
      </a>
    );
  }

  private proposalDescription(proposal) {
    if (proposal.msg.raw) return proposal.msg.raw;
    const governanceChange = governanceParams[proposal.msg.abi.name] || { name: this.proposalMethod(proposal) };
    return (
      <span>
        {governanceChange.name}
        {' '}
        {this.formatParam(proposal.msg.abi, proposal.msg.params[0])}
      </span>
    );
  }

  private proposalMethod(proposal) {
    if (proposal.msg.raw) return proposal.msg.raw;
    return `${proposal.msg.abi.name}(${proposal.msg.params[0]})`;
  }

  render() { 
    return (
      <AppLayout section="governance">
        <Web3SubmitWarning />

        <h1>Proposals</h1>
        {this.fetching && (<Spin />)}

        {!this.proposals && (<span>No proposals yet</span>)}

        {this.proposals && (
          <List
            itemLayout="vertical"
            size="small"
            dataSource={this.proposals}
            renderItem={item => (
              <List.Item>
                <List.Item.Meta
                  title={this.proposalDescription(item)}
                  description={
                    <div>
                      <span>
                        #{item.num} {this.proposalMethod(item)}
                      </span>
                      <span style={{ float: 'right' }}>
                        {renderDate(item)}
                      </span>
                    </div>
                  }
                />
              </List.Item>            
            )}
          />
        )}
      </AppLayout>
    );
  }
}

