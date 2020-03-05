import * as React from 'react';
import { observable, computed } from 'mobx';
import { observer } from 'mobx-react';
import { Button, Form, Input, Row, Col, Tabs, Spin, notification } from 'antd';

import Contract from 'web3/eth/contract';
import autobind from 'autobind-decorator';
import Web3SubmitWarning from '../components/web3SubmitWarning';
import { web3InjectedStore } from '../stores/web3/injected';
import { tokenGovernance as tokenGovAbi } from '../utils/abis';
import { governanceContractStore } from '../stores/governanceContract';
import { CONFIG } from '../config';
import { Proposal } from '../stores/governance/proposal';

const { TextArea } = Input;
const { Fragment } = React;
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

  @computed
  public get tokenGovContract(): Contract | undefined {
    if (web3InjectedStore.instance) {
      return new web3InjectedStore.instance.eth.Contract(
        tokenGovAbi,
        CONFIG.tokenGovernanceAddress
      );
    }
  }

  @autobind
  public async sendToContract() {
    this.submitting = true;

    notification.open({
      key: 'ipfsUpload',
      message: 'Uploading proposal to IPFS...',
      icon: <Spin />,
      duration: 0,
      description: '',
    });

    console.log('title:', this.title, 'description:', this.description);

    const proposal = new Proposal(this.title, this.description);

    const proposalHash = await proposal.store();

    notification.close('ipfsUpload');

    const accounts = await web3InjectedStore.instance.eth.getAccounts();

    const tx = this.tokenGovContract.methods
      .registerProposal(proposalHash)
      .send({
        from: accounts[0],
      });

    governanceContractStore.watchTx(tx, 'registerProposal', {
      message:
        'Registering token governance proposal. ' +
        'A stake of 5000 LEAP will be deducted from your account',
    });

    tx.then(_ => {
      this.submitting = false;
      this.description = '';
      this.title = '';
    }).catch(e => {
      this.submitting = false;
      throw e;
    });

    return tx;
  }

  public render() {
    return (
      <Fragment>
        <h1>Token Governance</h1>
        <Web3SubmitWarning />

        <Tabs defaultActiveKey="1" type="card">
          <TabPane tab="Open for voting" key="1">
            Content of Tab d1
          </TabPane>
          <TabPane tab="Ready for processing" key="2">
            Content of Tab 2
          </TabPane>
          <TabPane tab="Finalize proposals" key="3">
            Content of Tab 3
          </TabPane>
          <TabPane tab="Submit a proposal" key="4">
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
          </TabPane>
        </Tabs>
      </Fragment>
    );
  }
}
