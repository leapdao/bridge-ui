/**
 * Copyright (c) 2020-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { Spin, Form, Button, Input, notification, Icon } from 'antd';
import { observable, computed } from 'mobx';
import autobind from 'autobind-decorator';
import { observer } from 'mobx-react';
import { EventEmitter } from 'events';
import * as React from 'react';

import { Proposal } from '../../stores/governance/proposal';
import {
  proposalStore,
  ProposalLifecycle,
} from '../../stores/governance/proposalStore';

const { Fragment } = React;
const { TextArea } = Input;

interface ProposalFormProps {
  onCancel?: () => void;
  onSuccess?: (proposal: Proposal) => void;
}

interface ProposalFormState {}

@observer
export default class ProposalForm extends React.Component<
  ProposalFormProps,
  ProposalFormState
> {
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

  @autobind
  private onCancel(): void {
    this.title = '';
    this.description = '';
    this.submitting = false;
    this.props.onCancel();
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

    const proposal = await proposalStore.create(
      this.title,
      this.description,
      this.progressIndicator()
    );

    this.props.onSuccess(proposal);
    this.submitting = false;
  }

  public render() {
    return (
      <Spin size="large" spinning={!!this.submitting}>
        <Form>
          <Form.Item label="Title">
            <Input
              name="title"
              value={this.title}
              placeholder="Give your proposal a Title"
              disabled={!this.canEdit}
              onChange={e => (this.title = e.target.value)}
            />
          </Form.Item>
          <Form.Item
            label="Description"
            help={
              <Fragment>
                <a href="https://commonmark.org/help/" target="_blank">
                  Markdown
                </a>{' '}
                is supported
              </Fragment>
            }
          >
            <TextArea
              name="description"
              value={this.description}
              rows={4}
              placeholder="Describe what your proposal is about..."
              disabled={!this.canEdit}
              onChange={e => (this.description = e.target.value)}
            />
          </Form.Item>
          <Form.Item>
            <Button
              type="primary"
              onClick={this.sendToContract}
              disabled={!this.canSubmit}
            >
              Submit Proposal
            </Button>{' '}
            <Button onClick={this.onCancel}>Cancel</Button>
          </Form.Item>
        </Form>
      </Spin>
    );
  }
}
