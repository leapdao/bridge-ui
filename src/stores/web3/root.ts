import { observable, reaction, action, when } from 'mobx';
import autobind from 'autobind-decorator';
import Web3 from './ts_workaround.js';
import PlasmaConfig from '../plasmaConfig';
import ConnectionStatus from './connectionStatus';

const wssfy = (url) => url.replace(/https?(.+)\/?/, 'wss$1/ws');

export default class Web3Root {
  @observable.ref
  public instance: Web3;

  @observable
  public connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;

  @observable
  public latestBlockNum;

  constructor(
    public plasmaConfig: PlasmaConfig,
  ) {
    if (plasmaConfig.rootNetwork) {
      this.connect();
    } else {
      reaction(() => plasmaConfig.rootNetwork, this.connect);
    }
  
    const updateRootBlock = blockNumber => {
      this.latestBlockNum = Number(blockNumber);
    };

    const fetchLatestBlock = () => {
      this.instance.eth.getBlockNumber().then(updateRootBlock);
    };

    when(
      () => !!this.instance,
      () => {
        fetchLatestBlock();
        setInterval(fetchLatestBlock, 15000);
      }
    );
  }

  @autobind
  private connect() {
    if (!this.plasmaConfig) return;
    
    const wsUrl = wssfy(this.plasmaConfig.rootNetwork);
    
    this.connectionStatus = ConnectionStatus.CONNECTING;
    console.log('[root] Connecting to', wsUrl);
    const provider = new Web3.providers.WebsocketProvider(wsUrl);

    provider.on('error', () => {
      console.error('[root] connection error');
      this.connectionStatus = ConnectionStatus.DISCONNECTED;
    });

    provider.on('connect', () => {
      console.log('[root] connected');
      this.connectionStatus = ConnectionStatus.CONNECTED;
    });

    provider.on('end', () => {
      console.error('[root] web3 disconnected. Reconnecting...');
      return this.connect();
    });

    this.instance = new Web3(provider);
  }
}
