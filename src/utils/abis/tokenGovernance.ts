export default [
  {
    constant: true,
    inputs: [],
    name: 'mvgAddress',
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
    name: 'proposals',
    outputs: [
      {
        name: 'initiator',
        type: 'address',
      },
      {
        name: 'openTime',
        type: 'uint32',
      },
      {
        name: 'finalized',
        type: 'bool',
      },
      {
        name: 'yesVotes',
        type: 'uint256',
      },
      {
        name: 'noVotes',
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
    name: 'leapToken',
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
    inputs: [],
    name: 'vault',
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
    inputs: [
      {
        name: '_mvgAddress',
        type: 'address',
      },
      {
        name: '_leapToken',
        type: 'address',
      },
      {
        name: '_vault',
        type: 'address',
      },
    ],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'constructor',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'proposalHash',
        type: 'bytes32',
      },
      {
        indexed: true,
        name: 'initiator',
        type: 'address',
      },
    ],
    name: 'ProposalRegistered',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'proposalHash',
        type: 'bytes32',
      },
      {
        indexed: true,
        name: 'subject',
        type: 'address',
      },
      {
        indexed: false,
        name: 'weight',
        type: 'uint256',
      },
      {
        indexed: false,
        name: 'txHash',
        type: 'bytes32',
      },
    ],
    name: 'VoiceCasted',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'proposalHash',
        type: 'bytes32',
      },
      {
        indexed: true,
        name: 'subject',
        type: 'address',
      },
      {
        indexed: false,
        name: 'challenger',
        type: 'address',
      },
    ],
    name: 'VoiceChallenged',
    type: 'event',
  },
  {
    anonymous: false,
    inputs: [
      {
        indexed: true,
        name: 'proposalHash',
        type: 'bytes32',
      },
      {
        indexed: false,
        name: 'isApproved',
        type: 'bool',
      },
    ],
    name: 'ProposalFinalized',
    type: 'event',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_proposalHash',
        type: 'bytes32',
      },
    ],
    name: 'registerProposal',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_proposalHash',
        type: 'bytes32',
      },
      {
        name: '_proof',
        type: 'bytes32[]',
      },
      {
        name: '_outputIndex',
        type: 'uint8',
      },
      {
        name: 'isYes',
        type: 'bool',
      },
    ],
    name: 'castVote',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_proposalHash',
        type: 'bytes32',
      },
      {
        name: '_proof',
        type: 'bytes32[]',
      },
      {
        name: '_inputIndex',
        type: 'uint8',
      },
    ],
    name: 'challengeUTXO',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
  {
    constant: false,
    inputs: [
      {
        name: '_proposalHash',
        type: 'bytes32',
      },
    ],
    name: 'finalizeProposal',
    outputs: [],
    payable: false,
    stateMutability: 'nonpayable',
    type: 'function',
  },
];
