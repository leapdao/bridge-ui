/**
 * Copyright (c) 2018-present, Parsec Labs (parseclabs.org)
 *
 * This source code is licensed under the Mozilla Public License Version 2.0
 * found in the LICENSE file in the root directory of this source tree.
 */
import { Contract, BlockType, EventLog } from 'web3/types';
import { EventEmitter } from 'events';
import Web3 from 'web3';

export default class ContractEventsSubscription extends EventEmitter {
  private contract: Contract;
  private web3: Web3;

  private fromBlock: number;
  private intervalId: NodeJS.Timer;

  constructor(contract: Contract, web3: Web3) {
    super();
    this.contract = contract;
    this.web3 = web3;
    this.fromBlock = 0;
  }

  public start() {
    this.intervalId = setInterval(() => this.fetchEvents(), 1000);
    return this;
  }

  public stop() {
    return this.intervalId && clearInterval(this.intervalId);
  }

  private getFromBlock(): Promise<BlockType> {
    if (this.fromBlock > 0) return Promise.resolve(this.fromBlock);

    return this.web3.eth.getBlockNumber().then(blockNumber => {
      this.fromBlock = blockNumber;
      return blockNumber;
    });
  }

  private fetchEvents() {
    this.getFromBlock().then((fromBlock: BlockType) => {
      const options = {
        fromBlock,
        toBlock: 'latest' as BlockType,
      };
      this.contract
        .getPastEvents('allEvents', options)
        .then((events: EventLog[]) => {
          // start with the next block next time
          const latestBlockRead = Math.max(...events.map(e => e.blockNumber));
          this.fromBlock =
            latestBlockRead > 0 ? latestBlockRead + 1 : this.fromBlock;

          // group events by name
          const eventGroups = this.groupByName(events);

          Object.keys(eventGroups).forEach(eventName => {
            eventGroups[eventName].forEach(event => {
              try {
                this.emit(eventName, event);
                this.emit('allEvents', event);
              } catch (e) {
                console.error(e, event); // eslint-disable-line no-console
              }
            });
          });
        });
    });
  }

  private groupByName(events: EventLog[]): Map<string, EventLog[]> {
    return events.reduce(
      (m: Map<string, EventLog[]>, event: EventLog) => {
        const list = m[event.event] || [];
        list.push(event);
        m[event.event] = list;
        return m;
      },
      {} as Map<string, EventLog[]>
    );
  }
}
