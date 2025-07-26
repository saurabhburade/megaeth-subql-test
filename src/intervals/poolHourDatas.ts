import { BigNumber } from "ethers";
import { AccrueInterestLog as AccrueInterestEvent } from "../types/abi-interfaces/Pool";
import { PoolDataEntity, PoolDataHourEntity } from "../types/models";
import { ONE_BI, ZERO_BD, ZERO_BI } from "../utils/constants";

export async function handlePoolHourData(
  poolDataObject: PoolDataEntity,
  depositAmount: BigInt,
  withdrawAmount: BigInt,
  borrowAmount: BigInt,
  repayAmount: BigInt
) {
  const poolAddress = poolDataObject.id;
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

  let poolEntityHourID = poolAddress.concat("_").concat(hourID.toString());
  let poolEntityHourIDPrev = poolAddress.concat("_").concat(pHourID.toString());

  let poolHourDataEntity = await PoolDataHourEntity.get(poolEntityHourID);

  if (!poolHourDataEntity) {
    poolHourDataEntity = PoolDataHourEntity.create({
      id: poolEntityHourID,
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
      hourId: hourID,
      totalDepositsVolume: ZERO_BI,
      totalWithdrawalsVolume: ZERO_BI,
      totalBorrowVolume: ZERO_BI,
      totalRepayVolume: ZERO_BI,
      poolId: poolAddress,
      prevHourDataId: poolEntityHourIDPrev,
    });
  }

  poolHourDataEntity.totalSupplyAssets = poolDataObject.totalSupplyAssets;
  poolHourDataEntity.totalSupplyShares = poolDataObject.totalSupplyShares;
  poolHourDataEntity.totalBorrowAssets = poolDataObject.totalBorrowAssets;
  poolHourDataEntity.totalBorrowShares = poolDataObject.totalBorrowShares;
  poolHourDataEntity.lastUpdate = poolDataObject.lastUpdate;
  poolHourDataEntity.fee = poolDataObject.fee;
  poolHourDataEntity.utilization = poolDataObject.utilization;
  poolHourDataEntity.convertToAssetsMultiplier =
    poolDataObject.convertToAssetsMultiplier;
  poolHourDataEntity.convertBorrowAssetsMultiplier =
    poolDataObject.convertBorrowAssetsMultiplier;
  poolHourDataEntity.ir = poolDataObject.ir;
  poolHourDataEntity.depositApy = poolDataObject.depositApy;
  poolHourDataEntity.prevHourDataId = poolEntityHourIDPrev;
  poolHourDataEntity.hourId = hourID;
  poolHourDataEntity.ltv = poolDataObject.ltv;
  poolHourDataEntity.lastupdate = poolDataObject.lastUpdate;

  // handle event datas [deposit, withdraw, borrow, repay]

  // DEPOSIT
  poolHourDataEntity.totalDepositsVolume =
    poolHourDataEntity.totalDepositsVolume + BigInt(depositAmount?.toString());

  // WITHDRAW
  poolHourDataEntity.totalWithdrawalsVolume =
    poolHourDataEntity.totalWithdrawalsVolume +
    BigInt(withdrawAmount?.toString());
  // BORROW
  poolHourDataEntity.totalBorrowVolume =
    poolHourDataEntity.totalBorrowVolume + BigInt(borrowAmount?.toString());

  // REPAY
  poolHourDataEntity.totalRepayVolume =
    poolHourDataEntity.totalRepayVolume + BigInt(repayAmount?.toString());

  // TOKEN DATA
  if (poolDataObject.collateralTokenId) {
    let intervalEntityId = poolDataObject.collateralTokenId
      .concat("_HOUR_")
      .concat(hourID.toString());
    poolHourDataEntity.collateralTokenHourDataId = intervalEntityId;
  }
  if (poolDataObject.loanTokenId) {
    let intervalEntityId = poolDataObject.loanTokenId
      .concat("_HOUR_")
      .concat(hourID.toString());
    poolHourDataEntity.loanTokenHourDataId = intervalEntityId;
  }
  await poolHourDataEntity.save();
}
