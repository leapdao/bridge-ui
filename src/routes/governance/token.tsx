import * as React from 'react';
import { observable, computed } from 'mobx';
import { observer } from 'mobx-react';
import {
  Button,
  Form,
  Input,
  Row,
  Col,
  Spin,
  Icon,
  notification,
  List,
  Radio,
} from 'antd';

import autobind from 'autobind-decorator';
import AppLayout from '../../components/appLayout';
import Web3SubmitWarning from '../../components/web3SubmitWarning';
import {
  proposalStore,
  ProposalLifecycle,
} from '../../stores/governance/proposalStore';
import { Proposal } from '../../stores/governance/proposal';
import { EventEmitter } from 'events';

const { TextArea } = Input;

type ProposalFilter = (proposal: Proposal) => boolean;

const filters = {
  inprogress: (proposal: Proposal) => !proposal.isMature(),
  mature: (proposal: Proposal) => proposal.isMature() && !proposal.finalized,
  finalized: (proposal: Proposal) => proposal.finalized,
  all: () => true,
};

@observer
export default class TokenGovernance extends React.Component {
  @observable
  private title: string;

  @observable
  private description: string;

  @observable
  private submitting: boolean;

  @observable
  private filterBy: string = 'inprogress';

  @computed
  private get canSubmit(): boolean {
    return !!this.title && !!this.description && !this.submitting;
  }

  @computed
  private get canEdit(): boolean {
    return !this.submitting;
  }

  private progressIndicator(): EventEmitter {
    const progress = new EventEmitter();
    progress
      .on(ProposalLifecycle.IPFS_UPLOAD, ({ title }) => {
        notification.open({
          key: `ipfsUpload${title}`,
          message: 'Uploading proposal to IPFS...',
          icon: <Spin />,
          duration: 0,
          description: <i>{title}</i>,
        });
      })
      .on(ProposalLifecycle.SUBMIT_TO_CONTRACT, ({ title }) => {
        notification.close(`ipfsUpload${title}`);
      })
      .on(ProposalLifecycle.CREATED, ({ title }) => {
        this.description = '';
        this.title = '';
        notification.open({
          key: `proposal:create:success:${title}`,
          message: 'Proposal registered',
          icon: <Icon type="check-circle" style={{ color: 'green' }} />,
          duration: 2,
          description: <i>{title}</i>,
        });
      })
      .on(ProposalLifecycle.FAILED_TO_CREATE, ({ title }) => {
        notification.open({
          key: `proposal:create:failed:${title}`,
          message: 'Failed to create proposal',
          icon: <Icon type="close-circle" style={{ color: 'red' }} />,
          duration: 2,
          description: <i>{title}</i>,
        });
      });
    return progress;
  }

  @autobind
  public async sendToContract() {
    this.submitting = true;

    console.log('title:', this.title, 'description:', this.description);

    await proposalStore.create(
      this.title,
      this.description,
      this.progressIndicator()
    );
    this.submitting = false;
  }

  @computed
  private get proposals() {
    return (proposalStore.proposals || []).filter(filters[this.filterBy]);
  }

  @autobind
  private renderProposal(proposal: Proposal) {
    return (
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
            <Icon type="like" style={{ fontSize: 24, width: '2rem' }} />
            <Icon type="dislike" style={{ fontSize: 24, width: '2rem' }} />
          </div>
        }
      >
        <List.Item.Meta
          title={proposal.title}
          description={'created by:' + proposal.creator}
        />
        {proposal.description}
      </List.Item>
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
            <Button key="finalize">Finalize</Button>
            <Button
              key="createProposals"
              type="primary"
              style={{ marginLeft: '0.5rem' }}
            >
              Create new proposal
            </Button>
          </div>
        </div>
        <Web3SubmitWarning />
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
        {!proposalStore.loading ? (
          <List
            itemLayout="vertical"
            size="small"
            dataSource={this.proposals}
            renderItem={this.renderProposal}
          />
        ) : (
          <div className="tokens-loading">
            <Spin />
            Loading proposals...
          </div>
        )}
        <Spin size="large" spinning={!!this.submitting}>
          <Form>
            <Row gutter={28}>
              <Col span={10}>
                <h3>Proposal Title</h3>
                <Form.Item>
                  <Input
                    name="title"
                    value={this.title}
                    placeholder="Give your proposal a Title"
                    disabled={!this.canEdit}
                    onChange={e => (this.title = e.target.value)}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Row>
              <Col span={10}>
                <h3>Proposal Description</h3>
                <Form.Item>
                  <TextArea
                    name="description"
                    value={this.description}
                    rows={4}
                    placeholder="Describe what your proposal is about..."
                    disabled={!this.canEdit}
                    onChange={e => (this.description = e.target.value)}
                  />
                </Form.Item>
              </Col>
            </Row>
            <Form.Item>
              <Button
                type="primary"
                onClick={this.sendToContract}
                disabled={!this.canSubmit}
              >
                Submit Proposal
              </Button>
            </Form.Item>
          </Form>
        </Spin>
      </AppLayout>
    );
  }
}
