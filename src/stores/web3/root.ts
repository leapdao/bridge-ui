import { observable, reaction, action, when } from 'mobx';
import autobind from 'autobind-decorator';
import Web3 from './ts_workaround.js';
import PlasmaConfig from '../plasmaConfig';
import ConnectionStatus from './connectionStatus';

import { KNOWN_NETWORKS } from '../../utils/knownNetworks';

export default class Web3Root {
  @observable
  public provider: { ws: string; http: string };

  @observable
  public name: string;

  @observable
  public etherscanBase: string;

  @observable
  public networkId: string;

  @observable.ref
  public instance: Web3;

  @observable
  public connectionStatus: ConnectionStatus = ConnectionStatus.DISCONNECTED;

  @observable
  public latestBlockNum;

  constructor(public plasmaConfig: PlasmaConfig) {
    if (plasmaConfig.rootNetworkId || plasmaConfig.rootNetwork) {
      this.connect();
    } else {
      reaction(
        () => plasmaConfig.rootNetworkId || plasmaConfig.rootNetwork,
        this.connect
      );
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

  // DEPRECATED. Remove as soon as "rootNetwork" is dropped from NodeConfig
  private getKnownNetworkByProvider(rootNetwork: string) {
    if (rootNetwork.startsWith('http')) {
      const id = Object.keys(KNOWN_NETWORKS).find(
        nId =>
          new URL(KNOWN_NETWORKS[nId].provider.http).host ===
          new URL(rootNetwork).host
      );
      return { id, ...KNOWN_NETWORKS[id] };
    }
  }

  private getKnownNetwork(rootNetworkId: number) {
    if (!KNOWN_NETWORKS[rootNetworkId]) {
      return;
    }
    return { id: rootNetworkId, ...KNOWN_NETWORKS[rootNetworkId] };
  }

  @autobind
  @action
  private connect() {
    const { rootNetwork, rootNetworkId } = this.plasmaConfig;

    const network =
      this.getKnownNetwork(rootNetworkId) ||
      this.getKnownNetworkByProvider(rootNetwork || '');
    if (!network) {
      console.error('Unidentified network:', rootNetworkId);
      return;
    }

    this.provider = network.provider;

    this.name = network.name;
    this.etherscanBase = network.etherscanBase;
    this.networkId = network.id;

    this.connectionStatus = ConnectionStatus.CONNECTING;
    console.log('[root] Connecting to', this.provider.ws);
    const provider = new Web3.providers.WebsocketProvider(this.provider.ws);

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
