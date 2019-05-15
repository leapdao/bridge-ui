/**
 * Copyright (c) 2018-present, Leap DAO (leapdao.org)
 *
 * This source code is licensed under the GNU GENERAL PUBLIC LICENSE Version 3
 * found in the LICENSE file in the root directory of this source tree.
 */

import * as React from 'react';
import { computed, observable, reaction } from 'mobx';
import { observer } from 'mobx-react';
import { Button } from 'antd';
import autobind from 'autobind-decorator';
import { TokenStore } from '../stores/token';
import { exitHandlerStore } from '../stores/exitHandler';

interface FinalizeExitButtonProps {
  token: TokenStore;
}

interface FinalizeExitButtonState {
  exitQueueSize: number;
}

@observer
export default class FinalizeExitButton extends React.Component<
  FinalizeExitButtonProps,
  FinalizeExitButtonState
> {
  @observable
  private exitQueueSize: number = 0;

  constructor(props: FinalizeExitButtonProps) {
    super(props);

    reaction(() => this.props.token, this.loadQueueSize);
    this.loadQueueSize();
  }

  @autobind
  private loadQueueSize() {
    const { token } = this.props;
    exitHandlerStore.exitQueueSize(token.color).then(size => {
      this.exitQueueSize = Number(size);
    });
  }

  @computed
  get disabled() {
    return !this.exitQueueSize;
  }

  @autobind
  private finalize() {
    const { token } = this.props;
    return exitHandlerStore.finalizeExits(token.color);
  }

  public render() {
    const caption = `Finalize ${this.props.token.symbol} top exit`;
    return (
      <Button onClick={this.finalize} size="small" disabled={this.disabled}>
        {caption}
      </Button>
    );
  }
}
