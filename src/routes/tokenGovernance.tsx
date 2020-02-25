import * as React from 'react';
import { Tabs } from 'antd';

import Web3SubmitWarning from '../components/web3SubmitWarning';

import { Button, Form, Input, Row, Col } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import { keccak256 } from 'ethereumjs-util';
import Web3 from '../stores/web3/ts_workaround';
import { tokenGovernanceContractStore } from '../stores/tokenGovernanceContract';

const { Fragment } = React;
const { TabPane } = Tabs;

export default class TokenGovernance extends React.Component {
  public state: { title: string; description: string };
  public sendProposal: any;

  constructor(props: {}) {
    super(props);

    this.state = {
      title: '',
      description: '',
    };
  }

  public handleClick = e => {
    this.setState({
      current: e.key,
    });
  };

  public render() {
    function callback(key) {
      console.log(key);
    }

    const tokenGovernanceContract = tokenGovernanceContractStore;
    const { sendProposal } = tokenGovernanceContract;

    console.log(this.state);

    return (
      <Fragment>
        <h1>Token Governance</h1>
        <Web3SubmitWarning />

        <Tabs defaultActiveKey="1" onChange={callback} type="card">
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
                <Button type="primary" onClick={sendProposal}>
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
