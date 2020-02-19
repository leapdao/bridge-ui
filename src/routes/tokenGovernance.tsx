import * as React from 'react';
import { observer } from 'mobx-react';
import { List, Collapse, Icon, Divider, Tabs } from 'antd';
import TimeAgo from 'react-timeago';

import Web3SubmitWarning from '../components/web3SubmitWarning';

import AppLayout from '../components/appLayout';
import EtherscanLink from '../components/etherscanLink';
import { shortenHex } from '../utils';
import { Button, Menu, Form, Input, Row, Col } from 'antd';
import { governanceContractStore } from '../stores/governanceContract';
import { reaction } from 'mobx';
import TextArea from 'antd/lib/input/TextArea';

const { Fragment } = React;
const { TabPane } = Tabs;

export default class TokenGovernance extends React.Component {
  public state = {
    current: 'open',
  };

  public handleClick = e => {
    this.setState({
      current: e.key,
    });
  };

  public render() {
    function callback(key) {
      console.log(key);
    }
    return (
      <Fragment>
        <h1>Token Governance</h1>
        <Web3SubmitWarning />

        <Tabs defaultActiveKey="1" onChange={callback} type="card">
          <TabPane tab="Open for voting" key="1">
            Content of Tab Pane 1
          </TabPane>
          <TabPane tab="Ready for processing" key="2">
            Content of Tab Pane 2
          </TabPane>
          <TabPane tab="Finalize proposals" key="3">
            Content of Tab Pane 3
          </TabPane>
          <TabPane tab="Submit a proposal" key="4">
            <Form>
              <Row gutter={28}>
                <Col span={10}>
                  <h3>Proposal Title</h3>
                  <Form.Item>
                    <Input placeholder="Give your proposal a Title" />
                  </Form.Item>
                </Col>
              </Row>
              <Row>
                <Col span={10}>
                  <h3>Proposal Description</h3>
                  <Form.Item>
                    <TextArea
                      rows={4}
                      placeholder="Describe what your proposal is about..."
                    />
                  </Form.Item>
                </Col>
              </Row>
              <Form.Item>
                <Button type="primary">Submit Proposal</Button>
              </Form.Item>
            </Form>
          </TabPane>
        </Tabs>
      </Fragment>
    );
  }
}
