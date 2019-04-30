/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { Fragment } from 'react';
import Iframe from 'react-iframe';
import { observable } from 'mobx';
import { observer, inject } from 'mobx-react';
import { Link } from 'react-router-dom';
import { List, Icon } from 'antd';

import autobind from 'autobind-decorator';
import HexString from '../components/hexString';
import CopyToClipboard from '../components/copyToClipboard';
import AppLayout from '../components/appLayout';
import ExitHandler from '../stores/exitHandler';
import Tokens from '../stores/tokens';
import { CONFIG } from '../config';
import Token from '../stores/token';

const Item: React.FC<{ item: Token }> = observer(({ item }) => (
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
        </Fragment>
      }
      description={
        <Fragment>
          <Link to={`/explorer/address/${item.address}`}>
            <HexString>{item.address}</HexString>
          </Link>
          <br />
          Color:{' '}
          <CopyToClipboard copyString={item.color}>
            {item.color}
          </CopyToClipboard>
        </Fragment>
      }
    />
  </List.Item>
));

interface RegisterTokenProps {
  exitHandler: ExitHandler;
  tokens: Tokens;
}

@inject('tokens', 'exitHandler')
@observer
export default class RegisterToken extends React.Component<
  RegisterTokenProps,
  any
> {
  @observable
  private tokenAddr = '';

  @autobind
  private handleSubmit(e) {
    e.preventDefault();
    const { exitHandler } = this.props;

    exitHandler
      .registerToken(this.tokenAddr)
      .on('transactionHash', registerTxHash => {
        this.tokenAddr = '';
      });
  }

  @autobind
  private handleChange(e) {
    this.tokenAddr = e.target.value;
  }

  render() {
    const { tokens } = this.props;

    return (
      <AppLayout section="registerToken">
        <h1 style={{ marginBottom: 16, marginTop: 32 }}>Registered tokens:</h1>
        <List
          itemLayout="vertical"
          size="small"
          className="tokens-list"
          dataSource={tokens.ready ? tokens.list : undefined}
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
