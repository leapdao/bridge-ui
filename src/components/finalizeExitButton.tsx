/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { computed, observable, reaction } from 'mobx';
import { inject, observer } from 'mobx-react';
import { Button } from 'antd';
import ExitHandler from '../stores/exitHandler';
import Token from '../stores/token';
import autobind from 'autobind-decorator';

interface FinalizeExitButtonProps {
  token: Token;
  exitHandler?: ExitHandler;
}

interface FinalizeExitButtonState {
  exitQueueSize: number;
}

@inject('exitHandler')
@observer
export default class FinalizeExitButton extends React.Component<
  FinalizeExitButtonProps,
  FinalizeExitButtonState
> {

  @observable
  private exitQueueSize: number = 0;

  constructor(props) {
    super(props);
    
    reaction(() => this.props.token, this.loadQueueSize);
    this.loadQueueSize();
  }

  @autobind
  loadQueueSize() {
    const { exitHandler, token } = this.props;
    exitHandler.exitQueueSize(token.color).then(size => {
      this.exitQueueSize = Number(size);
    })
  }

  @computed
  get disabled() {
    return !this.exitQueueSize;
  }

  @autobind
  finalize() {
    const { exitHandler, token } = this.props;
    return exitHandler.finalizeExits(token.color);
  }

  render() {
    const caption = `Finalize ${this.props.token.symbol} top exit`;
    return (
      <Button
        onClick={this.finalize}
        disabled={this.disabled}
      >
        {caption}
      </Button>
    );    
  }
};