import {
  Token,
  UserDataEntity,
  UserDataVaultDayEntity,
  UserDataVaultEntity,
  UserDataVaultHourEntity,
  VaultDataDayEntity,
  VaultDataEntity,
  VaultDataHourEntity,
} from "../types/models";
import {
  ApprovalLog as ApprovalEvent,
  DepositLog as DepositEvent,
  OwnershipTransferStartedLog as OwnershipTransferStartedEvent,
  OwnershipTransferredLog as OwnershipTransferredEvent,
  PoolFactorySetLog as PoolFactorySetEvent,
  PoolManagerChangedLog as PoolManagerChangedEvent,
  QueueEntryAddedLog as QueueEntryAddedEvent,
  QueueEntryRemovedLog as QueueEntryRemovedEvent,
  QueueEntryUpdatedLog as QueueEntryUpdatedEvent,
  QueueResetLog as QueueResetEvent,
  RelocatedLiquidityLog as RelocatedLiquidityEvent,
  RemovedLiquidityLog as RemovedLiquidityEvent,
  TransferLog as TransferEvent,
  WithdrawLog as WithdrawEvent,
} from "../types/abi-interfaces/Vault";
import { ZERO_BD, ZERO_BI } from "../utils/constants";
import { BigNumber } from "ethers";
import assert from "assert";
export async function handleVaultDeposit(event: DepositEvent) {
  assert(event?.args);
  let vaultEntity = await VaultDataEntity.get(event.address);
  if (vaultEntity) {
    vaultEntity.totalAssets = BigNumber.from(vaultEntity.totalAssets)
      .add(event.args.assets)
      ?.toBigInt();
    vaultEntity.totalDepositsVolume = BigNumber.from(
      vaultEntity.totalDepositsVolume
    )
      .add(event.args.assets)
      ?.toBigInt();

    vaultEntity.totalShares = BigNumber.from(vaultEntity.totalShares)
      .add(event.args.shares)
      ?.toBigInt();
    await vaultEntity.save();
    await handleDayDataVault(vaultEntity, event.block.timestamp);
    await handleHourDataVault(vaultEntity, event.block.timestamp);
    await handleUserVaultDeposit(event);
  }
}
export async function handleUserVaultDeposit(event: DepositEvent) {
  assert(event?.args);

  const userVaultId = event.args.owner.concat("_").concat(event.address);

  let user = await UserDataEntity.get(event.args.owner);
  if (!user) {
    user = UserDataEntity.create({
      id: event.args.owner,
      timestamp: event.block.timestamp,
      lastUpdate: event.block.timestamp,
      totalDepositsVolume: ZERO_BI,
      totalWithdrawalsVolume: ZERO_BI,
      totalBorrowVolume: ZERO_BI,
      totalRepayVolume: ZERO_BI,
      totalSupplyCollateralVolume: ZERO_BI,
      totalWithdrawCollateralVolume: ZERO_BI,
    });
  }
  user.totalDepositsVolume = BigNumber.from(user.totalDepositsVolume)
    .add(event.args.assets)
    ?.toBigInt();
  user.save();
  let userVaultEntity = await UserDataVaultEntity.get(userVaultId);
  if (!userVaultEntity) {
    userVaultEntity = UserDataVaultEntity.create({
      id: userVaultId,
      timestamp: event.block.timestamp,
      totalDepositsVolume: ZERO_BI,
      totalWithdrawalsVolume: ZERO_BI,
      depositedAssets: ZERO_BI,
      depositedShares: ZERO_BI,
      userId: event.args.owner,
      vaultId: event.address,
    });
  }
  userVaultEntity.userId = event.args.owner;
  userVaultEntity.vaultId = event.address;

  // Handle user action

  userVaultEntity.depositedAssets = BigNumber.from(
    userVaultEntity.depositedAssets
  )
    .add(event.args.assets)
    ?.toBigInt();
  userVaultEntity.totalDepositsVolume = BigNumber.from(
    userVaultEntity.totalDepositsVolume
  )
    .add(event.args.assets)
    ?.toBigInt();

  userVaultEntity.depositedShares = BigNumber.from(
    userVaultEntity.depositedShares
  )
    .add(event.args.shares)
    ?.toBigInt();
  await userVaultEntity.save();
  await handleUserDayDataVault(userVaultEntity, event.block.timestamp);
  await handleUserHourDataVault(userVaultEntity, event.block.timestamp);
}
export async function handleUserVaultWithdraw(event: WithdrawEvent) {
  assert(event?.args);
  const userVaultId = event.args.owner.concat("_").concat(event.address);
  let user = await UserDataEntity.get(event.args.owner);
  if (!user) {
    user = UserDataEntity.create({
      id: event.args.owner,
      timestamp: event.block.timestamp,
      lastUpdate: event.block.timestamp,
      totalDepositsVolume: ZERO_BI,
      totalWithdrawalsVolume: ZERO_BI,
      totalBorrowVolume: ZERO_BI,
      totalRepayVolume: ZERO_BI,
      totalSupplyCollateralVolume: ZERO_BI,
      totalWithdrawCollateralVolume: ZERO_BI,
    });
  }
  user.totalWithdrawalsVolume = BigNumber.from(user.totalWithdrawalsVolume)
    .add(event.args.assets)
    ?.toBigInt();
  await user.save();
  let userVaultEntity = await UserDataVaultEntity.get(userVaultId);
  if (!userVaultEntity) {
    userVaultEntity = UserDataVaultEntity.create({
      id: userVaultId,
      timestamp: event.block.timestamp,
      totalDepositsVolume: ZERO_BI,
      totalWithdrawalsVolume: ZERO_BI,
      depositedAssets: ZERO_BI,
      depositedShares: ZERO_BI,
      userId: event.args.owner,
      vaultId: event.address,
    });
  }
  userVaultEntity.userId = event.args.owner;
  userVaultEntity.vaultId = event.address;

  // Handle user action
  // check negative op

  if (
    BigNumber.from(userVaultEntity.depositedAssets)
      .sub(event.args.assets)
      .gt(ZERO_BI)
  ) {
    userVaultEntity.depositedAssets = BigNumber.from(
      userVaultEntity.depositedAssets
    )
      .sub(event.args.assets)
      ?.toBigInt();
  } else {
    userVaultEntity.depositedAssets = ZERO_BI;
  }

  if (
    BigNumber.from(userVaultEntity.depositedShares)
      .sub(event.args.shares)
      .gt(ZERO_BI)
  ) {
    userVaultEntity.depositedShares = BigNumber.from(
      userVaultEntity.depositedShares
    )
      .sub(event.args.shares)
      ?.toBigInt();
  } else {
    userVaultEntity.depositedShares = ZERO_BI;
  }
  userVaultEntity.totalWithdrawalsVolume = BigNumber.from(
    userVaultEntity.totalWithdrawalsVolume
  )
    .add(event.args.assets)
    ?.toBigInt();
  await handleUserDayDataVault(userVaultEntity, event.block.timestamp);
  await handleUserHourDataVault(userVaultEntity, event.block.timestamp);

  await userVaultEntity.save();
}
export async function handleVaultWithdraw(event: WithdrawEvent) {
  assert(event.args);
  let vaultEntity = await VaultDataEntity.get(event.address);
  if (vaultEntity) {
    //   check if assets become negative, fallback to 0
    if (BigNumber.from(vaultEntity.totalAssets).sub(event.args.assets).gt(0)) {
      vaultEntity.totalAssets = BigNumber.from(vaultEntity.totalAssets)
        .sub(event.args.assets)
        ?.toBigInt();
    } else {
      vaultEntity.totalAssets = ZERO_BI;
    }
    //   check if shares become negative, fallback to 0
    if (BigNumber.from(vaultEntity.totalShares).sub(event.args.shares).gt(0)) {
      vaultEntity.totalShares = BigNumber.from(vaultEntity.totalShares)
        .sub(event.args.shares)
        ?.toBigInt();
    } else {
      vaultEntity.totalShares = ZERO_BI;
    }
    vaultEntity.totalWithdrawalsVolume = BigNumber.from(
      vaultEntity.totalWithdrawalsVolume
    )
      .add(event.args.assets)
      ?.toBigInt();
    vaultEntity.lastUpdate = event.block.timestamp;
    await vaultEntity.save();
    await handleDayDataVault(vaultEntity, event.block.timestamp);
    await handleHourDataVault(vaultEntity, event.block.timestamp);
    await handleUserVaultWithdraw(event);
  }
}

export async function handleHourDataVault(
  vaultEntity: VaultDataEntity,
  timestamp: BigInt
) {
  let hourID = BigInt(
    BigNumber.from(timestamp).div(3600).toNumber().toFixed(0)
  );
  let pHourID = BigInt(
    BigNumber.from(BigInt(timestamp?.toString()) - BigInt(3600))
      .div(3600)
      .toNumber()
      .toFixed(0)
  );

  let intervalEntityId = vaultEntity.id

    .concat("_HOUR_")
    .concat(hourID.toString());
  let intervalEntityIdPrev = vaultEntity.id

    .concat("_HOUR_")
    .concat(pHourID.toString());

  let vaultIntervalData = await VaultDataHourEntity.get(intervalEntityId);

  if (!vaultIntervalData) {
    vaultIntervalData = VaultDataHourEntity.create({
      id: intervalEntityId,
      hourId: hourID,
      timestamp: BigInt(timestamp?.toString()),
      depositApy: ZERO_BI,
      convertToAssetsMultiplier: ZERO_BD,
      totalDepositsVolume: ZERO_BI,
      totalWithdrawalsVolume: ZERO_BI,
      totalAssets: ZERO_BI,
      totalShares: ZERO_BI,
      vaultId: vaultEntity.id,
      updatedAt: BigInt(timestamp?.toString()),
      prevHourDataId: intervalEntityIdPrev,
    });
    vaultIntervalData.hourId = hourID;

    vaultIntervalData.updatedAt = BigInt(timestamp?.toString());
    vaultIntervalData.depositApy = vaultEntity.depositApy;
    vaultIntervalData.timestamp = BigInt(timestamp?.toString());
    vaultIntervalData.vaultId = vaultEntity.id;
  }
  vaultIntervalData.depositApy = vaultEntity.depositApy;

  vaultIntervalData.totalDepositsVolume = vaultEntity.totalDepositsVolume;
  vaultIntervalData.totalWithdrawalsVolume = vaultEntity.totalWithdrawalsVolume;
  vaultIntervalData.totalAssets = vaultEntity.totalAssets;
  vaultIntervalData.totalShares = vaultEntity.totalShares;
  vaultIntervalData.convertToAssetsMultiplier =
    vaultEntity.convertToAssetsMultiplier;
  vaultIntervalData.updatedAt = BigInt(timestamp?.toString());
  vaultIntervalData.prevHourDataId = intervalEntityIdPrev;
  if (vaultEntity.tokenId) {
    const loadedToken = await Token.get(vaultEntity.tokenId);
    if (loadedToken !== null) {
      let intervalEntityId = vaultEntity.tokenId
        .concat("_HOUR_")
        .concat(hourID.toString());
      vaultIntervalData.tokenHourDataId = intervalEntityId;
    }
  }
  vaultIntervalData.save();
}

export async function handleDayDataVault(
  vaultEntity: VaultDataEntity,
  timestamp: BigInt
) {
  let dayID = BigNumber.from(timestamp).div(86400)?.toBigInt();
  let pdayID = BigNumber.from(timestamp).sub(86400).div(86400)?.toBigInt();

  let intervalEntityId = vaultEntity.id

    .concat("_DAY_")
    .concat(dayID.toString());
  let intervalEntityIdPrev = vaultEntity.id

    .concat("_DAY_")
    .concat(pdayID.toString());

  let vaultIntervalData = await VaultDataDayEntity.get(intervalEntityId);

  if (!vaultIntervalData) {
    vaultIntervalData = VaultDataDayEntity.create({
      id: intervalEntityId,
      dayId: dayID,
      timestamp: BigInt(timestamp?.toString()),
      depositApy: ZERO_BI,
      convertToAssetsMultiplier: ZERO_BD,
      totalDepositsVolume: ZERO_BI,
      totalWithdrawalsVolume: ZERO_BI,
      totalAssets: ZERO_BI,
      totalShares: ZERO_BI,
      vaultId: vaultEntity.id,
      updatedAt: BigInt(timestamp?.toString()),
      prevDayDataId: intervalEntityIdPrev,
    });

    vaultIntervalData.dayId = dayID;
    vaultIntervalData.totalDepositsVolume = ZERO_BI;
    vaultIntervalData.totalWithdrawalsVolume = ZERO_BI;
    vaultIntervalData.totalAssets = ZERO_BI;
    vaultIntervalData.totalShares = ZERO_BI;
    vaultIntervalData.convertToAssetsMultiplier = ZERO_BD;
    vaultIntervalData.updatedAt = BigInt(timestamp?.toString());
    vaultIntervalData.timestamp = BigInt(timestamp?.toString());
    vaultIntervalData.depositApy = vaultEntity.depositApy;
    vaultIntervalData.vaultId = vaultEntity.id;
  }
  vaultIntervalData.depositApy = vaultEntity.depositApy;

  vaultIntervalData.totalDepositsVolume = vaultEntity.totalDepositsVolume;
  vaultIntervalData.totalWithdrawalsVolume = vaultEntity.totalWithdrawalsVolume;
  vaultIntervalData.totalAssets = vaultEntity.totalAssets;
  vaultIntervalData.totalShares = vaultEntity.totalShares;
  vaultIntervalData.convertToAssetsMultiplier =
    vaultEntity.convertToAssetsMultiplier;
  vaultIntervalData.updatedAt = BigInt(timestamp?.toString());
  vaultIntervalData.prevDayDataId = intervalEntityIdPrev;
  if (vaultEntity.tokenId) {
    const loadedToken = await Token.get(vaultEntity.tokenId);
    if (loadedToken !== null) {
      let intervalEntityId = vaultEntity.tokenId
        .concat("_DAY_")
        .concat(dayID.toString());
      vaultIntervalData.tokenDayDataId = intervalEntityId;
    }
  }
  await vaultIntervalData.save();
}
export async function handleUserDayDataVault(
  userVaultEntity: UserDataVaultEntity,
  timestamp: BigInt
) {
  let dayID = BigNumber.from(timestamp).div(86400)?.toBigInt();
  let pdayID = BigNumber.from(timestamp).sub(86400).div(86400)?.toBigInt();
  let intervalEntityId = userVaultEntity.id
    .concat("_DAY_")
    .concat(dayID.toString());
  let intervalEntityIdPrev = userVaultEntity.id
    .concat("_DAY_")
    .concat(pdayID.toString());

  let vaultIntervalData = await UserDataVaultDayEntity.get(intervalEntityId);

  if (!vaultIntervalData) {
    vaultIntervalData = UserDataVaultDayEntity.create({
      id: intervalEntityId,
      timestamp: BigInt(timestamp?.toString()),
      lastUpdate: BigInt(timestamp?.toString()),
      totalDepositsVolume: ZERO_BI,
      totalWithdrawalsVolume: ZERO_BI,
      dayId: dayID,
      depositedAssets: ZERO_BI,
      depositedShares: ZERO_BI,
      userDataVaultId: userVaultEntity.id,
      prevId: intervalEntityIdPrev,
      userId: userVaultEntity?.userId,
    });
    vaultIntervalData.dayId = dayID;

    vaultIntervalData.lastUpdate = BigInt(timestamp?.toString());
    vaultIntervalData.timestamp = BigInt(timestamp?.toString());
    vaultIntervalData.userDataVaultId = userVaultEntity.id;
  }
  vaultIntervalData.totalDepositsVolume = userVaultEntity.totalDepositsVolume;

  vaultIntervalData.totalWithdrawalsVolume =
    userVaultEntity.totalWithdrawalsVolume;

  vaultIntervalData.depositedAssets = userVaultEntity.depositedAssets;
  vaultIntervalData.depositedShares = userVaultEntity.depositedShares;

  vaultIntervalData.lastUpdate = BigInt(timestamp?.toString());
  vaultIntervalData.prevId = intervalEntityIdPrev;

  await vaultIntervalData.save();
}

export async function handleUserHourDataVault(
  userVaultEntity: UserDataVaultEntity,
  timestamp: BigInt
) {
  let hourID = BigInt(
    BigNumber.from(timestamp).div(3600).toNumber().toFixed(0)
  );
  let pHourID = BigInt(
    BigNumber.from(BigInt(timestamp?.toString()) - BigInt(3600))
      .div(3600)
      .toNumber()
      .toFixed(0)
  );

  let intervalEntityId = userVaultEntity.id
    .concat("_HOUR_")
    .concat(hourID.toString());
  let intervalEntityIdPrev = userVaultEntity.id
    .concat("_HOUR_")
    .concat(pHourID.toString());

  let vaultIntervalData = await UserDataVaultHourEntity.get(intervalEntityId);

  if (!vaultIntervalData) {
    vaultIntervalData = UserDataVaultHourEntity.create({
      id: intervalEntityId,
      timestamp: BigInt(timestamp?.toString()),
      lastUpdate: BigInt(timestamp?.toString()),
      totalDepositsVolume: ZERO_BI,
      totalWithdrawalsVolume: ZERO_BI,
      hourId: hourID,
      depositedAssets: ZERO_BI,
      depositedShares: ZERO_BI,
      userDataVaultId: userVaultEntity.id,
      prevId: intervalEntityIdPrev,
    });
    vaultIntervalData.hourId = hourID;
    vaultIntervalData.totalDepositsVolume = ZERO_BI;
    vaultIntervalData.totalWithdrawalsVolume = ZERO_BI;
    vaultIntervalData.depositedAssets = ZERO_BI;
    vaultIntervalData.depositedShares = ZERO_BI;

    vaultIntervalData.lastUpdate = BigInt(timestamp?.toString());
    vaultIntervalData.timestamp = BigInt(timestamp?.toString());
    vaultIntervalData.userDataVaultId = userVaultEntity.id;
  }
  vaultIntervalData.totalDepositsVolume = userVaultEntity.totalDepositsVolume;

  vaultIntervalData.totalWithdrawalsVolume =
    userVaultEntity.totalWithdrawalsVolume;

  vaultIntervalData.depositedAssets = userVaultEntity.depositedAssets;
  vaultIntervalData.depositedShares = userVaultEntity.depositedShares;

  vaultIntervalData.lastUpdate = BigInt(timestamp?.toString());
  vaultIntervalData.prevId = intervalEntityIdPrev;

  vaultIntervalData.save();
}
