/**
 * Copyright (c) 2020-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import { Icon, List } from 'antd';
import { observer } from 'mobx-react';
import * as React from 'react';

import { Proposal } from '../../stores/governance/proposal';

interface ProposalListItemProps {
  proposal: Proposal;
}

interface ProposalListItemState {}

@observer
export default class ProposalListItem extends React.Component<
  ProposalListItemProps,
  ProposalListItemState
> {
  public render() {
    const { proposal } = this.props;
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
}
