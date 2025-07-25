import {
  AccrueInterestLog as AccrueInterestEvent,
  DepositLog as DepositEvent,
  WithdrawLog as WithdrawEvent,
  BorrowLog as BorrowEvent,
  RepayLog as RepayEvent,
  DepositCollateralLog as SupplyCollateralEvent,
  WithdrawCollateralLog as WithdrawCollateralEvent,
} from "../types/abi-interfaces/Pool";
import { PoolCreatedLog as PoolCreatedEvent } from "../types/abi-interfaces/PoolFactory";
import {
  PoolAction,
  PoolDataEntity,
  PoolEventArgs,
  PoolFactory,
  Repay,
  Token,
  UserAction,
} from "../types/models";
import {
  DECIMAL_OFFSET,
  LOAN_TOKEN_DECIMALS,
  MULTICALL_ERC20,
  ONE_BD,
  ONE_BI,
  ZERO_BD,
  ZERO_BI,
  ZERO_BN,
} from "../utils/constants";

import { Pool } from "../types/contracts/Pool";

import { handlePoolHourData } from "../intervals/poolHourDatas";
import { handlePoolDayData } from "../intervals/poolDayDatas";
// import { handleUserData, handleUserPoolData } from "./userData";

// import {
//   Pool__getPoolDataResult,
//   Pool__getPoolConfigResultPoolConfigStruct,
// } from "../../generated/PoolFactory/Pool";
import { AccrueInterest, ActionType } from "../types";
import { ModularMulticallTokenFetcher } from "../types/contracts/ERC20Fetcher";
import assert from "assert";
import { BigNumber } from "ethers";
import { ERC20Fetcher__factory, Pool__factory } from "../types/contracts";
export async function handlePoolDataCreation(
  event: PoolCreatedEvent,
  poolCompleteData: ModularMulticallTokenFetcher.PoolCompleteDataStructOutput,
  orderbookRes: string,
  loanToken: Token | undefined,
  collateralToken: Token | undefined
) {
  assert(event.args);

  const poolAddress = event.args.pool;

  let poolDataObject = await PoolDataEntity.get(poolAddress);
  let poolFactory = await PoolFactory.get(ONE_BI.toString());
  if (poolCompleteData) {
    const poolData = poolCompleteData[1];
    const poolConfig = poolCompleteData[2];
    const ir = poolCompleteData?.interestRate || ZERO_BN;
    const supplyAPY = poolCompleteData?.apy || ZERO_BN;
    const ltv = poolCompleteData?.[2].lltv || ZERO_BN;
    const totalSupplyAssets = poolData.totalSupplyAssets || ZERO_BN;
    const totalSupplyShares = poolData.totalSupplyShares || ZERO_BN;
    const totalBorrowAssets = poolData.totalBorrowAssets || ZERO_BN;
    const totalBorrowShares = poolData.totalBorrowShares || ZERO_BN;
    const lastUpdate = poolData.lastUpdate || ZERO_BN;
    const fee = ZERO_BI;

    let assetsMultiplier = ZERO_BD;
    let borrowMultiplier = ZERO_BD;

    if (poolDataObject?.loanTokenId) {
      const loanToken = await Token.get(poolDataObject.loanTokenId);
      if (loanToken) {
        assetsMultiplier = BigNumber.from(totalSupplyAssets.add(ONE_BI))
          .div(BigNumber.from(totalSupplyShares).add(ONE_BD))
          ?.toNumber();

        borrowMultiplier =
          totalBorrowAssets.gt(ZERO_BI) && totalBorrowShares.gt(ZERO_BI)
            ? BigNumber.from(totalBorrowAssets)
                .div(BigNumber.from(totalBorrowShares).add(ONE_BD))
                ?.toNumber()
            : ZERO_BD;
      }
    }

    const utilization =
      totalBorrowAssets.gt(ZERO_BI) && totalSupplyAssets.gt(ZERO_BI)
        ? BigNumber.from(totalBorrowAssets)
            .div(BigNumber.from(totalSupplyAssets))
            .mul(100)
            ?.toNumber()
        : ZERO_BD;
    if (!poolDataObject) {
      poolDataObject = PoolDataEntity.create({
        id: poolAddress,
        totalDepositsVolume: ZERO_BI,
        totalWithdrawalsVolume: ZERO_BI,
        totalBorrowVolume: ZERO_BI,
        totalRepayVolume: ZERO_BI,
        totalSupplyAssets: ZERO_BI,
        totalSupplyShares: ZERO_BI,
        totalBorrowAssets: ZERO_BI,
        totalBorrowShares: ZERO_BI,
        timestamp: ZERO_BI,
        lastUpdate: ZERO_BI,
        fee: ZERO_BI,
        utilization: 0,
        ir: ZERO_BI,
        depositApy: ZERO_BI,
        ltv: ZERO_BI,
        convertToAssetsMultiplier: 0,
        convertBorrowAssetsMultiplier: 0,
        oracle: poolConfig.oracle ?? "",
        poolFactoryId: poolFactory?.id ?? "",

        loanTokenId: loanToken?.id ?? "",
        collateralTokenId: collateralToken?.id ?? "",
      });
      poolDataObject.totalDepositsVolume = ZERO_BI;
      poolDataObject.totalWithdrawalsVolume = ZERO_BI;
      poolDataObject.totalBorrowVolume = ZERO_BI;
      poolDataObject.totalRepayVolume = ZERO_BI;

      poolDataObject.timestamp = event.block.timestamp;
      if (!orderbookRes) {
        poolDataObject.orderbookId = orderbookRes;
      }
      if (poolFactory) {
        poolDataObject.poolFactoryId = poolFactory.id;
      }
      if (loanToken?.id) {
        poolDataObject.loanTokenId = loanToken.id;
      }

      if (collateralToken?.id) {
        poolDataObject.collateralTokenId = collateralToken.id;
      }
      poolDataObject.oracle = poolConfig.oracle;
    }

    poolDataObject.totalSupplyAssets = totalSupplyAssets?.toBigInt();
    poolDataObject.totalSupplyShares = totalSupplyShares?.toBigInt();
    poolDataObject.totalBorrowAssets = totalBorrowAssets?.toBigInt();
    poolDataObject.totalBorrowShares = totalBorrowShares?.toBigInt();
    poolDataObject.lastUpdate = lastUpdate?.toBigInt();
    poolDataObject.fee = fee;
    poolDataObject.utilization = utilization;
    poolDataObject.ir = ir?.toBigInt();
    poolDataObject.depositApy = supplyAPY?.toBigInt();
    poolDataObject.ltv = ltv?.toBigInt();

    poolDataObject.convertToAssetsMultiplier = assetsMultiplier;
    poolDataObject.convertBorrowAssetsMultiplier = borrowMultiplier;
    await poolDataObject.save();

    await handlePoolHourData(
      poolDataObject,
      ZERO_BI,
      ZERO_BI,
      ZERO_BI,
      ZERO_BI
    );
    await handlePoolDayData(poolDataObject, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI);
  } else {
    logger.info("CALL REVERT :: PoolCreatedEvent");
  }
}
// TODO: remove eth_call and track through events
export async function handlePoolData(event: AccrueInterestEvent) {
  const multicallErc20Contract = ERC20Fetcher__factory.connect(
    MULTICALL_ERC20,
    api
  );

  let poolDataObject = await PoolDataEntity.get(event.address);
  let poolCompleteDataRaw = await multicallErc20Contract.getPoolsCompleteData([
    event.address,
  ]);
  const poolCompleteData = poolCompleteDataRaw[0];
  const poolData = poolCompleteDataRaw[0];
  const poolDataAssets = poolCompleteDataRaw[0][1];
  if (poolData) {
    const ir = poolData.interestRate || ZERO_BN;
    const ltv = poolData.ltv || ZERO_BN;
    const depositApy = poolData.apy || ZERO_BN;
    logger.info(
      `AccrueInterestEvent pool::${event.address.toString()} ir::${ir.toString()} ltv::${ltv.toString()} depositApy::${depositApy.toString()}`
    );
    const totalSupplyAssets = poolDataAssets.totalSupplyAssets || ZERO_BN;
    const totalSupplyShares = poolDataAssets.totalSupplyShares || ZERO_BN;
    const totalBorrowAssets = poolDataAssets.totalBorrowAssets || ZERO_BN;
    const totalBorrowShares = poolDataAssets.totalBorrowShares || ZERO_BN;
    const lastUpdate = poolDataAssets.lastUpdate || ZERO_BN;
    const fee = ZERO_BI;
    let assetsMultiplier = ZERO_BD;
    let borrowMultiplier = ZERO_BD;
    if (poolDataObject?.loanTokenId) {
      const loanToken = await Token.get(poolDataObject.loanTokenId);
      if (loanToken) {
        assetsMultiplier = BigNumber.from(totalSupplyAssets.add(ONE_BI))
          .div(BigNumber.from(totalSupplyShares).add(ONE_BD))
          ?.toNumber();

        borrowMultiplier =
          totalBorrowAssets.gt(ZERO_BI) && totalBorrowShares.gt(ZERO_BI)
            ? BigNumber.from(totalBorrowAssets.add(ONE_BI))
                .div(BigNumber.from(totalBorrowShares).add(ONE_BD))
                ?.toNumber()
            : ZERO_BD;
      }
    }

    const utilization =
      totalBorrowAssets.gt(ZERO_BI) && totalSupplyAssets.gt(ZERO_BI)
        ? BigNumber.from(totalBorrowAssets)
            .div(BigNumber.from(totalSupplyAssets))
            .mul(100)
            ?.toNumber()
        : ZERO_BD;

    if (!poolDataObject) {
      poolDataObject = PoolDataEntity.create({
        id: event.address,
        totalDepositsVolume: ZERO_BI,
        totalWithdrawalsVolume: ZERO_BI,
        totalBorrowVolume: ZERO_BI,
        totalRepayVolume: ZERO_BI,
        totalSupplyAssets: ZERO_BI,
        totalSupplyShares: ZERO_BI,
        totalBorrowAssets: ZERO_BI,
        totalBorrowShares: ZERO_BI,
        timestamp: ZERO_BI,
        lastUpdate: ZERO_BI,
        fee: ZERO_BI,
        utilization: 0,
        ir: ZERO_BI,
        depositApy: ZERO_BI,
        ltv: ZERO_BI,
        convertToAssetsMultiplier: 0,
        convertBorrowAssetsMultiplier: 0,
        oracle: poolCompleteData[2].oracle ?? "",
        poolFactoryId: ONE_BI.toString() ?? "",

        loanTokenId: poolCompleteData[2].loanToken ?? "",
        collateralTokenId: poolCompleteData[2].collateralToken ?? "",
      });
    }
    poolDataObject.totalSupplyAssets = totalSupplyAssets?.toBigInt();
    poolDataObject.totalSupplyShares = totalSupplyShares?.toBigInt();
    poolDataObject.totalBorrowAssets = totalBorrowAssets?.toBigInt();
    poolDataObject.totalBorrowShares = totalBorrowShares?.toBigInt();
    poolDataObject.lastUpdate = lastUpdate?.toBigInt();
    poolDataObject.fee = fee;
    poolDataObject.utilization = utilization;
    poolDataObject.ir = ir?.toBigInt();
    poolDataObject.ltv = ltv?.toBigInt();
    poolDataObject.convertToAssetsMultiplier = assetsMultiplier;
    poolDataObject.convertBorrowAssetsMultiplier = borrowMultiplier;
    poolDataObject.depositApy = depositApy?.toBigInt();
    await poolDataObject.save();
    await handlePoolHourData(
      poolDataObject,
      ZERO_BI,
      ZERO_BI,
      ZERO_BI,
      ZERO_BI
    );
    await handlePoolDayData(poolDataObject, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI);
  } else {
    logger.info(
      "CALL REVERT :: FALLING BACK TO PREV DATA :: AccrueInterestEvent",
      []
    );
    if (poolDataObject) {
      poolDataObject.ir = event.args!.prevBorrowRate?.toBigInt();
      poolDataObject.lastUpdate = event.block.timestamp;
      await poolDataObject.save();
      await handlePoolHourData(
        poolDataObject,
        ZERO_BI,
        ZERO_BI,
        ZERO_BI,
        ZERO_BI
      );
      await handlePoolDayData(
        poolDataObject,
        ZERO_BI,
        ZERO_BI,
        ZERO_BI,
        ZERO_BI
      );
    }
  }
}

export async function handlePoolDataDeposit(event: DepositEvent) {
  assert(event.args);

  logger.info(
    `192  handlePoolDataDeposit : TRACKING ACCOUNT : ${event.transaction.from.toString()} POOL : ${event.address.toString()} SENDER :${event.args.sender.toString()}`
  );
  let poolDataObject = await PoolDataEntity.get(event.address);
  if (poolDataObject) {
    poolDataObject.totalDepositsVolume =
      poolDataObject.totalDepositsVolume + event.args.assets?.toBigInt();

    const poolEventData = PoolEventArgs.create({
      id: event.address.toString(),
      account: event.args.owner,
      depositAmount: event.args.assets?.toBigInt(),
      withdrawAmount: ZERO_BI,
      borrowAmount: ZERO_BI,
      repayAmount: ZERO_BI,
      depositShares: event.args.shares?.toBigInt(),
      withdrawShares: ZERO_BI,
      borrowShares: ZERO_BI,
      repayShares: ZERO_BI,
      addcollateral: ZERO_BI,
      removecollateral: ZERO_BI,
    });

    await handlePoolHourData(
      poolDataObject,
      event.args.assets?.toBigInt(),
      ZERO_BI,
      ZERO_BI,
      ZERO_BI
    );
    await handlePoolDayData(
      poolDataObject,
      event.args.assets?.toBigInt(),
      ZERO_BI,
      ZERO_BI,
      ZERO_BI
    );
    // USER DATA
    // handleUserData(poolDataObject, poolEventData);

    await poolDataObject.save();

    let txn = UserAction.create({
      id: event.transaction.hash.concat(event.logIndex?.toString()),
      action: ActionType.DEPOSIT,
      assets: event.args.assets?.toBigInt(),
      caller: event.args.sender,
      userId: event.args.owner,
      receiver: event.args.owner,
      shares: event.args.shares?.toBigInt(),
      blockNumber: BigInt(event.block.number),
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
      poolId: event.address,

      isVault: false,
      tokenId: poolDataObject.loanTokenId,
    });

    await txn.save();
  }
}
export async function handlePoolDataWithdraw(event: WithdrawEvent) {
  assert(event.args);

  let poolDataObject = await PoolDataEntity.get(event.address);
  if (poolDataObject) {
    poolDataObject.totalWithdrawalsVolume =
      poolDataObject.totalWithdrawalsVolume + event.args.assets?.toBigInt();
    const poolEventData = PoolEventArgs.create({
      id: event.address.toString(),
      account: event.transaction.from,
      depositAmount: ZERO_BI,
      withdrawAmount: event.args.assets?.toBigInt(),
      borrowAmount: ZERO_BI,
      repayAmount: ZERO_BI,
      depositShares: ZERO_BI,
      withdrawShares: event.args.shares?.toBigInt(),
      borrowShares: ZERO_BI,
      repayShares: ZERO_BI,
      addcollateral: ZERO_BI,
      removecollateral: ZERO_BI,
    });

    await handlePoolHourData(
      poolDataObject,
      ZERO_BI,
      event.args.assets?.toBigInt(),
      ZERO_BI,
      ZERO_BI
    );
    await handlePoolDayData(
      poolDataObject,
      ZERO_BI,
      event.args.assets?.toBigInt(),
      ZERO_BI,
      ZERO_BI
    );
    // USER DATA
    // handleUserData(poolDataObject, poolEventData);

    await poolDataObject.save();

    let txn = UserAction.create({
      id: event.transaction.hash.concat(event.logIndex?.toString()),
      action: ActionType.WITHDRAW,
      poolAddress: event.address,
      assets: event.args.assets?.toBigInt(),
      caller: event.transaction.from,
      userId: event.transaction.from,
      receiver: event.args.receiver,
      shares: event.args.shares?.toBigInt(),
      blockNumber: BigInt(event.block.number),
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
      poolId: event.address,

      isVault: false,
      tokenId: poolDataObject.loanTokenId,
    });
    await txn.save();
  }
}
export async function handlePoolDataBorrow(event: BorrowEvent) {
  assert(event.args);

  const borrowPosition = Pool__factory.connect(event.address, api);
  const poolPosition = await borrowPosition.getPosition(event.args.receiver);

  let poolDataObject = await PoolDataEntity.get(event.address);
  if (poolDataObject) {
    poolDataObject.totalBorrowVolume =
      poolDataObject.totalBorrowVolume + event.args.assets.toBigInt();

    const poolEventData = PoolEventArgs.create({
      id: event.address.toString(),
      account: event.args.receiver,
      depositAmount: ZERO_BI,
      withdrawAmount: ZERO_BI,
      borrowAmount: event.args.assets?.toBigInt(),
      repayAmount: ZERO_BI,
      depositShares: ZERO_BI,
      withdrawShares: ZERO_BI,
      borrowShares: event.args.shares?.toBigInt(),
      repayShares: ZERO_BI,
      addcollateral: ZERO_BI,
      removecollateral: ZERO_BI,
    });

    if (poolPosition) {
      poolEventData.addcollateral = poolPosition.collateral.toBigInt();
    }

    await handlePoolHourData(
      poolDataObject,
      ZERO_BI,
      ZERO_BI,
      event.args.assets?.toBigInt(),
      ZERO_BI
    );
    await handlePoolDayData(
      poolDataObject,
      ZERO_BI,
      ZERO_BI,
      event.args.assets?.toBigInt(),
      ZERO_BI
    );
    // USER DATA
    // handleUserData(poolDataObject, poolEventData);

    await poolDataObject.save();

    let txn = UserAction.create({
      id: event.transaction.hash.concat(event.logIndex?.toString()),
      action: ActionType.BORROW,
      poolAddress: event.address,
      assets: event.args.assets?.toBigInt(),
      caller: event.args.receiver,
      userId: event.transaction.from,
      receiver: event.args.receiver,
      shares: event.args.shares?.toBigInt(),
      blockNumber: BigInt(event.block.number),
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
      poolId: event.address,
      vaultAddress: event.address,
      vaultId: event.address,
      isVault: false,
      tokenId: poolDataObject.loanTokenId,
    });

    await txn.save();
  }
}
export async function handlePoolDataRepay(event: RepayEvent) {
  assert(event.args);

  let poolDataObject = await PoolDataEntity.get(event.address);
  if (poolDataObject) {
    poolDataObject.totalRepayVolume =
      poolDataObject.totalRepayVolume + event.args.assets?.toBigInt();

    const poolEventData = PoolEventArgs.create({
      id: event.address.toString(),
      account: event.args.onBehalf,
      depositAmount: ZERO_BI,
      withdrawAmount: ZERO_BI,
      borrowAmount: ZERO_BI,
      repayAmount: event.args.assets?.toBigInt(),
      depositShares: ZERO_BI,
      withdrawShares: ZERO_BI,
      borrowShares: ZERO_BI,
      repayShares: event.args.shares?.toBigInt(),
      addcollateral: ZERO_BI,
      removecollateral: ZERO_BI,
    });

    await handlePoolHourData(
      poolDataObject,
      ZERO_BI,
      ZERO_BI,
      ZERO_BI,
      event.args.assets?.toBigInt()
    );
    await handlePoolDayData(
      poolDataObject,
      ZERO_BI,
      ZERO_BI,
      ZERO_BI,
      event.args.assets?.toBigInt()
    );
    // USER DATA
    // handleUserData(poolDataObject, poolEventData);

    await poolDataObject.save();

    let txn = UserAction.create({
      id: event.transaction.hash.concat(event.logIndex?.toString()),

      poolAddress: event.address,

      poolId: event.address,

      caller: event.args.onBehalf,
      userId: event.args.onBehalf,
      receiver: event.args.onBehalf,

      assets: event.args.assets?.toBigInt(),
      shares: event.args.shares?.toBigInt(),

      blockNumber: BigInt(event.block.number),
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,

      action: ActionType.REPAY,
      tokenId: poolDataObject.loanTokenId,

      isVault: false,
    });
    await txn.save();
  }
}

export async function handlePoolDataAddCollateral(
  event: SupplyCollateralEvent
) {
  assert(event.args);

  let poolDataObject = await PoolDataEntity.get(event.address);
  if (poolDataObject) {
    poolDataObject.totalBorrowVolume =
      poolDataObject.totalBorrowVolume + event.args.assets?.toBigInt();
    const poolEventData = PoolEventArgs.create({
      id: event.address.toString(),
      account: event.args.onBehalf,
      depositAmount: ZERO_BI,
      withdrawAmount: ZERO_BI,
      borrowAmount: ZERO_BI,
      repayAmount: ZERO_BI,
      depositShares: ZERO_BI,
      withdrawShares: ZERO_BI,
      borrowShares: ZERO_BI,
      repayShares: ZERO_BI,
      addcollateral: event.args.assets?.toBigInt(),
      removecollateral: ZERO_BI,
    });

    // TODO: add collateral tracking on pools
    await handlePoolHourData(
      poolDataObject,
      ZERO_BI,
      ZERO_BI,
      ZERO_BI,
      ZERO_BI
    );
    await handlePoolDayData(poolDataObject, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI);
    // USER DATA
    // handleUserData(poolDataObject, poolEventData);

    await poolDataObject.save();

    let txn = UserAction.create({
      id: event.transaction.hash.concat(event.logIndex?.toString()),

      poolAddress: event.address,

      poolId: event.address,

      caller: event.args.onBehalf,
      userId: event.args.onBehalf,
      receiver: event.args.onBehalf,

      assets: event.args.assets?.toBigInt(),
      shares: event.args.assets?.toBigInt(),

      blockNumber: BigInt(event.block.number),
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,

      action: ActionType.ADD_COLLATERAL,
      tokenId: poolDataObject.loanTokenId,

      isVault: false,
    });
    await txn.save();
  }
}
export async function handlePoolDataRemoveCollateral(
  event: WithdrawCollateralEvent
) {
  assert(event.args);

  let poolDataObject = await PoolDataEntity.get(event.address);
  if (poolDataObject) {
    poolDataObject.totalBorrowVolume =
      poolDataObject.totalBorrowVolume + event.args.assets.toBigInt();

    const poolEventData = PoolEventArgs.create({
      id: event.address.toString(),
      account: event.args.onBehalf,
      depositAmount: ZERO_BI,
      withdrawAmount: ZERO_BI,
      borrowAmount: ZERO_BI,
      repayAmount: ZERO_BI,
      depositShares: ZERO_BI,
      withdrawShares: ZERO_BI,
      borrowShares: ZERO_BI,
      repayShares: ZERO_BI,
      addcollateral: ZERO_BI,
      removecollateral: event.args.assets?.toBigInt(),
    });

    // TODO: add collateral tracking on pools
    await handlePoolHourData(
      poolDataObject,
      ZERO_BI,
      ZERO_BI,
      ZERO_BI,
      ZERO_BI
    );
    await handlePoolDayData(poolDataObject, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI);
    // USER DATA
    // handleUserData(poolDataObject, poolEventData);

    await poolDataObject.save();

    let txn = UserAction.create({
      id: event.transaction.hash.concat(event.logIndex?.toString()),

      poolAddress: event.address,

      poolId: event.address,

      caller: event.args.onBehalf,
      userId: event.args.onBehalf,
      receiver: event.args.onBehalf,

      assets: event.args.assets?.toBigInt(),
      shares: event.args.assets?.toBigInt(),

      blockNumber: BigInt(event.block.number),
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,

      action: ActionType.REMOVE_COLLATERAL,
      tokenId: poolDataObject.loanTokenId,

      isVault: false,
    });
    await txn.save();
  }
}
