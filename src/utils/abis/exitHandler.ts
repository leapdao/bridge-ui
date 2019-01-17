import { ABIDefinition } from 'web3-eth-abi';

export default [
  {
    constant: true,
    inputs: [],
    name: 'depositCount',
    outputs: [
      {
        name: '',
        type: 'uint32',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'exitStake',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '',
        type: 'uint32',
      },
    ],
    name: 'deposits',
    outputs: [
      {
        name: 'height',
        type: 'uint64',
      },
      {
        name: 'color',
        type: 'uint16',
      },
      {
        name: 'owner',
        type: 'address',
      },
      {
        name: 'amount',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_token',
        type: 'address',
      },
      {
        name: '_isERC721',
        type: 'bool',
      },
    ],
    name: 'registerToken',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'nftTokenCount',
    outputs: [
      {
        name: '',
        type: 'uint16',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'nftExitCounter',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'exitDuration',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'erc20TokenCount',
    outputs: [
      {
        name: '',
        type: 'uint16',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_bridge',
        type: 'address',
      },
    ],
    name: 'initialize',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_owner',
        type: 'address',
      },
      {
        name: '_amountOrTokenId',
        type: 'uint256',
      },
      {
        name: '_color',
        type: 'uint16',
      },
    ],
    name: 'deposit',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '_color',
        type: 'uint16',
      },
    ],
    name: 'getTokenAddr',
    outputs: [
      {
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'bridge',
    outputs: [
      {
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '',
        type: 'address',
      },
    ],
    name: 'tokenColors',
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '',
        type: 'uint16',
      },
    ],
    name: 'tokens',
    outputs: [
      {
        name: 'addr',
        type: 'address',
      },
      {
        name: 'currentSize',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [],
    name: 'admin',
    outputs: [
      {
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    constant: true,
    inputs: [
      {
        name: '',
        type: 'bytes32',
      },
    ],
    name: 'exits',
    outputs: [
      {
        name: 'amount',
        type: 'uint256',
      },
      {
        name: 'color',
        type: 'uint16',
      },
      {
        name: 'owner',
        type: 'address',
      },
      {
        name: 'finalized',
        type: 'bool',
      },
      {
        name: 'priorityTimestamp',
        type: 'uint32',
      },
      {
        name: 'stake',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'txHash',
        type: 'bytes32',
      },
      {
        indexed: true,
        name: 'outIndex',
        type: 'uint256',
      },
      {
        indexed: true,
        name: 'color',
        type: 'uint256',
      },
      {
        indexed: false,
        name: 'exitor',
        type: 'address',
      },
      {
        indexed: false,
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'ExitStarted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: false,
        name: 'data',
        type: 'bytes',
      },
    ],
    name: 'Debug',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'depositId',
        type: 'uint32',
      },
      {
        indexed: true,
        name: 'depositor',
        type: 'address',
      },
      {
        indexed: true,
        name: 'color',
        type: 'uint256',
      },
      {
        indexed: false,
        name: 'amount',
        type: 'uint256',
      },
    ],
    name: 'NewDeposit',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'tokenAddr',
        type: 'address',
      },
      {
        indexed: false,
        name: 'color',
        type: 'uint16',
      },
    ],
    name: 'NewToken',
    type: 'event',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_bridge',
        type: 'address',
      },
      {
        name: '_exitDuration',
        type: 'uint256',
      },
      {
        name: '_exitStake',
        type: 'uint256',
      },
    ],
    name: 'initializeWithExit',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_exitStake',
        type: 'uint256',
      },
    ],
    name: 'setExitStake',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_youngestInputProof',
        type: 'bytes32[]',
      },
      {
        name: '_proof',
        type: 'bytes32[]',
      },
      {
        name: '_outputIndex',
        type: 'uint256',
      },
      {
        name: '_inputIndex',
        type: 'uint256',
      },
    ],
    name: 'startExit',
    outputs: [],
    payable: true,
    stateMutability: 'payable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_color',
        type: 'uint16',
      },
    ],
    name: 'finalizeTopExit',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_proof',
        type: 'bytes32[]',
      },
      {
        name: '_prevProof',
        type: 'bytes32[]',
      },
      {
        name: '_outputIndex',
        type: 'uint256',
      },
      {
        name: '_inputIndex',
        type: 'uint256',
      },
    ],
    name: 'challengeExit',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_youngerInputProof',
        type: 'bytes32[]',
      },
      {
        name: '_exitingTxProof',
        type: 'bytes32[]',
      },
      {
        name: '_outputIndex',
        type: 'uint256',
      },
      {
        name: '_inputIndex',
        type: 'uint256',
      },
    ],
    name: 'challengeYoungestInput',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
] as ABIDefinition[];
