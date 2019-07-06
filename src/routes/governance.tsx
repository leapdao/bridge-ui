/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { observer } from 'mobx-react';
import { List, Collapse, Icon } from 'antd';
import TimeAgo from 'react-timeago';

import Web3SubmitWarning from '../components/web3SubmitWarning';

import AppLayout from '../components/appLayout';
import EtherscanLink from '../components/etherscanLink';
import { shortenHex } from '../utils';
import { Button } from 'antd';
import { governanceContractStore } from '../stores/governanceContract';

const { Fragment } = React;

const renderDate = ({ effectiveDate, cancelled }) => {
  const iconStyle = {
    display: 'block',
    fontSize: '24px',
    marginBottom: '5px',
  };
  if (cancelled) {
    return (
      <Fragment>
        <Icon type="issues-close" style={{ color: '#ff1616', ...iconStyle }} />
        <span>Cancelled</span>
      </Fragment>
    );
  }
  if (effectiveDate < Date.now()) {
    return (
      <Fragment>
        <Icon type="issues-close" style={{ color: '#ff9216', ...iconStyle }} />
        <span>Finalizing</span>
      </Fragment>
    );
  }
  return (
    <Fragment>
      <Icon type="clock-circle" style={{ color: '#167bff', ...iconStyle }} />
      <span>Applies in</span>
      <TimeAgo date={effectiveDate} style={{ display: 'block' }} />
    </Fragment>
  );
};

interface GovernanceProps {}

const isEtherscannable = (value: string) =>
  value.startsWith &&
  value.startsWith('0x') &&
  (value.length === 42 || value.length === 66);

const isLengthyHex = (value: string) =>
  value.startsWith && value.startsWith('0x') && value.length > 20;

@observer
export default class Governance extends React.Component<GovernanceProps, any> {
  private formatValue(value) {
    if (isEtherscannable(value)) {
      return <EtherscanLink key={value} value={value} />;
    }

    if (isLengthyHex(value)) {
      value = shortenHex(value);
    }

    return <span key={value}>{String(value)}</span>;
  }

  private formatParams(values = []) {
    return values
      .map(this.formatValue)
      .map(v => [', ', v])
      .flat()
      .splice(1);
  }

  private renderContent(proposal) {
    return (
      <Fragment>
        {proposal.currentValue && (
          <div className="attribute">
            <label>Current value:</label>
            <span>{this.formatValue(proposal.currentValue)}</span>
          </div>
        )}
        <div className="attribute">
          <label>New value:</label>
          <span>{this.formatParams(proposal.newValue)}</span>
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
    );
  }

  public render() {
    const governanceContract = governanceContractStore;
    const {
      proposals,
      noGovernance,
      canFinalize,
      finalize,
    } = governanceContract;
    return (
      <AppLayout section="governance">
        <Web3SubmitWarning />

        {noGovernance && <span>No governance set up</span>}

        {proposals && proposals.length === 0 && <span>No proposals yet</span>}
        {proposals && proposals.length > 0 && (
          <Fragment>
            <h1>Proposals</h1>
            <List
              itemLayout="vertical"
              size="small"
              dataSource={proposals}
              renderItem={item => (
                <List.Item
                  className="governanceProposal"
                  extra={
                    <div
                      style={{
                        minWidth: '190px',
                        textAlign: 'center',
                        padding: '16px',
                      }}
                    >
                      {renderDate(item)}
                    </div>
                  }
                >
                  <List.Item.Meta title={item.summaryStr} />
                  {this.renderContent(item)}
                </List.Item>
              )}
            />
          </Fragment>
        )}
        {canFinalize && (
          <div style={{ paddingTop: '1rem' }}>
            <Button onClick={finalize}>Finalize proposals</Button>
          </div>
        )}
      </AppLayout>
    );
  }
}
