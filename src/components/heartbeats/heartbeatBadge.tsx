import * as React from 'react';
import { Fragment } from 'react';
import { Tooltip } from 'antd';

interface HeartbeatBadgeProps {
  periodNumber: number;
  hasHeartbeat: boolean;
}

const bgColor = hasHeartbeat => (hasHeartbeat ? 'limegreen' : 'orangered');

const HeartbeatBadge: React.FC<HeartbeatBadgeProps> = ({
  periodNumber,
  hasHeartbeat,
}) => {
  const noDataYet = hasHeartbeat === null;
  return (
    <Tooltip
      title={
        <Fragment>
          Blocks {(periodNumber - 1) * 32}
          {'—'}
          {periodNumber * 32 - 1}
        </Fragment>
      }
    >
      <span
        style={{
          backgroundColor: noDataYet ? 'lightgray' : bgColor(hasHeartbeat),
          width: 10,
          height: 10,
          display: 'inline-block',
          marginRight: 5,
        }}
      />
    </Tooltip>
  );
};

export default HeartbeatBadge;
