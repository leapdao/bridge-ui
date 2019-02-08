/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { observer, inject } from 'mobx-react';
import { List, Collapse, Icon } from 'antd';
import TimeAgo from 'react-timeago';

import Web3SubmitWarning from '../components/web3SubmitWarning';

import AppLayout from '../components/appLayout';
import GovernanceContract from '../stores/governanceContract';
import EtherscanLink from '../components/etherscanLink';

const { Fragment } = React;

const renderDate = ({ effectiveDate, cancelled }) => {
  const iconStyle = {
    display: 'block',
    fontSize: '24px',
    marginBottom: '5px',
  };
  if (cancelled) {
    return (<Fragment>
      <Icon type="issues-close" style={{ color: '#ff1616', ...iconStyle }}/>
      <span>Cancelled</span>
    </Fragment>)  
  } 
  if (effectiveDate < Date.now()) {
    return (<Fragment>
      <Icon type="issues-close" style={{ color: '#ff9216', ...iconStyle }}/>
      <span>Finalizing</span>
    </Fragment>)
  }
  return (<Fragment>
    <Icon type="clock-circle" style={{ color: '#167bff', ...iconStyle }}/>
    <span>Applies in</span>
    <TimeAgo date={effectiveDate} style={{ display: 'block' }} />
  </Fragment>);
};

interface GovernanceProps {
  governanceContract: GovernanceContract;
}

@inject('governanceContract')
@observer
export default class Governance extends React.Component<GovernanceProps, any> {
  
  constructor(props) {
    super(props);
  }
  
  private formatParam(abi, value) {
    if (!abi || abi.inputs[0].type !== 'address') {
      return value;
    }

    return <EtherscanLink value={value}/>;
  }

  private renderContent(proposal) {
    return (<Fragment>
        {proposal.currentValue && (
          <div className="attribute">
            <label>Current value:</label>
            <span>{this.formatParam(proposal.msg.abi, proposal.currentValue)}</span>      
          </div>
        )}
        <div className="attribute">
          <label>New value:</label>
          <span>{this.formatParam(proposal.msg.abi, proposal.newValue)}</span>
        </div>
      <Collapse bordered={false}>
        <Collapse.Panel header="Details" key="1" className="details">
        <div className="attribute">
            <label>Proposal #:</label>
            <span>{proposal.num}</span>
          </div>
          <div className="attribute">
            <label>Contract:</label>
            <span>{proposal.subject}</span>
          </div>
          <div className="attribute">
            <label>Contract type:</label>
            <span>{proposal.subjectType}</span>
          </div>
          <div className="attribute">
            <label>Call:</label>
            <span>{proposal.methodStr}</span>
          </div>
        </Collapse.Panel>
      </Collapse>
    </Fragment>
    )
  };

  render() { 
    const { governanceContract } = this.props;
    const { proposals, noGovernance } = governanceContract;
    return (
      <AppLayout section="governance">
        <Web3SubmitWarning />

        {noGovernance && (<span>No governance set up</span>)}

        {proposals && proposals.length === 0 && (<span>No proposals yet</span>)}

        {proposals && proposals.length > 0 && (
          <Fragment>
            <h1>Proposals</h1>
            <List
              itemLayout="vertical"
              size="small"
              dataSource={proposals}
              renderItem={item => (
                <List.Item 
                  className='governanceProposal'
                  extra={
                    <div style={{
                      minWidth: '190px',
                      textAlign: 'center',
                      padding: '16px',
                    }}>
                      {renderDate(item)}
                    </div>
                 }>
                  <List.Item.Meta
                    title={item.summaryStr}
                  />
                  {this.renderContent(item)}
                </List.Item>            
              )}
            />
          </Fragment>
        )}
      </AppLayout>
    );
  }
}

