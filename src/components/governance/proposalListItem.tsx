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

const IconText = ({ type, text }) => (
  <span>
    <Icon type={type} style={{ marginRight: 8 }} />
    {text}
  </span>
);

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
        actions={[
          <IconText type="like-o" text={proposal.yesVotes} />,
          <IconText type="dislike-o" text={proposal.noVotes} />,
        ]}
      >
        <List.Item.Meta title={proposal.title} />
        {proposal.description}
      </List.Item>
    );
  }
}
