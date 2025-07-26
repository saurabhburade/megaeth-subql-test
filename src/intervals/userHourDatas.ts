import { BigNumber } from "ethers";
import {
  PoolDataEntity,
  PoolDataHourEntity,
  PoolEventArgs,
  UserDataHourEntity,
  UserDataPoolEntity,
  UserDataPoolHourEntity,
} from "../types/models";
import { ONE_BI, ZERO_BD, ZERO_BI } from "../utils/constants";

export async function handleUserHourData(
  poolDataObject: PoolDataEntity,
  poolEventData: PoolEventArgs
) {
  const timestamp = poolDataObject.lastUpdate;

  let hourID = BigInt(
    BigNumber.from(timestamp).div(3600).toNumber().toFixed(0)
  );
  let pHourID = BigInt(
    BigNumber.from(timestamp - BigInt(3600))
      .div(3600)
      .toNumber()
      .toFixed(0)
  );

  let userEntityHourID = poolEventData.account

    .concat("_")
    .concat(hourID.toString());
  let userEntityHourIDPrev = poolEventData.account

    .concat("_")
    .concat(pHourID.toString());

  let userHourDataEntity = await UserDataHourEntity.get(userEntityHourID);

  if (!userHourDataEntity) {
    userHourDataEntity = UserDataHourEntity.create({
      id: userEntityHourID,
      timestamp: poolDataObject.lastUpdate,
      lastUpdate: poolDataObject.lastUpdate,
      totalDepositsVolume: ZERO_BI,
      totalWithdrawalsVolume: ZERO_BI,
      totalBorrowVolume: ZERO_BI,
      totalRepayVolume: ZERO_BI,
      totalSupplyCollateralVolume: ZERO_BI,
      totalWithdrawCollateralVolume: ZERO_BI,
      hourId: hourID,
      userId: poolEventData.account,
      prevId: userEntityHourIDPrev,
    });
    userHourDataEntity.timestamp = poolDataObject.lastUpdate;
    userHourDataEntity.userId = poolEventData.account;
    userHourDataEntity.totalDepositsVolume = ZERO_BI;
    userHourDataEntity.totalWithdrawalsVolume = ZERO_BI;
    userHourDataEntity.totalBorrowVolume = ZERO_BI;
    userHourDataEntity.totalRepayVolume = ZERO_BI;
    userHourDataEntity.totalSupplyCollateralVolume = ZERO_BI;
    userHourDataEntity.totalWithdrawCollateralVolume = ZERO_BI;
  }

  userHourDataEntity.hourId = hourID;
  userHourDataEntity.prevId = userEntityHourIDPrev;
  userHourDataEntity.lastUpdate = poolDataObject.lastUpdate;
  // handle event datas [deposit, withdraw, borrow, repay]

  // DEPOSIT
  userHourDataEntity.totalDepositsVolume = BigNumber.from(
    userHourDataEntity.totalDepositsVolume
  )
    .add(poolEventData.depositAmount)
    ?.toBigInt();

  // WITHDRAW
  userHourDataEntity.totalWithdrawalsVolume = BigNumber.from(
    userHourDataEntity.totalWithdrawalsVolume
  )
    .add(poolEventData.withdrawAmount)
    ?.toBigInt();

  // BORROW or ADD COLLATERAL
  userHourDataEntity.totalBorrowVolume = BigNumber.from(
    userHourDataEntity.totalBorrowVolume
  )
    .add(poolEventData.borrowAmount)
    ?.toBigInt();

  userHourDataEntity.totalSupplyCollateralVolume = BigNumber.from(
    userHourDataEntity.totalSupplyCollateralVolume
  )
    .add(poolEventData.addcollateral)
    ?.toBigInt();

  // REPAY
  userHourDataEntity.totalRepayVolume = BigNumber.from(
    userHourDataEntity.totalRepayVolume
  )
    .add(poolEventData.repayAmount)
    ?.toBigInt();

  // REMOVE COLLATERAL
  userHourDataEntity.totalWithdrawCollateralVolume = BigNumber.from(
    userHourDataEntity.totalWithdrawCollateralVolume
  )
    .add(poolEventData.removecollateral)
    ?.toBigInt();

  // ADD COLLATERAL
  userHourDataEntity.totalSupplyCollateralVolume = BigNumber.from(
    userHourDataEntity.totalSupplyCollateralVolume
  )
    .add(poolEventData.addcollateral)
    ?.toBigInt();

  await userHourDataEntity.save();
}

export async function handleUserPoolHourData(
  poolDataObject: PoolDataEntity,
  poolEventData: PoolEventArgs,
  userPool: UserDataPoolEntity
) {
  const timestamp = poolDataObject.lastUpdate;
  let hourID = BigInt(
    BigNumber.from(timestamp).div(3600).toNumber().toFixed(0)
  );
  let pHourID = BigInt(
    BigNumber.from(timestamp - BigInt(3600))
      .div(3600)
      .toNumber()
      .toFixed(0)
  );

  let userEntityHourID = poolEventData.account

    .concat("_")
    .concat(hourID.toString())
    .concat("_")
    .concat(poolDataObject.id)
    .toString();
  let userEntityHourIDPrev = poolEventData.account

    .concat("_")
    .concat(pHourID.toString())
    .concat("_")
    .concat(poolDataObject.id)
    .toString();

  let userPoolHourDataEntity = await UserDataPoolHourEntity.get(
    userEntityHourID
  );
  const userPoolId = poolEventData.account
    .concat("_")
    .concat(poolDataObject.id)
    .toString();
  if (!userPoolHourDataEntity) {
    userPoolHourDataEntity = UserDataPoolHourEntity.create({
      id: userEntityHourID,
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
      hourId: hourID,
      userId: poolEventData.account,
      userDataPoolId: userPoolId,
      prevId: userEntityHourIDPrev,
    });

    userPoolHourDataEntity.timestamp = poolDataObject.lastUpdate;
    userPoolHourDataEntity.userId = poolEventData.account;
    userPoolHourDataEntity.totalDepositsVolume = ZERO_BI;
    userPoolHourDataEntity.totalWithdrawalsVolume = ZERO_BI;
    userPoolHourDataEntity.totalBorrowVolume = ZERO_BI;
    userPoolHourDataEntity.totalRepayVolume = ZERO_BI;
    userPoolHourDataEntity.totalSupplyCollateralVolume = ZERO_BI;
    userPoolHourDataEntity.totalWithdrawCollateralVolume = ZERO_BI;
    userPoolHourDataEntity.depositedShares = ZERO_BI;
    userPoolHourDataEntity.depositedAssets = ZERO_BD;
    userPoolHourDataEntity.borrowedShares = ZERO_BI;
    userPoolHourDataEntity.borrowedAssets = ZERO_BD;
    userPoolHourDataEntity.collateralAssets = ZERO_BD;
    userPoolHourDataEntity.userDataPoolId = userPoolId;
  }

  userPoolHourDataEntity.hourId = hourID;
  userPoolHourDataEntity.prevId = userEntityHourIDPrev;
  userPoolHourDataEntity.lastUpdate = poolDataObject.lastUpdate;
  // handle event datas [deposit, withdraw, borrow, repay]

  // DEPOSIT
  userPoolHourDataEntity.totalDepositsVolume = BigNumber.from(
    userPoolHourDataEntity.totalDepositsVolume
  )
    .add(poolEventData.depositAmount)
    ?.toBigInt();

  // WITHDRAW
  userPoolHourDataEntity.totalWithdrawalsVolume = BigNumber.from(
    userPoolHourDataEntity.totalWithdrawalsVolume
  )
    .add(poolEventData.withdrawAmount)
    ?.toBigInt();

  // BORROW or ADD COLLATERAL
  userPoolHourDataEntity.totalBorrowVolume = BigNumber.from(
    userPoolHourDataEntity.totalBorrowVolume
  )
    .add(poolEventData.borrowAmount)
    ?.toBigInt();

  userPoolHourDataEntity.totalSupplyCollateralVolume = BigNumber.from(
    userPoolHourDataEntity.totalSupplyCollateralVolume
  )
    .add(poolEventData.addcollateral)
    ?.toBigInt();

  // REPAY
  userPoolHourDataEntity.totalRepayVolume = BigNumber.from(
    userPoolHourDataEntity.totalRepayVolume
  )
    .add(poolEventData.repayAmount)
    ?.toBigInt();

  // REMOVE COLLATERAL
  userPoolHourDataEntity.totalWithdrawCollateralVolume = BigNumber.from(
    userPoolHourDataEntity.totalWithdrawCollateralVolume
  )
    .add(poolEventData.removecollateral)
    ?.toBigInt();

  // ADD COLLATERAL
  userPoolHourDataEntity.totalSupplyCollateralVolume = BigNumber.from(
    userPoolHourDataEntity.totalSupplyCollateralVolume
  )
    .add(poolEventData.addcollateral)
    ?.toBigInt();

  // SHARES POSITION TRACKING
  userPoolHourDataEntity.depositedShares = userPool.depositedShares;
  // userPoolHourDataEntity.depositedShares
  //   .plus(poolEventData.depositShares)
  //   .minus(poolEventData.withdrawShares);

  userPoolHourDataEntity.borrowedShares = userPool.borrowedShares;
  //     userPoolHourDataEntity.borrowedShares
  // .plus(poolEventData.borrowShares)
  // .minus(poolEventData.repayShares);

  // ASSETS POSITION TRACKING
  userPoolHourDataEntity.depositedAssets = userPool.depositedAssets;
  // userPoolHourDataEntity.depositedAssets
  //   .plus(new BigDecimal(poolEventData.depositAmount))
  //   .minus(new BigDecimal(poolEventData.withdrawAmount));

  userPoolHourDataEntity.borrowedAssets = userPool.borrowedAssets;

  userPoolHourDataEntity.collateralAssets = userPool.collateralAssets;
  //     userPoolHourDataEntity.borrowedAssets
  // .plus(new BigDecimal(poolEventData.borrowAmount))
  // .minus(new BigDecimal(poolEventData.repayAmount));

  await userPoolHourDataEntity.save();
}
