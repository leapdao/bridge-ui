import * as React from 'react';
import { Tabs } from 'antd';

import Web3SubmitWarning from '../components/web3SubmitWarning';

import { Button, Form, Input, Row, Col } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import { keccak256 } from 'ethereumjs-util';
import { observable, computed, reaction } from 'mobx';
import Contract from 'web3/eth/contract';
import autobind from 'autobind-decorator';
import { web3InjectedStore } from '../stores/web3/injected';
import { tokenGovernance as tokenGovAbi } from '../utils/abis';
import { governanceContractStore } from '../stores/governanceContract';

const { Fragment } = React;
const { TabPane } = Tabs;

export default class TokenGovernance extends React.Component {
  @observable
  public key: any;
  public state: { title: string; description: string };
  public props: any;

  constructor(props: {}) {
    super(props);

    this.state = {
      title: '',
      description: '',
    };
  }

  @computed
  public get tokenGovContract(): Contract | undefined {
    if (web3InjectedStore.instance) {
      return new web3InjectedStore.instance.eth.Contract(
        tokenGovAbi,
        '0x3cc955f91d645b4250f6070a8b7d71365662776f'
      );
    }
  }

  @autobind
  public async sendToContract() {
    console.log(
      'title: ',
      this.state.title,
      'description: ',
      this.state.description
    );

    const proposalHashBuffer = keccak256(
      `${this.state.title}::${this.state.description}`
    );

    const proposalHash = `0x${Buffer.from(proposalHashBuffer).toString('hex')}`;
    console.log('tokenGovernance', proposalHash);

    const accounts = await web3InjectedStore.instance.eth.getAccounts();

    console.log('proposalHash', proposalHash);
    console.log('tokenGovernanceContract', proposalHash);
    const tx = this.tokenGovContract.methods
      .registerProposal(proposalHash)
      .send({
        from: accounts[0],
      });
    console.log(this.tokenGovContract.methods.registerProposal(proposalHash));

    governanceContractStore.watchTx(tx, 'send..', {
      message: 'send',
    });

    return tx;
  }

  public render() {
    console.log(this.state.title);
    console.log(this.state.description);

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
            <Form>
              <Row gutter={28}>
                <Col span={10}>
                  <h3>Proposal Title</h3>
                  <Form.Item>
                    <Input
                      name="title"
                      placeholder="Give your proposal a Title"
                      onChange={e => this.setState({ title: e.target.value })}
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
                      rows={4}
                      placeholder="Describe what your proposal is about..."
                      onChange={e =>
                        this.setState({ description: e.target.value })
                      }
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Button type="primary" onClick={this.sendToContract}>
                  Submit Proposal
                </Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Fragment>
    );
  }
}
