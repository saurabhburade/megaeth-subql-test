import { BigNumber } from "ethers";
import { LightAccrueInterestLog as AccrueInterestEvent } from "../types/abi-interfaces/Pool";
import {
  PoolDataDayEntity,
  PoolDataEntity,
  PoolDataHourEntity,
} from "../types/models";
import { ONE_BI, ZERO_BD, ZERO_BI } from "../utils/constants";

export async function handlePoolDayData(
  poolDataObject: PoolDataEntity,
  depositAmount: BigInt,
  withdrawAmount: BigInt,
  borrowAmount: BigInt,
  repayAmount: BigInt
) {
  const poolAddress = poolDataObject.id;
  const timestamp = poolDataObject.lastUpdate;

  let dayID = BigInt(
    BigNumber.from(timestamp).div(86400).toNumber().toFixed(0)
  );
  let pdayID = BigInt(
    BigNumber.from(timestamp - BigInt(86400))
      .div(86400)
      .toNumber()
      .toFixed(0)
  );

  let poolEntityDayID = poolAddress.concat("_").concat(dayID.toString());
  let poolEntityDayIDPrev = poolAddress.concat("_").concat(pdayID.toString());

  let poolDayDataEntity = await PoolDataDayEntity.get(poolEntityDayID);

  if (!poolDayDataEntity) {
    poolDayDataEntity = PoolDataDayEntity.create({
      id: poolEntityDayID,
      totalSupplyAssets: poolDataObject.totalSupplyAssets,
      totalSupplyShares: poolDataObject.totalSupplyShares,
      totalBorrowAssets: poolDataObject.totalBorrowAssets,
      totalBorrowShares: poolDataObject.totalBorrowShares,
      lastUpdate: poolDataObject.lastUpdate,
      fee: poolDataObject.fee,
      utilization: poolDataObject.utilization,
      ir: poolDataObject.ir,
      depositApy: poolDataObject.depositApy,
      ltv: poolDataObject.ltv,
      convertToAssetsMultiplier: poolDataObject.convertToAssetsMultiplier,
      convertBorrowAssetsMultiplier:
        poolDataObject.convertBorrowAssetsMultiplier,
      timestamp: poolDataObject.timestamp,
      lastupdate: poolDataObject.lastUpdate,
      poolAddress: poolAddress,
      dayId: dayID,
      totalDepositsVolume: ZERO_BI,
      totalWithdrawalsVolume: ZERO_BI,
      totalBorrowVolume: ZERO_BI,
      totalRepayVolume: ZERO_BI,
      poolId: poolAddress,
      prevDayDataId: poolEntityDayIDPrev,
    });
  }

  poolDayDataEntity.totalSupplyAssets = poolDataObject.totalSupplyAssets;
  poolDayDataEntity.totalSupplyShares = poolDataObject.totalSupplyShares;
  poolDayDataEntity.totalBorrowAssets = poolDataObject.totalBorrowAssets;
  poolDayDataEntity.totalBorrowShares = poolDataObject.totalBorrowShares;
  poolDayDataEntity.lastUpdate = poolDataObject.lastUpdate;
  poolDayDataEntity.fee = poolDataObject.fee;
  poolDayDataEntity.utilization = poolDataObject.utilization;
  poolDayDataEntity.convertToAssetsMultiplier =
    poolDataObject.convertToAssetsMultiplier;
  poolDayDataEntity.convertBorrowAssetsMultiplier =
    poolDataObject.convertBorrowAssetsMultiplier;
  poolDayDataEntity.ir = poolDataObject.ir;
  poolDayDataEntity.depositApy = poolDataObject.depositApy;
  poolDayDataEntity.prevDayDataId = poolEntityDayIDPrev;
  poolDayDataEntity.dayId = dayID;
  poolDayDataEntity.ltv = poolDataObject.ltv;
  poolDayDataEntity.lastupdate = poolDataObject.lastUpdate;

  // handle event datas [deposit, withdraw, borrow, repay]

  // DEPOSIT
  poolDayDataEntity.totalDepositsVolume =
    poolDayDataEntity.totalDepositsVolume + BigInt(depositAmount?.toString());

  // WITHDRAW
  poolDayDataEntity.totalWithdrawalsVolume =
    poolDayDataEntity.totalWithdrawalsVolume +
    BigInt(withdrawAmount?.toString());

  // BORROW
  poolDayDataEntity.totalBorrowVolume =
    poolDayDataEntity.totalBorrowVolume + BigInt(borrowAmount?.toString());

  // REPAY
  poolDayDataEntity.totalRepayVolume =
    poolDayDataEntity.totalRepayVolume + BigInt(repayAmount?.toString());

  // TOKEN DATA
  if (poolDataObject?.collateralTokenId) {
    let intervalEntityId = poolDataObject.collateralTokenId
      .concat("_DAY_")
      .concat(dayID.toString());
    poolDayDataEntity.collateralTokenDayDataId = intervalEntityId;
  }
  if (poolDataObject.loanTokenId) {
    let intervalEntityId = poolDataObject.loanTokenId
      .concat("_DAY_")
      .concat(dayID.toString());
    poolDayDataEntity.loanTokenDayDataId = intervalEntityId;
  }
  poolDayDataEntity.save();
}
