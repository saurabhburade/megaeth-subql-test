import { BigNumber } from "ethers";
import {
  PoolDataEntity,
  PoolEventArgs,
  UserDataEntity,
  UserDataPoolEntity,
} from "../types/models";
import { ZERO_BD, ZERO_BI } from "../utils/constants";
import {
  handleUserHourData,
  handleUserPoolHourData,
} from "../intervals/userHourDatas";
import {
  handleUserDayData,
  handleUserPoolDayData,
} from "../intervals/userDayDatas";

export async function handleUserData(
  poolDataObject: PoolDataEntity,
  poolEventData: PoolEventArgs
) {
  logger.info("handleUserData : TRACKING ACCOUNT : {} POOL : {}", [
    poolEventData.account,
    poolDataObject.id,
  ]);
  let user = await UserDataEntity.get(poolEventData.account);
  if (user == null) {
    user = UserDataEntity.create({
      id: poolEventData.account,
      timestamp: poolDataObject.lastUpdate,
      lastUpdate: poolDataObject.lastUpdate,
      totalDepositsVolume: ZERO_BI,
      totalWithdrawalsVolume: ZERO_BI,
      totalBorrowVolume: ZERO_BI,
      totalRepayVolume: ZERO_BI,
      totalSupplyCollateralVolume: ZERO_BI,
      totalWithdrawCollateralVolume: ZERO_BI,
    });
  }
  user.lastUpdate = poolDataObject.lastUpdate;
  // handle event datas [deposit, withdraw, borrow, repay]

  // DEPOSIT
  user.totalDepositsVolume = BigNumber.from(user.totalDepositsVolume)
    .add(poolEventData.depositAmount)
    ?.toBigInt();

  // WITHDRAW
  user.totalWithdrawalsVolume = BigNumber.from(user.totalWithdrawalsVolume)
    .add(poolEventData.withdrawAmount)
    ?.toBigInt();

  // BORROW
  user.totalBorrowVolume = BigNumber.from(user.totalBorrowVolume)
    .add(poolEventData.borrowAmount)
    ?.toBigInt();

  // REPAY
  user.totalRepayVolume = BigNumber.from(user.totalRepayVolume)
    .add(poolEventData.repayAmount)
    ?.toBigInt();

  // Supply Collateral
  user.totalSupplyCollateralVolume = BigNumber.from(
    user.totalSupplyCollateralVolume
  )
    .add(poolEventData.addcollateral)
    ?.toBigInt();

  // Withdraw Collateral
  user.totalWithdrawCollateralVolume = BigNumber.from(
    user.totalWithdrawCollateralVolume
  )
    .add(poolEventData.removecollateral)
    ?.toBigInt();

  await handleUserHourData(poolDataObject, poolEventData);
  await handleUserDayData(poolDataObject, poolEventData);
  // USER DATA for POOL
  await handleUserPoolData(poolDataObject, poolEventData);
  await user.save();
}
export async function handleUserPoolData(
  poolDataObject: PoolDataEntity,
  poolEventData: PoolEventArgs
) {
  logger.info("TRACKING ACCOUNT : {} POOL : {}", [
    poolEventData.account,
    poolDataObject.id,
  ]);
  const userPoolId = poolEventData.account
    .concat("_")
    .concat(poolDataObject.id);
  let userPool = await UserDataPoolEntity.get(userPoolId);
  if (userPool == null) {
    userPool = UserDataPoolEntity.create({
      id: userPoolId,
      timestamp: poolDataObject.lastUpdate,
      lastUpdate: poolDataObject.lastUpdate,
      totalDepositsVolume: ZERO_BI,
      totalWithdrawalsVolume: ZERO_BI,
      totalBorrowVolume: ZERO_BI,
      totalRepayVolume: ZERO_BI,
      totalSupplyCollateralVolume: ZERO_BI,
      totalWithdrawCollateralVolume: ZERO_BI,
      depositedAssets: ZERO_BD,
      depositedShares: ZERO_BI,
      borrowedAssets: ZERO_BD,
      borrowedShares: ZERO_BI,
      collateralAssets: ZERO_BD,
      userId: poolEventData.account,
      poolId: poolDataObject.id,
    });
  }
  userPool.lastUpdate = poolDataObject.lastUpdate;

  // handle event datas [deposit, withdraw, borrow, repay]

  // DEPOSIT
  userPool.totalDepositsVolume = BigNumber.from(userPool.totalDepositsVolume)
    .add(poolEventData.depositAmount)
    ?.toBigInt();

  // WITHDRAW
  userPool.totalWithdrawalsVolume = BigNumber.from(
    userPool.totalWithdrawalsVolume
  )
    .add(poolEventData.withdrawAmount)
    ?.toBigInt();

  // BORROW
  userPool.totalBorrowVolume = BigNumber.from(userPool.totalBorrowVolume)
    .add(poolEventData.borrowAmount)
    ?.toBigInt();

  // REPAY
  userPool.totalRepayVolume = BigNumber.from(userPool.totalRepayVolume)
    .add(poolEventData.repayAmount)
    ?.toBigInt();

  // TODO: track collaterals
  // Supply Collateral
  userPool.totalSupplyCollateralVolume = BigNumber.from(
    userPool.totalSupplyCollateralVolume
  )
    .add(poolEventData.addcollateral)
    ?.toBigInt();

  // Withdraw Collateral
  userPool.totalWithdrawCollateralVolume = BigNumber.from(
    userPool.totalWithdrawCollateralVolume
  )
    .add(poolEventData.removecollateral)
    ?.toBigInt();

  // SHARES POSITION TRACKING

  if (
    BigNumber.from(userPool.depositedShares)
      .add(poolEventData.depositShares)
      .sub(poolEventData.withdrawShares)
      .gte(ZERO_BI)
  ) {
    userPool.depositedShares = BigNumber.from(userPool.depositedShares)
      .add(poolEventData.depositShares)
      .sub(poolEventData.withdrawShares)
      ?.toBigInt();
  } else {
    userPool.depositedShares = ZERO_BI;
  }

  if (
    BigNumber.from(userPool.borrowedShares)
      .add(poolEventData.borrowShares)
      .sub(poolEventData.repayShares)
      .gte(ZERO_BI)
  ) {
    userPool.borrowedShares = BigNumber.from(userPool.borrowedShares)
      .add(poolEventData.borrowShares)
      .sub(poolEventData.repayShares)
      ?.toBigInt();
  } else {
    userPool.borrowedShares = ZERO_BI;
  }

  // ASSETS POSITION TRACKING

  if (
    BigNumber.from(userPool.depositedAssets)
      .add(poolEventData.depositAmount)
      .sub(poolEventData.withdrawAmount)
      .gte(ZERO_BD)
  ) {
    userPool.depositedAssets = BigNumber.from(userPool.depositedAssets)
      .add(poolEventData.depositAmount)
      .sub(poolEventData.withdrawAmount)
      ?.toNumber();
  } else {
    userPool.depositedAssets = ZERO_BD;
  }

  if (
    BigNumber.from(userPool.borrowedAssets)
      .add(poolEventData.borrowAmount)
      .sub(poolEventData.repayAmount)
      .gte(ZERO_BD)
  ) {
    userPool.borrowedAssets = BigNumber.from(userPool.borrowedAssets)
      .add(poolEventData.borrowAmount)
      .sub(poolEventData.repayAmount)
      ?.toNumber();
  } else {
    userPool.borrowedAssets = ZERO_BD;
  }

  // COLLATERAL TRACKING
  if (
    BigNumber.from(userPool.collateralAssets)
      .add(poolEventData.addcollateral)
      .sub(poolEventData.removecollateral)
      .gte(ZERO_BD)
  ) {
    userPool.collateralAssets = BigNumber.from(userPool.collateralAssets)
      .add(poolEventData.addcollateral)
      .sub(poolEventData.removecollateral)
      ?.toNumber();
  } else {
    userPool.collateralAssets = ZERO_BD;
  }

  await handleUserPoolHourData(poolDataObject, poolEventData, userPool);
  await handleUserPoolDayData(poolDataObject, poolEventData, userPool);

  await userPool.save();
}
