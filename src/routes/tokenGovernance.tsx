import * as React from 'react';
import { Tabs } from 'antd';

import Web3SubmitWarning from '../components/web3SubmitWarning';
import { Button, Form, Input, Row, Col, Card, Icon } from 'antd';
import TextArea from 'antd/lib/input/TextArea';
import { tokenGovernanceContractStore } from '../stores/tokenGovernanceContract';

const { Fragment } = React;
const { TabPane } = Tabs;
const { Meta } = Card;

export default class TokenGovernance extends React.Component {
  public state: { title: string; description: string; loading: true };
  public sendProposal: any;

  constructor(props: {}) {
    super(props);

    this.state = {
      title: '',
      description: '',
      loading: true,
    };
  }

  public handleClick = e => {
    this.setState({
      current: e.key,
    });
  };

  public onChange = checked => {
    this.setState({ loading: !checked });
  };

  public render() {
    function callback(key) {
      console.log(key);
    }

    const tokenGovernanceContract = tokenGovernanceContractStore;
    const { sendProposal } = tokenGovernanceContract;
    const { loading } = this.state;

    return (
      <Fragment>
        <h1>Token Governance</h1>
        <Web3SubmitWarning />

        <Tabs defaultActiveKey="1" onChange={callback} type="card">
          <TabPane tab="Open for voting" key="1">
            <div className="gutter-example">
              <Row gutter={16}>
                <Col className="gutter-row" span={8}>
                  <Card style={{ width: 400 }} /*loading={loading} */>
                    <h3>This is the proposal title</h3>
                    <Row>
                      <p>
                        Lorem ipsum dolor sit, amet consectetur adipisicing
                        elit. Nihil reiciendis, facilis eius, laborum officia ex
                        reprehenderit numquam perferendis magnam doloribus,
                        eligendi saepe tempora! Officiis eius at dicta veniam
                        quos consequatur? Lorem ipsum dolor sit, amet
                        consectetur adipisicing elit. Nihil reiciendis, facilis
                        eius, laborum officia ex reprehenderit numquam
                        perferendis magnam doloribus, eligendi saepe tempora!
                        Officiis eius at dicta veniam quos consequatur?
                      </p>
                    </Row>
                    <Button.Group>
                      <Button>
                        <Icon type="check" />
                        Yes
                      </Button>
                      <Button>
                        No
                        <Icon type="close" />
                      </Button>
                    </Button.Group>
                  </Card>
                </Col>
                <Col className="gutter-row" span={8}>
                  <Card style={{ width: 400 }} /* loading={loading} */>
                    <h3>This is the proposal title</h3>
                    <Row>
                      <p>
                        Lorem ipsum dolor sit, amet consectetur adipisicing
                        elit. Nihil reiciendis, facilis eius, laborum officia ex
                        reprehenderit numquam perferendis magnam doloribus,
                        eligendi saepe tempora! Officiis eius at dicta veniam
                        quos consequatur? Lorem ipsum dolor sit, amet
                        consectetur adipisicing elit. Nihil reiciendis, facilis
                        eius, laborum officia ex reprehenderit numquam
                        perferendis magnam doloribus, eligendi saepe tempora!
                        Officiis eius at dicta veniam quos consequatur?
                      </p>
                    </Row>
                    <Button.Group>
                      <Button>
                        <Icon type="check" />
                        Yes
                      </Button>
                      <Button>
                        No
                        <Icon type="close" />
                      </Button>
                    </Button.Group>
                  </Card>
                </Col>
                <Col className="gutter-row" span={8}>
                  <Card style={{ width: 400 }} loading={loading}>
                    <h3>This is the proposal title</h3>
                    <Row>
                      <p>
                        Lorem ipsum dolor sit, amet consectetur adipisicing
                        elit. Nihil reiciendis, facilis eius, laborum officia ex
                        reprehenderit numquam perferendis magnam doloribus,
                        eligendi saepe tempora! Officiis eius at dicta veniam
                        quos consequatur? Lorem ipsum dolor sit, amet
                        consectetur adipisicing elit. Nihil reiciendis, facilis
                        eius, laborum officia ex reprehenderit numquam
                        perferendis magnam doloribus, eligendi saepe tempora!
                        Officiis eius at dicta veniam quos consequatur?
                      </p>
                    </Row>
                    <Button.Group>
                      <Button>
                        <Icon type="check" />
                        Yes
                      </Button>
                      <Button>
                        No
                        <Icon type="close" />
                      </Button>
                    </Button.Group>
                  </Card>
                </Col>
              </Row>
            </div>
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
