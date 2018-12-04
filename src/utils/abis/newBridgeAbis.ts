// operator, provider and vault abis combined
// TODO: remove once https://github.com/leapdao/bridge-ui/issues/68 is done
export default [
  {
      "constant": false,
      "inputs": [
          {
              "name": "",
              "type": "address"
          }
      ],
      "name": "registerToken",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "constant": true,
      "inputs": [],
      "name": "exitStake",
      "outputs": [
          {
              "name": "",
              "type": "uint256"
          }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "constant": true,
      "inputs": [],
      "name": "tokenCount",
      "outputs": [
          {
              "name": "",
              "type": "uint256"
          }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "constant": false,
      "inputs": [
          {
              "name": "_exitStake",
              "type": "uint256"
          }
      ],
      "name": "setExitStake",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "constant": true,
      "inputs": [],
      "name": "parentBlockInterval",
      "outputs": [
          {
              "name": "",
              "type": "uint256"
          }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "constant": false,
      "inputs": [
          {
              "name": "_epochLength",
              "type": "uint256"
          }
      ],
      "name": "setEpochLength",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "constant": true,
      "inputs": [],
      "name": "epochLength",
      "outputs": [
          {
              "name": "",
              "type": "uint256"
          }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "constant": false,
      "inputs": [
          {
              "name": "_minGasPrice",
              "type": "uint256"
          }
      ],
      "name": "setMinGasPrice",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "constant": false,
      "inputs": [
          {
              "name": "_parentBlockInterval",
              "type": "uint256"
          }
      ],
      "name": "setParentBlockInterval",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "constant": true,
      "inputs": [],
      "name": "minGasPrice",
      "outputs": [
          {
              "name": "",
              "type": "uint256"
          }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "constant": true,
      "inputs": [],
      "name": "operator",
      "outputs": [
          {
              "name": "",
              "type": "address"
          }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "constant": false,
      "inputs": [],
      "name": "renounceOwnership",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "constant": true,
      "inputs": [],
      "name": "owner",
      "outputs": [
          {
              "name": "",
              "type": "address"
          }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "constant": true,
      "inputs": [],
      "name": "isOwner",
      "outputs": [
          {
              "name": "",
              "type": "bool"
          }
      ],
      "payable": false,
      "stateMutability": "view",
      "type": "function"
  },
  {
      "constant": false,
      "inputs": [
          {
              "name": "_operator",
              "type": "address"
          }
      ],
      "name": "setOperator",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "constant": false,
      "inputs": [
          {
              "name": "newOwner",
              "type": "address"
          }
      ],
      "name": "transferOwnership",
      "outputs": [],
      "payable": false,
      "stateMutability": "nonpayable",
      "type": "function"
  },
  {
      "anonymous": false,
      "inputs": [
          {
              "indexed": true,
              "name": "previousOwner",
              "type": "address"
          },
          {
              "indexed": true,
              "name": "newOwner",
              "type": "address"
          }
      ],
      "name": "OwnershipTransferred",
      "type": "event"
  }
];