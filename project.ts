// Auto-generated , please modify to ensure correctness

import {
  EthereumProject,
  EthereumDatasourceKind,
  EthereumHandlerKind,
} from "@subql/types-ethereum";

// Can expand the Datasource processor types via the generic param
const project: EthereumProject = {
  specVersion: "1.0.0",
  version: "1.2.0",
  name: "aaa",
  description: "",
  runner: {
    node: {
      name: "@subql/node-ethereum",
      version: ">=6.2.0",
    },
    query: {
      name: "@subql/query",
      version: "*",
    },
  },
  schema: {
    file: "./schema.graphql",
  },
  network: {
    chainId: "6342",
    /**
     * These endpoint(s) should be public non-pruned archive node
     * We recommend providing more than one endpoint for improved reliability, performance, and uptime
     * Public nodes may be rate limited, which can affect indexing speed
     * When developing your project we suggest getting a private API key
     * If you use a rate limited endpoint, adjust the --batch-size and --workers parameters
     * These settings can be found in your docker-compose.yaml, they will slow indexing but prevent your project being rate limited
     */
    endpoint: ["https://carrot.megaeth.com/rpc"],
  },
  dataSources: [
    {
      kind: EthereumDatasourceKind.Runtime,
      startBlock: 10803000,
      options: {
        abi: "OrderbookFactory",
        address: "0x80a2c002268906FEC40E6731cf33C9A9EF3e97D6",
      },
      assets: new Map([
        ["Pool", { file: "./abis/Pool.json" }],
        ["Orderbook", { file: "./abis/Orderbook.json" }],
        ["RedStoneOracle", { file: "./abis/RedstoneWrapper.json" }],
        ["RedstoneAdapter", { file: "./abis/RedstoneAdapter.json" }],
        ["OrderbookFactory", { file: "./abis/OrderbookFactory.json" }],
        ["ERC20Fetcher", { file: "./abis/ERC20Fetcher.json" }],
        ["PoolFactory", { file: "./abis/PoolFactory.json" }],
        ["Vault", { file: "./abis/Vault.json" }],
        ["VaultFactory", { file: "./abis/VaultFactory.json" }],
      ]),
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleOrderbookCreated",

            filter: {
              topics: ["OrderbookCreated(address,address,address)"],
            },
          },
        ],
      },
    },
    {
      kind: EthereumDatasourceKind.Runtime,
      startBlock: 10803000,
      options: {
        abi: "PoolFactory",
        address: "0x6fd34F78A0021F9b75ecBa672Bfd0b3475B29d5a",
      },
      assets: new Map([
        ["Pool", { file: "./abis/Pool.json" }],
        ["Orderbook", { file: "./abis/Orderbook.json" }],
        ["RedStoneOracle", { file: "./abis/RedstoneWrapper.json" }],
        ["RedstoneAdapter", { file: "./abis/RedstoneAdapter.json" }],
        ["OrderbookFactory", { file: "./abis/OrderbookFactory.json" }],
        ["ERC20Fetcher", { file: "./abis/ERC20Fetcher.json" }],
        ["PoolFactory", { file: "./abis/PoolFactory.json" }],
        ["Vault", { file: "./abis/Vault.json" }],
        ["VaultFactory", { file: "./abis/VaultFactory.json" }],
      ]),
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: EthereumHandlerKind.Block,
            handler: "handleBlockForPools",
            filter: {
              modulo: 2000,
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handlePoolCreated",
            filter: {
              topics: ["PoolCreated(address,address,address)"],
            },
          },
        ],
      },
    },
    {
      kind: EthereumDatasourceKind.Runtime,
      startBlock: 10803000,
      options: {
        abi: "VaultFactory",
        address: "0x595c417199933898d6e83968F96F5FA5faa36C1f",
      },
      assets: new Map([
        ["Pool", { file: "./abis/Pool.json" }],
        ["Orderbook", { file: "./abis/Orderbook.json" }],
        ["RedStoneOracle", { file: "./abis/RedstoneWrapper.json" }],
        ["RedstoneAdapter", { file: "./abis/RedstoneAdapter.json" }],
        ["OrderbookFactory", { file: "./abis/OrderbookFactory.json" }],
        ["ERC20Fetcher", { file: "./abis/ERC20Fetcher.json" }],
        ["PoolFactory", { file: "./abis/PoolFactory.json" }],
        ["Vault", { file: "./abis/Vault.json" }],
        ["VaultFactory", { file: "./abis/VaultFactory.json" }],
      ]),
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: EthereumHandlerKind.Block,
            handler: "handleBlockForVaults",
            filter: {
              modulo: 2000,
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleVaultCreated",
            filter: {
              topics: ["VaultCreated(address,address,address)"],
            },
          },
        ],
      },
    },
  ],
  templates: [
    {
      name: "Orderbook",
      kind: EthereumDatasourceKind.Runtime,
      options: {
        abi: "Orderbook",
      },

      assets: new Map([
        ["Pool", { file: "./abis/Pool.json" }],
        ["Orderbook", { file: "./abis/Orderbook.json" }],
        ["RedStoneOracle", { file: "./abis/RedstoneWrapper.json" }],
        ["RedstoneAdapter", { file: "./abis/RedstoneAdapter.json" }],
        ["OrderbookFactory", { file: "./abis/OrderbookFactory.json" }],
        ["ERC20Fetcher", { file: "./abis/ERC20Fetcher.json" }],
        ["PoolFactory", { file: "./abis/PoolFactory.json" }],
        ["Vault", { file: "./abis/Vault.json" }],
        ["VaultFactory", { file: "./abis/VaultFactory.json" }],
      ]),
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleBorrowOrderCancelled",
            filter: {
              topics: ["BorrowOrderCanceled(address,uint256,uint256,uint256)"],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleBorrowOrderPlaced",
            filter: {
              topics: [
                "BorrowOrderPlaced(address,uint256,uint256,uint256,uint256)",
              ],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleOrderCanceled",
            filter: {
              topics: ["OrderCanceled(bool,address,uint256,uint256,uint256)"],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleOrderInserted",
            filter: {
              topics: ["OrderInserted(bool,address,uint256,uint256,uint256)"],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleOrderMatched",
            filter: {
              topics: ["OrderMatched(address,address,uint256,uint256,uint256)"],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleOwnershipTransferStarted",
            filter: {
              topics: ["OwnershipTransferStarted(address,address)"],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleOwnershipTransferred",
            filter: {
              topics: ["OwnershipTransferred(address,address)"],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handlePaused",
            filter: { topics: ["Paused(address)"] },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleUnpaused",
            filter: { topics: ["Unpaused(address)"] },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handlePoolWhitelisted",
            filter: { topics: ["PoolWhitelisted(address)"] },
          },
        ],
      },
    },
    {
      name: "Pool",
      kind: EthereumDatasourceKind.Runtime,
      options: {
        abi: "Pool",
      },

      assets: new Map([
        ["Pool", { file: "./abis/Pool.json" }],
        ["Orderbook", { file: "./abis/Orderbook.json" }],
        ["RedStoneOracle", { file: "./abis/RedstoneWrapper.json" }],
        ["RedstoneAdapter", { file: "./abis/RedstoneAdapter.json" }],
        ["OrderbookFactory", { file: "./abis/OrderbookFactory.json" }],
        ["ERC20Fetcher", { file: "./abis/ERC20Fetcher.json" }],
        ["PoolFactory", { file: "./abis/PoolFactory.json" }],
        ["Vault", { file: "./abis/Vault.json" }],
        ["VaultFactory", { file: "./abis/VaultFactory.json" }],
      ]),
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleAccrueInterest",
            filter: {
              topics: ["AccrueInterest(address,uint256,uint256,uint256)"],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleApproval",
            filter: {
              topics: ["Approval(address,address,uint256)"],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleBorrow",
            filter: {
              topics: [
                "Borrow(address,address,address,address,uint256,uint256)",
              ],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleDeposit",
            filter: {
              topics: ["Deposit(address,address,uint256,uint256)"],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleFlashLoan",
            filter: {
              topics: ["FlashLoan(address,address,uint256)"],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleLiquidate",
            filter: {
              topics: [
                "Liquidate(address,address,address,uint256,uint256,uint256,uint256,uint256)",
              ],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleRepay",
            filter: {
              topics: ["Repay(address,address,address,uint256,uint256)"],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleSupplyCollateral",
            filter: {
              topics: ["DepositCollateral(address,address,address,uint256)"],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleTransfer",
            filter: {
              topics: ["Transfer(address,address,uint256)"],
            },
          },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleWithdraw",
            filter: {
              topics: [
                "Withdraw(address indexed, address, address indexed, uint256, uint256)",
              ],
            },
          },
          // {
          //   kind: EthereumHandlerKind.Event,
          //   handler: "handleWithdraw1",
          //   filter: {
          //     topics: [
          //       "Withdraw(address indexed,address indexed,address indexed,uint256,uint256)",
          //     ],
          //   },
          // },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleWithdrawCollateral",
            filter: {
              topics: [
                "WithdrawCollateral(address,address,address,address,uint256)",
              ],
            },
          },
        ],
      },
    },
    {
      name: "Vault",
      kind: EthereumDatasourceKind.Runtime,
      options: {
        abi: "Vault",
      },

      assets: new Map([
        ["Pool", { file: "./abis/Pool.json" }],
        ["Orderbook", { file: "./abis/Orderbook.json" }],
        ["RedStoneOracle", { file: "./abis/RedstoneWrapper.json" }],
        ["RedstoneAdapter", { file: "./abis/RedstoneAdapter.json" }],
        ["OrderbookFactory", { file: "./abis/OrderbookFactory.json" }],
        ["ERC20Fetcher", { file: "./abis/ERC20Fetcher.json" }],
        ["PoolFactory", { file: "./abis/PoolFactory.json" }],
        ["Vault", { file: "./abis/Vault.json" }],
        ["VaultFactory", { file: "./abis/VaultFactory.json" }],
      ]),
      mapping: {
        file: "./dist/index.js",
        handlers: [
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleDepositVault",
            filter: {
              topics: ["Deposit(address,address,uint256,uint256)"],
            },
          },
          // {
          //   kind: EthereumHandlerKind.Event,
          //   handler: "handleTransfer",
          //   filter: {
          //     topics: ["Transfer(address,address,uint256)"],
          //   },
          // },
          {
            kind: EthereumHandlerKind.Event,
            handler: "handleWithdrawVault",
            filter: {
              topics: ["Withdraw(address,address,address,uint256,uint256)"],
            },
          },
        ],
      },
    },
  ],
  repository: "",
};

// Must set default to the project instance
export default project;
