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
import { List, Form, Input, Button, Icon } from 'antd';

import { isValidAddress } from 'ethereumjs-util';
import autobind from 'autobind-decorator';
import Web3SubmitWarning from '../components/web3SubmitWarning';
import AppLayout from '../components/appLayout';
import ExitHandler from '../stores/exitHandler';
import Network from '../stores/network';
import Tokens from '../stores/tokens';
import { CONFIG } from '../config';

const Item = observer(({ item }) => (
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
        <Link to={`/explorer/address/${item.address}`}>{item.address}</Link>
      }
    />
  </List.Item>
));

interface RegisterTokenProps {
  exitHandler: ExitHandler;
  network: Network;
  tokens: Tokens;
}

@inject('tokens', 'exitHandler', 'network')
@observer
export default class RegisterToken extends React.Component<
  RegisterTokenProps,
  any
> {
  @observable
  private tokenAddr = '';

  @autobind
  handleSubmit(e) {
    e.preventDefault();
    const { exitHandler } = this.props;

    exitHandler
      .registerToken(this.tokenAddr)
      .on('transactionHash', registerTxHash => {
        console.log('registerToken', registerTxHash); // eslint-disable-line
        this.tokenAddr = '';
      });
  }

  @autobind
  handleChange(e) {
    this.tokenAddr = e.target.value;
  }

  render() {
    const { network, tokens } = this.props;

    return (
      <AppLayout section="registerToken">

        <h1 style={{ marginBottom: 16, marginTop: 32 }}>Registered tokens:</h1>
        <List
          itemLayout="vertical"
          size="small"
          dataSource={tokens.ready ? tokens.list : undefined}
          renderItem={item => <Item item={item} />}
        />

        <h1 style={{ marginBottom: 16, marginTop: 32 }}>Propose a new ERC20/ERC721 token:</h1>
        <div>
          <Iframe url={CONFIG.tokenFormUrl}
            position="relative"
            height="997px"
            width="640px"
            frameBorder="0px"
            marginHeight="0px"
            marginWidth="0px"
          />
        </div>
      </AppLayout>
    );
  }
}
