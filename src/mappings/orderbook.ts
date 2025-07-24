import assert from "assert";
import {
  BorrowOrderCanceledLog as BorrowOrderCancelledEvent,
  BorrowOrderPlacedLog as BorrowOrderPlacedEvent,
  OrderCanceledLog as OrderCanceledEvent,
  OrderInsertedLog as OrderInsertedEvent,
  OrderMatchedLog as OrderMatchedEvent,
  OwnershipTransferStartedLog as OwnershipTransferStartedEvent,
  OwnershipTransferredLog as OwnershipTransferredEvent,
  PausedLog as PausedEvent,
  PoolWhitelistedLog as PoolWhitelisted,
  UnpausedLog as UnpausedEvent,
} from "../types/abi-interfaces/Orderbook";
import {
  BorrowOrderCancelled,
  BorrowOrderPlaced,
  OrderCanceled,
  OrderInserted,
  OrderMatched,
  OwnershipTransferStarted,
  OwnershipTransferred,
  Paused,
  PoolCreated,
  PoolDataEntity,
  PoolFactory,
  PoolManagerSet,
  Unpaused,
} from "../types/models";

import { ONE_BI } from "../utils/constants";

export async function handleBorrowOrderCancelled(
  event: BorrowOrderCancelledEvent
) {
  assert(event.args);

  let entity = BorrowOrderCancelled.create({
    id: event.transaction.hash.concat(event.logIndex?.toString()),
    amount: BigInt(event.args.amount?.toNumber()),
    blockNumber: BigInt(event.block.number),
    blockTimestamp: event.block.timestamp,
    borrower: event.args.borrower,
    ltv: event.args.ltv?.toBigInt(),
    rate: event.args.rate?.toBigInt(),
    transactionHash: event.transaction.hash,
  });
  entity.borrower = event.args.borrower;
  entity.rate = event.args.rate?.toBigInt();
  entity.ltv = event.args.ltv?.toBigInt();
  entity.amount = event.args.amount?.toBigInt();

  entity.blockNumber = BigInt(event.block.number);
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;

  await entity.save();
}

export async function handleBorrowOrderPlaced(event: BorrowOrderPlacedEvent) {
  assert(event.args);

  let entity = BorrowOrderPlaced.create({
    id: event.transaction.hash.concat(event.logIndex?.toString()),
    borrower: event.args.borrower,
    rate: event.args.rate?.toBigInt(),
    ltv: event.args.ltv?.toBigInt(),
    amount: BigInt(event.args.amount?.toNumber()),
    minAmountExpected: event.args.minAmountExpected?.toBigInt(),
    blockNumber: BigInt(event.block.number),
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });

  await entity.save();
}

export async function handleOrderCanceled(event: OrderCanceledEvent) {
  assert(event.args);

  let entity = OrderCanceled.create({
    id: event.transaction.hash.concat(event.logIndex?.toString()),
    isLender: event.args!.isLender,
    maker: event.args!.maker,
    rate: event.args.rate?.toBigInt(),
    ltv: event.args.ltv?.toBigInt(),
    amount: BigInt(event.args.amount?.toNumber()),

    blockNumber: BigInt(event.block.number),
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });

  await entity.save();
}

export async function handleOrderInserted(event: OrderInsertedEvent) {
  assert(event.args);
  let entity = OrderInserted.create({
    id: event.transaction.hash.concat(event.logIndex?.toString()),
    isLender: event.args!.isLender,
    maker: event.args!.maker,
    rate: event.args.rate?.toBigInt(),
    ltv: event.args.ltv?.toBigInt(),
    amount: BigInt(event.args.amount?.toNumber()),

    blockNumber: BigInt(event.block.number),
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });

  await entity.save();
}

export async function handleOrderMatched(event: OrderMatchedEvent) {
  assert(event.args);

  let entity = OrderMatched.create({
    id: event.transaction.hash.concat(event.logIndex?.toString()),
    lender: event.args!.lender,
    borrower: event.args!.borrower,
    rate: event.args.rate?.toBigInt(),
    ltv: event.args.ltv?.toBigInt(),
    amount: BigInt(event.args.amount?.toNumber()),

    blockNumber: BigInt(event.block.number),
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });

  await entity.save();
}

export async function handleOwnershipTransferStarted(
  event: OwnershipTransferStartedEvent
) {
  assert(event.args);

  let entity = OwnershipTransferStarted.create({
    id: event.transaction.hash.concat(event.logIndex?.toString()),
    previousOwner: event.args!.previousOwner,
    newOwner: event.args!.newOwner,

    blockNumber: BigInt(event.block.number),
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });

  await entity.save();
}

export async function handleOwnershipTransferred(
  event: OwnershipTransferredEvent
) {
  assert(event.args);

  let entity = OwnershipTransferred.create({
    id: event.transaction.hash.concat(event.logIndex?.toString()),
    previousOwner: event.args!.previousOwner,
    newOwner: event.args!.newOwner,

    blockNumber: BigInt(event.block.number),
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });

  await entity.save();
}

export async function handlePaused(event: PausedEvent) {
  assert(event.args);

  let entity = Paused.create({
    id: event.transaction.hash.concat(event.logIndex?.toString()),
    account: event.args!.account,

    blockNumber: BigInt(event.block.number),
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });

  await entity.save();
}

export async function handleUnpaused(event: UnpausedEvent) {
  assert(event.args);

  let entity = Unpaused.create({
    id: event.transaction.hash.concat(event.logIndex?.toString()),
    account: event.args!.account,

    blockNumber: BigInt(event.block.number),
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
  });

  await entity.save();
}
export async function handlePoolWhitelisted(event: PoolWhitelisted) {
  assert(event.args);
  const pool = await PoolDataEntity.get(event.args.pool);
  let poolFactory = await PoolFactory.get(ONE_BI.toString());

  if (pool && pool !== null) {
    pool.isWhitelisted = true;
    pool.orderbookId = event.address;
    if (poolFactory && poolFactory !== null) {
      poolFactory.totalWhitelistedPools =
        poolFactory.totalWhitelistedPools + ONE_BI;
      poolFactory.save();
    }
    await pool.save();
  }
}
