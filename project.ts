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
      version: ">=6.1.0",
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
  ],
  repository: "",
};

// Must set default to the project instance
export default project;
