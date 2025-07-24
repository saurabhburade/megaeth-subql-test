import assert from "assert";
import { createOrderbookDatasource, OrderbookCreated, Token } from "./types";
import { OrderbookCreatedLog } from "./types/abi-interfaces/OrderbookFactory";
import {
  ERC20Fetcher__factory,
  Orderbook__factory,
} from "./types/contracts/factories";
import { OrderbookCreatedEvent } from "./types/contracts/OrderbookFactory";

import { MULTICALL_ERC20, ZERO_BD } from "./utils/constants";

export async function handleOrderbookCreated(event: OrderbookCreatedLog) {
  assert(event.args);

  let entity = OrderbookCreated.create({
    id: event.args!.orderbook!,
    blockNumber: BigInt(event.blockNumber),
    blockTimestamp: event.block.timestamp,
    collateralToken: event.args?.collateralToken!,
    loanToken: event.args?.loanToken!,
    orderbook: event.args?.orderbook!,
    transactionHash: event.transactionHash,
  });

  if (
    event.args?.orderbook.toString().toLowerCase() ==
      "0x3935d184298cc7c765417c46f7d211202f7141a1" ||
    event.args?.orderbook.toString().toLowerCase() ==
      "0x8536cf9fec2a040a2f6f96155e4e4a772576c2c9"
  ) {
    logger.info("Skip datasource from wrong param ob {}", [
      event.args.orderbook.toString(),
    ]);
  } else {
    logger.info("handleOrderbookCreated {}", [
      event.args?.orderbook.toString(),
    ]);
    // OrderbookTemplate.create(event.args?.orderbook);
    createOrderbookDatasource({
      address: event.args?.orderbook,
    });
  }

  entity.loanToken = event.args?.loanToken!;
  entity.collateralToken = event.args!.collateralToken;
  entity.orderbook = event.args!.orderbook;

  entity.blockNumber = BigInt(event.block.number);
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  let loantoken = await Token.get(event.args!.loanToken);
  const multicallErc20Contract = ERC20Fetcher__factory.connect(
    MULTICALL_ERC20,
    api
  );
  const tokenBasicDetails = await multicallErc20Contract.getTokenDetails([
    event.args!.loanToken,
    event.args!.collateralToken,
  ]);
  if (!loantoken) {
    logger.info(
      "ORDERBOOK CREATED :: FOR LOAN TOKEN ADDRESS:{} NAME:{} SYMBOL:{} DECIMALS:{}",
      [
        event.args!.loanToken.toString(),
        tokenBasicDetails[0].name,
        tokenBasicDetails[0].symbol,
        tokenBasicDetails[0].decimals,
      ]
    );

    loantoken = Token.create({
      id: event.args!.loanToken,

      address: event.args!.loanToken,
      blockNumber: BigInt(event.blockNumber),
      blockTimestamp: event.block.timestamp,
      decimals: BigInt(tokenBasicDetails[0].decimals),
      name: tokenBasicDetails[0].name,
      rate: ZERO_BD,
      symbol: tokenBasicDetails[0].symbol,
      transactionHash: event.transaction.hash,
      updatedAt: event.block.timestamp,
    });
    loantoken.decimals = BigInt(tokenBasicDetails[0].decimals);
    loantoken.name = tokenBasicDetails[0].name;
    loantoken.symbol = tokenBasicDetails[0].symbol;
    loantoken.address = event.args!.loanToken;
    loantoken.rate = ZERO_BD;
    loantoken.dataFeedId = event.args!.loanToken;
    loantoken.updatedAt = event.block.timestamp;
    loantoken.blockNumber = BigInt(event.block.number);
    loantoken.blockTimestamp = event.block.timestamp;
    loantoken.transactionHash = event.transaction.hash;
    await loantoken.save();
  }
  let collateralToken = await Token.get(event.args!.collateralToken);
  if (!collateralToken) {
    logger.info(
      "ORDERBOOK CREATED :: FOR COLLATERAL TOKEN ADDRESS:{} NAME:{} SYMBOL:{} DECIMALS:{}",
      [
        event.args!.collateralToken.toString(),
        tokenBasicDetails[1].name,
        tokenBasicDetails[1].symbol,
        tokenBasicDetails[1].decimals,
      ]
    );

    collateralToken = Token.create({
      id: event.args!.collateralToken,

      address: event.args!.collateralToken,
      blockNumber: BigInt(event.blockNumber),
      blockTimestamp: event.block.timestamp,
      decimals: BigInt(tokenBasicDetails[1].decimals),
      name: tokenBasicDetails[1].name,
      rate: ZERO_BD,
      symbol: tokenBasicDetails[1].symbol,
      transactionHash: event.transaction.hash,
      updatedAt: event.block.timestamp,
    });
    collateralToken.decimals = BigInt(tokenBasicDetails[1].decimals);
    collateralToken.decimals = BigInt(tokenBasicDetails[1].decimals);
    collateralToken.name = tokenBasicDetails[1].name;
    collateralToken.symbol = tokenBasicDetails[1].symbol;
    collateralToken.address = event.args!.collateralToken;
    collateralToken.rate = ZERO_BD;
    collateralToken.dataFeedId = event.args!.collateralToken;
    collateralToken.updatedAt = event.block.timestamp;
    collateralToken.blockNumber = BigInt(event.block.number);
    collateralToken.blockTimestamp = event.block.timestamp;
    collateralToken.transactionHash = event.transaction.hash;
    await collateralToken.save();
  }
  await entity.save();
}
