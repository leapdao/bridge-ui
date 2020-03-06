import * as React from 'react';
import { observable, computed } from 'mobx';
import { observer } from 'mobx-react';
import {
  Button,
  Form,
  Input,
  Row,
  Col,
  Tabs,
  Spin,
  Icon,
  notification,
  List,
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
const { TabPane } = Tabs;

@observer
export default class TokenGovernance extends React.Component {
  @observable
  private title: string;

  @observable
  private description: string;

  @observable
  private submitting: boolean;

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
        <h1>Token Governance</h1>
        <Web3SubmitWarning />
        <Button type="primary">Create new proposal</Button>
        &nbsp;
        <Button>Finalize proposals</Button>
        {proposalStore.proposals ? (
          <List
            itemLayout="vertical"
            size="small"
            dataSource={proposalStore.proposals}
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
