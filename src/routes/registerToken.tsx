/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { Fragment } from 'react';
import Iframe from 'react-iframe';
import { observer } from 'mobx-react';
import { Link } from 'react-router-dom';
import { List, Icon } from 'antd';

import HexString from '../components/hexString';
import CopyToClipboard from '../components/copyToClipboard';
import AppLayout from '../components/appLayout';
import { CONFIG } from '../config';
import { TokenStore } from '../stores/token';
import { tokensStore } from '../stores/tokens';
import ColorBadge from '../components/colorBadge';

const Item: React.FC<{ item: TokenStore }> = observer(({ item }) => (
  <List.Item key={item.address}>
    <List.Item.Meta
      title={
        <Fragment>
          {item.name} ({item.symbol})
          {item.isNft && (
            <Icon
              type="trophy"
              style={{ color: 'lightgray', marginLeft: '5px' }}
              title="Non-fungible token"
            />
          )}
          <ColorBadge address={item.address} />
        </Fragment>
      }
      description={
        <Fragment>
          <Link to={`/explorer/address/${item.address}`}>
            <HexString>{item.address}</HexString>
          </Link>
          <br />
          Color:{' '}
          <CopyToClipboard copyString={String(item.color)}>
            {item.color}
          </CopyToClipboard>
        </Fragment>
      }
    />
  </List.Item>
));

interface RegisterTokenProps {}

@observer
export default class RegisterToken extends React.Component<RegisterTokenProps> {
  public render() {
    return (
      <AppLayout section="registerToken">
        <h1>Registered tokens</h1>
        <List
          itemLayout="vertical"
          size="small"
          className="tokens-list"
          dataSource={tokensStore.ready ? tokensStore.list : undefined}
          renderItem={item => <Item item={item} />}
        />

        <h1 style={{ marginBottom: 16, marginTop: 32 }}>
          Propose a new ERC20/ERC721 token:
        </h1>
        <div>
          <Iframe
            url={CONFIG.tokenFormUrl}
            position="relative"
            height="997px"
            width="100%"
            maxWidth="640px"
            frameBorder="0px"
            marginHeight="0px"
            marginWidth="0px"
          />
        </div>
      </AppLayout>
    );
  }
}
