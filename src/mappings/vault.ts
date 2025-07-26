import {
  DepositLog as DepositEvent,
  TransferLog as TransferEvent,
  WithdrawLog as WithdrawEvent,
} from "../types/abi-interfaces/Vault";
import {
  Approval,
  Deposit,
  OwnershipTransferStarted,
  OwnershipTransferred,
  PoolAction,
  Transfer,
  UserAction,
  VaultDataEntity,
  Withdraw,
} from "../types/models";
import { handleVaultDeposit, handleVaultWithdraw } from "../entities/vault";
import assert from "assert";
import { ActionType } from "../types";

export async function handleDepositVault(event: DepositEvent) {
  assert(event?.args);
  let entity = Deposit.create({
    id: event.transaction.hash.concat(event.logIndex?.toString()),
    Pool_id: event.address,
    caller: event.args.owner,
    assets: event.args.assets?.toBigInt(),
    shares: event.args.shares?.toBigInt(),
    blockNumber: BigInt(event.block.number),
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
    isVault: true,
  });

  entity.blockNumber = BigInt(event.block.number);
  entity.blockTimestamp = event.block.timestamp;
  entity.transactionHash = event.transaction.hash;
  entity.Pool_id = event.address;
  entity.isVault = true;

  await handleVaultDeposit(event);
  await entity.save();

  let txn = await UserAction.get(
    event.transaction.hash.concat(event.logIndex?.toString())
  );
  const vault = await VaultDataEntity.get(event.address);
  if (!txn && vault) {
    let txn = UserAction.create({
      id: event.transaction.hash.concat(event.logIndex?.toString()),
      action: ActionType.DEPOSIT,
      poolAddress: event.address,
      vaultAddress: event.address,
      vaultId: event.address,
      poolId: event.address,

      shares: event.args.shares?.toBigInt(),
      assets: event.args.assets?.toBigInt(),

      caller: event.args.owner,
      userId: event.args.owner,
      receiver: event.args.owner,

      blockNumber: BigInt(event.block.number),
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,

      isVault: true,
      tokenId: vault.tokenId,
    });

    await txn.save();
  }
}

// export function handleTransfer(event: TransferEvent): void {
//   let entity = new Transfer(
//     event.transaction.hash.concatI32(event.logIndex.toI32())
//   );
//   entity.from = event.args.from;
//   entity.to = event.args.to;
//   entity.value = event.args.value;

//   entity.blockNumber = event.block.number;
//   entity.blockTimestamp = event.block.timestamp;
//   entity.transactionHash = event.transaction.hash;

//   entity.save();
// }

export async function handleWithdrawVault(event: WithdrawEvent) {
  assert(event.args);
  let entity = Withdraw.create({
    id: event.transaction.hash.concat(event.logIndex?.toString()),
    caller: event.args.sender,
    receiver: event.args.receiver,
    assets: event.args.assets?.toBigInt(),
    shares: event.args.shares?.toBigInt(),
    blockNumber: BigInt(event.block.number),
    blockTimestamp: event.block.timestamp,
    transactionHash: event.transaction.hash,
    Pool_id: event.address,
    isVault: true,
  });
  entity.caller = event.args.sender;
  entity.receiver = event.args.receiver;
  entity.receiver = event.args.receiver;

  entity.isVault = true;
  await handleVaultWithdraw(event);
  entity.save();

  let txn = await UserAction.get(
    event.transaction.hash.concat(event.logIndex?.toString())
  );
  const vault = await VaultDataEntity.get(event.address);
  if (!txn && vault) {
    let txn = UserAction.create({
      id: event.transaction.hash.concat(event.logIndex?.toString()),
      action: ActionType.WITHDRAW,
      poolAddress: event.address,
      vaultAddress: event.address,
      vaultId: event.address,
      poolId: event.address,

      shares: event.args.shares?.toBigInt(),
      assets: event.args.assets?.toBigInt(),

      caller: event.args.owner,
      userId: event.args.owner,
      receiver: event.args.receiver,

      blockNumber: BigInt(event.block.number),
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,

      isVault: true,
      tokenId: vault.tokenId,
    });

    txn.blockTimestamp = event.block.timestamp;
    txn.transactionHash = event.transaction.hash;

    txn.tokenId = vault.tokenId;
    txn.isVault = true;

    txn.save();
  }
}
