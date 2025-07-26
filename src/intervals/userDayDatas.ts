import { BigNumber } from "ethers";
import { AccrueInterestLog as AccrueInterestEvent } from "../types/abi-interfaces/Pool";
import {
  PoolDataEntity,
  PoolDataHourEntity,
  PoolEventArgs,
  UserDataDayEntity,
  UserDataHourEntity,
  UserDataPoolDayEntity,
  UserDataPoolEntity,
  UserDataPoolHourEntity,
} from "../types/models";
import { ONE_BI, ZERO_BD, ZERO_BI } from "../utils/constants";

export async function handleUserDayData(
  poolDataObject: PoolDataEntity,
  poolEventData: PoolEventArgs
) {
  const timestamp = poolDataObject.lastUpdate;

  let dayID = BigNumber.from(timestamp).div(86400)?.toBigInt();
  let pdayID = BigNumber.from(timestamp).sub(86400).div(86400)?.toBigInt();
  let userEntityDayID = poolEventData.account

    .concat("_")
    .concat(dayID.toString());
  let userEntityDayIDPrev = poolEventData.account

    .concat("_")
    .concat(pdayID.toString());

  let userDayDataEntity = await UserDataDayEntity.get(userEntityDayID);

  if (!userDayDataEntity) {
    userDayDataEntity = UserDataDayEntity.create({
      id: userEntityDayID,
      timestamp: poolDataObject.lastUpdate,
      lastUpdate: poolDataObject.lastUpdate,
      totalDepositsVolume: ZERO_BI,
      totalWithdrawalsVolume: ZERO_BI,
      totalBorrowVolume: ZERO_BI,
      totalRepayVolume: ZERO_BI,
      totalSupplyCollateralVolume: ZERO_BI,
      totalWithdrawCollateralVolume: ZERO_BI,
      dayId: dayID,
      userId: poolEventData.account,
      prevId: userEntityDayIDPrev,
    });
  }

  userDayDataEntity.dayId = dayID;
  userDayDataEntity.prevId = userEntityDayIDPrev;
  userDayDataEntity.lastUpdate = poolDataObject.lastUpdate;
  // handle event datas [deposit, withdraw, borrow, repay]

  // DEPOSIT
  userDayDataEntity.totalDepositsVolume = BigNumber.from(
    userDayDataEntity.totalDepositsVolume
  )
    .add(poolEventData.depositAmount)
    ?.toBigInt();

  // WITHDRAW
  userDayDataEntity.totalWithdrawalsVolume = BigNumber.from(
    userDayDataEntity.totalWithdrawalsVolume
  )
    .add(poolEventData.withdrawAmount)
    ?.toBigInt();

  // BORROW or ADD COLLATERAL
  userDayDataEntity.totalBorrowVolume = BigNumber.from(
    userDayDataEntity.totalBorrowVolume
  )
    .add(poolEventData.borrowAmount)
    ?.toBigInt();

  userDayDataEntity.totalSupplyCollateralVolume = BigNumber.from(
    userDayDataEntity.totalSupplyCollateralVolume
  )
    .add(poolEventData.addcollateral)
    ?.toBigInt();

  // REPAY
  userDayDataEntity.totalRepayVolume = BigNumber.from(
    userDayDataEntity.totalRepayVolume
  )
    .add(poolEventData.repayAmount)
    ?.toBigInt();

  // REMOVE COLLATERAL
  userDayDataEntity.totalWithdrawCollateralVolume = BigNumber.from(
    userDayDataEntity.totalWithdrawCollateralVolume
  )
    .add(poolEventData.removecollateral)
    ?.toBigInt();
  await userDayDataEntity.save();
}

export async function handleUserPoolDayData(
  poolDataObject: PoolDataEntity,
  poolEventData: PoolEventArgs,
  userPool: UserDataPoolEntity
) {
  const timestamp = poolDataObject.lastUpdate;

  let dayID = BigNumber.from(timestamp).div(86400)?.toBigInt();
  let pdayID = BigNumber.from(timestamp).sub(86400).div(86400)?.toBigInt();
  let userEntityDayID = poolEventData.account

    .concat("_")
    .concat(dayID.toString())
    .concat("_")
    .concat(poolDataObject.id);
  let userEntityDayIDPrev = poolEventData.account
    .concat("_")
    .concat(pdayID.toString())
    .concat("_")
    .concat(poolDataObject.id);

  let userPoolDayDataEntity = await UserDataPoolDayEntity.get(userEntityDayID);
  const userPoolId = poolEventData.account

    .concat("_")
    .concat(poolDataObject.id);

  if (userPoolDayDataEntity == null) {
    userPoolDayDataEntity = UserDataPoolDayEntity.create({
      id: userEntityDayID,
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
      collateralAssets: ZERO_BD,
      borrowedShares: ZERO_BI,
      dayId: dayID,
      userId: poolEventData.account,
      userDataPoolId: userPoolId,
      prevId: userEntityDayIDPrev,
    });
  }

  userPoolDayDataEntity.dayId = dayID;
  userPoolDayDataEntity.prevId = userEntityDayIDPrev;
  userPoolDayDataEntity.lastUpdate = poolDataObject.lastUpdate;
  // handle event datas [deposit, withdraw, borrow, repay]

  // DEPOSIT
  userPoolDayDataEntity.totalDepositsVolume = BigNumber.from(
    userPoolDayDataEntity.totalDepositsVolume
  )
    .add(poolEventData.depositAmount)
    ?.toBigInt();

  // WITHDRAW
  userPoolDayDataEntity.totalWithdrawalsVolume = BigNumber.from(
    userPoolDayDataEntity.totalWithdrawalsVolume
  )
    .add(poolEventData.withdrawAmount)
    ?.toBigInt();

  // BORROW
  userPoolDayDataEntity.totalBorrowVolume = BigNumber.from(
    userPoolDayDataEntity.totalBorrowVolume
  )
    .add(poolEventData.borrowAmount)
    ?.toBigInt();

  // REPAY
  userPoolDayDataEntity.totalRepayVolume = BigNumber.from(
    userPoolDayDataEntity.totalRepayVolume
  )
    .add(poolEventData.repayAmount)
    ?.toBigInt();
  // COLLATERAL
  userPoolDayDataEntity.totalSupplyCollateralVolume = BigNumber.from(
    userPoolDayDataEntity.totalSupplyCollateralVolume
  )
    .add(poolEventData.addcollateral)
    ?.toBigInt();

  userPoolDayDataEntity.totalWithdrawCollateralVolume = BigNumber.from(
    userPoolDayDataEntity.totalWithdrawCollateralVolume
  )
    .add(poolEventData.removecollateral)
    ?.toBigInt();
  // SHARES POSITION TRACKING
  userPoolDayDataEntity.depositedShares = userPool.depositedShares;
  // userPoolDayDataEntity.depositedShares
  // .plus(poolEventData.depositShares)
  // .minus(poolEventData.withdrawShares);

  userPoolDayDataEntity.borrowedShares = userPool.borrowedShares;
  // userPoolDayDataEntity.borrowedShares
  // .plus(poolEventData.borrowShares)
  // .minus(poolEventData.repayShares);

  // ASSETS POSITION TRACKING
  userPoolDayDataEntity.depositedAssets = userPool.depositedAssets;
  // userPoolDayDataEntity.depositedAssets
  // .plus(new BigDecimal(poolEventData.depositAmount))
  // .minus(new BigDecimal(poolEventData.withdrawAmount));

  userPoolDayDataEntity.borrowedAssets = userPool.borrowedAssets;
  userPoolDayDataEntity.collateralAssets = userPool.collateralAssets;
  // userPoolDayDataEntity.borrowedAssets
  // .plus(new BigDecimal(poolEventData.borrowAmount))
  // .minus(new BigDecimal(poolEventData.repayAmount));

  await userPoolDayDataEntity.save();
}
