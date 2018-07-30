import { observable, action, toJS } from 'mobx';
import memoize from 'memoizee';
import Web3 from 'web3';

let web3Instance;

const getWeb3 = () => {
  if (!web3Instance) {
    web3Instance = new Web3();
    web3Instance.setProvider(
      new web3Instance.providers.HttpProvider(
        'http://ec2-34-254-176-118.eu-west-1.compute.amazonaws.com:8545'
      )
    );
  }

  return web3Instance;
};

const readBlocksInBatch = (fromBlock, toBlock) => {
  const web3 = getWeb3();
  return new Promise(resolve => {
    const batch = new web3.eth.BatchRequest();
    const result = [];
    let received = 0;
    const callback = i => (err, block) => {
      result[i - fromBlock] = block;
      if (received === toBlock - fromBlock) {
        resolve(result);
      }
      received += 1;
    };
    for (let i = fromBlock; i <= toBlock; i += 1) {
      batch.add(web3.eth.getBlock.request(i, true, callback(i)));
    }
    batch.execute();
  });
};

// request once for all stores
const getBlocksRange = memoize((fromBlock, toBlock) => {
  return readBlocksInBatch(fromBlock, toBlock);
});

const loadStore = () => {
  const store = localStorage.getItem(`psc2_store`);
  return (
    (store && JSON.parse(store)) || {
      fromBlock: 0,
      balance: 0,
      loading: true,
    }
  );
};

class BlocksStore {
  @observable blocks = [];
  @observable fromBlock;
  @observable notifications = 0;
  @observable loading;

  constructor() {
    try {
      const { blocks } = loadStore();

      this.blocks = blocks || [];

      this.load(this.fromBlock);
    } catch (error) {
      console.error(error.message);
    }
  }

  @action
  add = block => {
    const index = this.blocks.findIndex(({ number }) => {
      return number === block.number;
    });

    if (index === -1) {
      this.blocks.push(Object.assign({}, block));
    } else {
      this.blocks[index] = block;
    }

    this.loading = false;
    this.notifications = this.notifications + 1;
    this.save();
  };

  // TODO: adjust default fromBlock to get only the recent blocks
  @action
  load = (fromBlock = 0) => {
    const web3 = getWeb3();
    web3.eth
      .getBlockNumber()
      .then(blockNumber => {
        this.fromBlock = blockNumber;
        return getBlocksRange(fromBlock, blockNumber);
      })
      .then(blocks => {
        if (blocks.length) {
          blocks
            .filter(b => b)
            .sort((a, b) => a.timestamp - b.timestamp)
            .map(this.add.bind(this));
        }

        this.save();

        setTimeout(() => {
          this.load(this.fromBlock);
        }, 5000);
      })
      .catch(error => {
        console.error(error);
        setTimeout(() => {
          this.load(fromBlock);
        }, 5000);
      });
  };

  save = () => {
    localStorage.setItem(
      `psc2_store`,
      JSON.stringify({
        blocks: toJS(this.blocks),
        fromBlock: this.fromBlock,
        balance: this.balance,
      })
    );
  };
}

export default BlocksStore;
