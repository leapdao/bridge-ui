export default [
  {
    constant: true,
    inputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    name: 'proposals',
    outputs: [
      {
        name: 'subject',
        type: 'address',
      },
      {
        name: 'created',
        type: 'uint32',
      },
      {
        name: 'canceled',
        type: 'bool',
      },
      {
        name: 'msgData',
        type: 'bytes',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'proposalTime',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'first',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [],
    name: 'renounceOwnership',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'owner',
    outputs: [
      {
        name: '',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'isOwner',
    outputs: [
      {
        name: '',
        type: 'bool',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: true,
    inputs: [],
    name: 'size',
    outputs: [
      {
        name: '',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'view',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'transferOwnership',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    inputs: [
      {
        name: '_proposalTime',
        type: 'uint256',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'proposalId',
        type: 'uint256',
      },
      {
        indexed: true,
        name: 'subject',
        type: 'address',
      },
      {
        indexed: false,
        name: 'msgData',
        type: 'bytes',
      },
    ],
    name: 'NewProposal',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'proposalId',
        type: 'uint256',
      },
      {
        indexed: true,
        name: 'subject',
        type: 'address',
      },
      {
        indexed: false,
        name: 'msgData',
        type: 'bytes',
      },
    ],
    name: 'Execution',
    type: 'event'
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'previousOwner',
        type: 'address',
      },
      {
        indexed: true,
        name: 'newOwner',
        type: 'address',
      },
    ],
    name: 'OwnershipTransferred',
    type: 'event'
  },
  {
    constant: false,
    inputs: [
      {
        name: '_subject',
        type: 'address',
      },
      {
        name: '_msgData',
        type: 'bytes',
      },
    ],
    name: 'propose',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: '_proposalId',
        type: 'uint256',
      },
    ],
    name: 'cancel',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: '_token',
        type: 'address',
      },
    ],
    name: 'withdrawTax',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [],
    name: 'finalize',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
  {
    constant: false,
    inputs: [
      {
        name: '_slotId',
        type: 'uint256',
      },
      {
        name: '',
        type: 'address',
      },
      {
        name: '',
        type: 'bytes32',
      },
    ],
    name: 'setSlot',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function'
  },
];
