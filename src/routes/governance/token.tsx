import * as React from 'react';
import { Fragment } from 'react';
import { observable, computed } from 'mobx';
import { observer } from 'mobx-react';
import { Button, Spin, List, Radio, Card, Skeleton } from 'antd';

import ProposalListItem from '../../components/governance/proposalListItem';
import { proposalStore } from '../../stores/governance/proposalStore';
import ProposalForm from '../../components/governance/proposalForm';
import Web3SubmitWarning from '../../components/web3SubmitWarning';
import { Proposal } from '../../stores/governance/proposal';
import AppLayout from '../../components/appLayout';
import autobind from 'autobind-decorator';

const filters = {
  inprogress: (proposal: Proposal) => !proposal.isMature(),
  mature: (proposal: Proposal) => proposal.isMature() && !proposal.finalized,
  finalized: (proposal: Proposal) => proposal.finalized,
  all: () => true,
};

@observer
export default class TokenGovernance extends React.Component {
  @observable
  private filterBy: string = 'inprogress';

  @observable
  private showForm: boolean;

  @computed
  private get proposals() {
    return proposalStore.proposals.filter(filters[this.filterBy]);
  }

  @autobind
  private hideProposalForm() {
    this.showForm = false;
  }

  @autobind
  private renderListHeader() {
    return (
      <Fragment>
        Show:{' '}
        <Radio.Group
          value={this.filterBy}
          onChange={e => (this.filterBy = e.target.value)}
          size="small"
          style={{ marginBottom: '0.5rem' }}
        >
          <Radio.Button value="inprogress">In progress</Radio.Button>
          <Radio.Button value="mature">Mature</Radio.Button>
          <Radio.Button value="finalized">Finalized</Radio.Button>
          <Radio.Button value="all">All</Radio.Button>
        </Radio.Group>
      </Fragment>
    );
  }

  public render() {
    return (
      <AppLayout section="governance/token">
        <div
          style={{
            display: 'flex',
            justifyContent: 'space-between',
            marginBottom: '2rem',
          }}
        >
          <div>
            <h1>Token Governance Proposals</h1>
          </div>
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <Button key="finalize" disabled={true}>
              Finalize
            </Button>
            <Button
              key="createProposals"
              type="primary"
              style={{ marginLeft: '0.5rem' }}
              onClick={() => (this.showForm = !this.showForm)}
            >
              Create new proposal
            </Button>
          </div>
        </div>

        <Card
          title="New proposal"
          bordered={true}
          style={{ marginBottom: '1rem' }}
          hidden={!this.showForm}
        >
          <ProposalForm
            onSuccess={this.hideProposalForm}
            onCancel={this.hideProposalForm}
          />
        </Card>

        <Web3SubmitWarning />

        <Spin
          spinning={proposalStore.loading}
          size="large"
          tip="Loading proposals..."
        >
          <Skeleton
            loading={proposalStore.loading}
            title={true}
            paragraph={true}
          />
          <Skeleton
            loading={proposalStore.loading}
            title={true}
            paragraph={true}
          />
          <Skeleton
            loading={proposalStore.loading}
            title={true}
            paragraph={true}
          />
          {!proposalStore.loading && (
            <List
              itemLayout="vertical"
              size="small"
              header={this.renderListHeader()}
              locale={{ emptyText: 'No proposals' }}
              dataSource={this.proposals}
              renderItem={proposal => <ProposalListItem proposal={proposal} />}
            />
          )}
        </Spin>
      </AppLayout>
    );
  }
}
