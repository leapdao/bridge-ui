/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { observer } from 'mobx-react';
import AppLayout from '../../components/appLayout';
import { CONFIG } from '../../config';

@observer
export default class Home extends React.Component {
  render() {
    return (
      <AppLayout section="home">
        <div style={{ maxWidth: '500px' }}>

          <div style={{ color: '#a94442', fontSize: '25px' }}>
            <strong>Danger!</strong> Alpha Software. Use at your own risk.
          </div>
          <h1>What is going on here?</h1>
          <p>This is a gateway to access the LeapDAO Mainnet chain.</p>
          <p>The chain runs <b>The Driftwood</b> version of the LeapDAO chain software:</p>
          <ul style={{ marginInlineStart: '1.5em' }}>
            <li>PoA network based on Tendermint BFT. Nodes are operated by LeapDAO.</li>
            <li>Ability to transfer ERC20/ERC721 tokens.</li>
            <li>Secured by partial <a href="https://www.learnplasma.org/en/learn/mvp.html#more-viable-plasma">MoreVP Plasma</a> implementation.</li>
          </ul>
          <p><b>The Driftwood</b> is the first step of the LeapDAO&#39;s roadmap to eventually run a public Plasma network governed by a DAO and supporting provable computations. You can read more about our development proposition here: <a href="https://docs.google.com/document/d/1vStTjqvqZGyiI5AVtpwCIMlHFnzC_4bbixsCfs27-M8/edit">Plasma Leap whitepaper</a></p>
          <h1>Next steps</h1>
          <p>
            <strong>As a user</strong>, you can try out the network:
          </p>
          <ol style={{ marginInlineStart: '1.5em' }}>
            {CONFIG.tokenFaucet && (<li>Get some tokens from the mainnet <a href="/faucet">faucet</a>.</li>)}
            <li><a href="/wallet">Deposit</a> them to the chain. Your root chain coins will be locked in the Plasma contract and you will get an equivalent balance on the Leap network.</li>
            <li><a href="/wallet">Transfer around</a> your coins. Transfers will happen on the Leap Network, free and fast. You can also try out our <a href="https://github.com/leapdao/mobile-plasma-wallet">mobile wallet alpha</a>.</li>
            <li>Synchronize a <a href="https://github.com/leapdao/leap-node">Plasma node</a> to check the validity of the chain and security of your funds.</li>
            <li>Keep an eye on recent <a href="/governance">goverance proposals</a> that are may change security assumptions.</li>
            <li><a href="/wallet">Exit</a> your coins back to the root chain.</li>
          </ol>

          <p>
            <strong>As a dapp developer</strong>, you can <a href="/registerToken">request</a> your token to be registered on the network. You can use our APIs in your dapp to transact on Leap network (only ERC20/ERC721 transfers are supported so far).
          </p>

          <p>
            If you are curious to know more about the project, read more about us at the <a href="https://leapdao.org/">website</a> and our <a href="https://twitter.com/leapdao">twitter</a>. 
          </p>

          <p>
            If you want to become involved in the project, join our <a href="https://docs.google.com/forms/d/e/1FAIpQLSd8_wDGDAi__HvfYEWNK_bvJzIkxwHHRVL6AFEfJewBd2Vn9A/viewform">Slack</a> — we are looking for like-minded people (not only developers ;)).
          </p>
        </div>
      </AppLayout>
    );
  }
}