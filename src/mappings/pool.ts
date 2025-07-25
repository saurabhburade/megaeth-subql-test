import {
  AccrueInterestLog as AccrueInterestEvent,
  ApprovalLog as ApprovalEvent,
  BorrowLog as BorrowEvent,
  DepositLog as DepositEvent,
  FlashLoanLog as FlashLoanEvent,
  LiquidateLog as LiquidateEvent,
  RepayLog as RepayEvent,
  DepositCollateralLog as SupplyCollateralEvent,
  TransferLog as TransferEvent,
  WithdrawLog as WithdrawEvent,
  WithdrawCollateralLog as WithdrawCollateralEvent,
} from "../types/abi-interfaces/Pool";
import {
  AccrueInterest,
  Approval,
  Borrow,
  Deposit,
  Deposit1,
  FlashLoan,
  Liquidate,
  PoolAction,
  UserAction,
  PoolDataEntity,
  PoolEventArgs,
  PoolFactory,
  Repay,
  SetAuthorization,
  SupplyCollateral,
  Token,
  Transfer,
  UserDataPoolEntity,
  Withdraw,
  Withdraw1,
  WithdrawCollateral,
} from "../types/models";
import {
  handlePoolData,
  handlePoolDataAddCollateral,
  handlePoolDataBorrow,
  handlePoolDataDeposit,
  handlePoolDataRemoveCollateral,
  handlePoolDataRepay,
  handlePoolDataWithdraw,
} from "../entities/poolData";
import {
  LOAN_TOKEN_DECIMALS,
  MULTICALL_ERC20,
  ONE_BD,
  ONE_BI,
  ZERO_ADDRESS,
  ZERO_BD,
  ZERO_BI,
} from "../utils/constants";
// import { handleUserData, handleUserPoolData } from "./entities/userData";
import { Pool } from "../types/contracts/Pool";
import assert from "assert";
import { ActionType } from "../types";
import { BigNumber } from "ethers";

// import { handlePoolHourData } from "./intervals/poolHourDatas";
// import { handlePoolDayData } from "./intervals/poolDayDatas";
// import { RedStoneOracle } from "../generated/PoolFactory/RedStoneOracle";
// import { handleTokenPrice } from "./entities/token";

export async function handleAccrueInterest(event: AccrueInterestEvent) {
  try {
    assert(event.args);

    const poolData = await PoolDataEntity.get(event.address);

    logger.info(
      `POOL AccrueInterest :: ${
        poolData ? poolData.depositApy.toString() : "No pool data"
      }`
    );
    let entity = AccrueInterest.create({
      id: event.transaction.hash.concat(event.logIndex.toString()),
      blockNumber: BigInt(event.block.number),
      blockTimestamp: event.block.timestamp,
      Pool_id: event.address,
      prevBorrowRate: event.args.prevBorrowRate?.toBigInt(),
      interest: event.args.interest?.toBigInt(),
      feeShares: event.args.feeShares?.toBigInt(),
      transactionHash: event.transaction.hash,
    });

    if (poolData && poolData.isWhitelisted) {
      await handlePoolData(event);
    } else {
      logger.info(
        `POOL NOT FOUND OR NOT WHITELISTED ${
          poolData ? poolData.isWhitelisted : "not found"
        }`
      );
    }
    await entity.save();
  } catch (error) {
    logger.error(
      `ERROR :: 67 handleAccrueInterest :: ${error} hash::${event.transactionHash}`
    );
    throw error;
  }
}

export async function handleApproval(event: ApprovalEvent) {
  try {
    assert(event.args);

    let entity = Approval.create({
      id: event.transaction.hash.concat(event.logIndex.toString()),

      owner: event.args?.owner,
      spender: event.args?.spender,
      value: event.args.value?.toBigInt(),

      blockNumber: BigInt(event.block.number),
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
    });

    await entity.save();
  } catch (error) {
    logger.error(
      `ERROR :: handleApproval :: ${error} hash::${event.transactionHash}`
    );
    throw error;
  }
}

export async function handleBorrow(event: BorrowEvent) {
  try {
    assert(event.args);

    let entity = Borrow.create({
      id: event.transaction.hash.concat(event.logIndex.toString()),
      Pool_id: event.address,

      caller: event.args?.caller,
      onBehalf: event.args?.onBehalf,
      receiver: event.args?.receiver,

      assets: event.args.assets?.toBigInt(),
      shares: event.args.shares?.toBigInt(),

      blockNumber: BigInt(event.block.number),
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
    });

    const poolData = await PoolDataEntity.get(event.address);
    if (poolData && poolData.isWhitelisted) {
      await handlePoolDataBorrow(event);
    }
    await entity.save();
  } catch (error) {
    logger.error(
      `ERROR :: handleBorrow :: ${error} :: hash::${event.transactionHash}`
    );
    throw error;
  }
}

export async function handleDeposit(event: DepositEvent) {
  try {
    assert(event.args);

    logger.info(
      `146 handleDeposit : TRACKING ACCOUNT : ${event.transaction.from} POOL : ${event.address} SENDER :${event.args.sender} LOGIDX:${event.logIndex} TXIDX:${event.transactionIndex}`
    );

    let entity = Deposit.create({
      id: event.transaction.hash.concat(event.logIndex.toString()),
      Pool_id: event.address,

      caller: event.args?.owner,
      isVault: false,
      assets: event.args.assets?.toBigInt(),
      shares: event.args.shares?.toBigInt(),

      blockNumber: BigInt(event.block.number),
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
    });

    const poolData = await PoolDataEntity.get(event.address);
    if (poolData && poolData.isWhitelisted) {
      await handlePoolDataDeposit(event);
    }
    await entity.save();
  } catch (error) {
    logger.error(
      `ERROR :: handleDeposit :: ${error} :: hash::${event.transactionHash}`
    );
    throw error;
  }
}

export async function handleFlashLoan(event: FlashLoanEvent) {
  try {
    assert(event.args);

    let entity = FlashLoan.create({
      id: event.transaction.hash.concat(event.logIndex.toString()),

      caller: event.args?.caller,
      assets: event.args.assets?.toBigInt(),

      token: event.args.token,

      blockNumber: BigInt(event.block.number),
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
    });

    await entity.save();
  } catch (error) {
    logger.error(
      `ERROR :: handleFlashLoan :: ${error} :: hash::${event.transactionHash}`
    );
    throw error;
  }
}

export async function handleLiquidate(event: LiquidateEvent) {
  try {
    assert(event.args);

    let entity = Liquidate.create({
      id: event.transaction.hash.concat(event.logIndex.toString()),

      Pool_id: event.address,
      caller: event.args?.caller,
      borrower: event.args?.borrower,

      repaidAssets: event.args.repaidAssets?.toBigInt(),
      repaidShares: event.args.repaidShares?.toBigInt(),
      seizedAssets: event.args.seizedAssets?.toBigInt(),
      badDebtAssets: event.args.badDebtAssets?.toBigInt(),
      badDebtShares: event.args.badDebtShares?.toBigInt(),

      blockNumber: BigInt(event.block.number),
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
    });

    await entity.save();
  } catch (error) {
    logger.error(
      `ERROR :: handleLiquidate :: ${error} :: hash::${event.transactionHash}`
    );
    throw error;
  }
}

export async function handleRepay(event: RepayEvent) {
  try {
    assert(event.args);

    let entity = Repay.create({
      id: event.transaction.hash.concat(event.logIndex.toString()),

      Pool_id: event.address,
      caller: event.args?.caller,
      onBehalf: event.args?.onBehalf,

      assets: event.args.assets?.toBigInt(),
      shares: event.args.shares?.toBigInt(),

      blockNumber: BigInt(event.block.number),
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
    });

    await entity.save();

    const poolData = await PoolDataEntity.get(event.address);
    if (poolData && poolData.isWhitelisted) {
      await handlePoolDataRepay(event);
    }
    await entity.save();
  } catch (error) {
    logger.error(
      `ERROR :: handleRepay :: ${error} :: hash::${event.transactionHash}`
    );
    throw error;
  }
}

export async function handleSupplyCollateral(event: SupplyCollateralEvent) {
  try {
    assert(event.args);

    let entity = SupplyCollateral.create({
      id: event.transaction.hash.concat(event.logIndex.toString()),

      Pool_id: event.address,
      caller: event.args?.caller,
      onBehalf: event.args?.onBehalf,

      assets: event.args.assets?.toBigInt(),

      blockNumber: BigInt(event.block.number),
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
    });

    await entity.save();

    const pool = await PoolDataEntity.get(event.address);
    let txn = await UserAction.get(
      event.transaction.hash.concat(event.logIndex.toString())
    );

    if (!txn && pool && pool.isWhitelisted) {
      txn = UserAction.create({
        id: event.transaction.hash.concat(event.logIndex.toString()),

        poolAddress: event.address,

        poolId: event.address,

        userId: event.args.onBehalf,
        caller: event.args.onBehalf,
        receiver: event.args.onBehalf,

        assets: event.args.assets?.toBigInt(),
        shares: event.args.assets?.toBigInt(),

        blockNumber: BigInt(event.block.number),
        blockTimestamp: event.block.timestamp,
        transactionHash: event.transaction.hash,

        action: ActionType.ADD_COLLATERAL,
        isVault: false,
        tokenId: pool?.collateralTokenId,
      });

      await txn.save();
    }
    const poolData = await PoolDataEntity.get(event.address);
    if (poolData && poolData.isWhitelisted) {
      await handlePoolDataAddCollateral(event);
    }
    await entity.save();
  } catch (error) {
    logger.error(
      `ERROR :: handleSupplyCollateral :: ${error} :: hash::${event.transactionHash}`
    );
    throw error;
  }
}

export async function handleTransfer(event: TransferEvent) {
  try {
    assert(event.args);

    let entity = Transfer.create({
      id: event.transaction.hash.concat(event.logIndex.toString()),

      from: event.args.from,
      to: event.args.to,

      value: event.args.value?.toBigInt(),

      blockNumber: BigInt(event.block.number),
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
    });

    await entity.save();

    // Handle position transfer
    const pool = await PoolDataEntity.get(event.address);

    if (pool && pool.isWhitelisted) {
      // FROM
      const isFromZero =
        event.args.from.toLowerCase() == ZERO_ADDRESS?.toLowerCase()
          ? true
          : false;

      const isToZero =
        event.args.to.toLowerCase() == ZERO_ADDRESS?.toLowerCase()
          ? true
          : false;

      if (pool && !isFromZero && !isToZero) {
        const loanToken = await Token.get(pool.loanTokenId!);
        let sharesToAssets = ONE_BD;
        if (loanToken) {
          sharesToAssets =
            pool.convertToAssetsMultiplier *
            BigNumber.from(event.args.value)
              .mul(10 ** Number(loanToken.decimals))
              ?.toNumber();
        }

        // USER DATA for POOL for FROM
        const poolEventData = PoolEventArgs.create({
          id: event.address.toString(),
          account: event.args.from,
          depositAmount: ZERO_BI,
          withdrawAmount: BigInt(sharesToAssets.toFixed(0)),
          borrowAmount: ZERO_BI,
          repayAmount: ZERO_BI,
          depositShares: ZERO_BI,
          withdrawShares: event.args.value?.toBigInt(),
          borrowShares: ZERO_BI,
          repayShares: ZERO_BI,
          addcollateral: ZERO_BI,
          removecollateral: ZERO_BI,
        });

        // await  handleUserData(pool, poolEventData);
        let txnFrom = await UserAction.get(
          event.transaction.hash.concat(event.transaction.from)
        );

        if (!txnFrom) {
          txnFrom = UserAction.create({
            id: event.transaction.hash.concat(event.transaction.from),

            poolAddress: event.address,
            poolId: event.address,

            caller: event.args.from,
            userId: event.args.from,
            receiver: event.args.to,

            assets: BigInt(sharesToAssets.toFixed(0)),
            shares: event.args.value?.toBigInt(),

            blockNumber: BigInt(event.block.number),
            blockTimestamp: event.block.timestamp,
            transactionHash: event.transaction.hash,

            action: ActionType.TRANSFER,
            isVault: false,
            tokenId: pool?.loanTokenId,
          });

          await txnFrom.save();
        }
        // USER DATA for POOL for TO

        const poolEventDataTo = PoolEventArgs.create({
          id: event.address.toString(),
          account: event.args.to,
          depositAmount: BigInt(sharesToAssets.toFixed(0)),
          withdrawAmount: ZERO_BI,
          borrowAmount: ZERO_BI,
          repayAmount: ZERO_BI,
          depositShares: event.args.value?.toBigInt(),
          withdrawShares: ZERO_BI,
          borrowShares: ZERO_BI,
          repayShares: ZERO_BI,
          addcollateral: ZERO_BI,
          removecollateral: ZERO_BI,
        });

        // handleUserData(pool, poolEventDataTo);
        let txnTo = await UserAction.get(
          event.transaction.hash.concat(event.args.to)
        );

        if (!txnTo) {
          txnTo = UserAction.create({
            id: event.transaction.hash.concat(event.args.to),

            poolAddress: event.address,
            poolId: event.address,

            caller: event.args.to,
            userId: event.args.to,
            receiver: event.args.to,

            assets: BigInt(sharesToAssets.toFixed(0)),
            shares: event.args.value?.toBigInt(),

            blockNumber: BigInt(event.block.number),
            blockTimestamp: event.block.timestamp,
            transactionHash: event.transaction.hash,

            action: ActionType.TRANSFER,
            isVault: false,
            tokenId: pool?.loanTokenId,
          });

          await txnTo.save();
        }
      }
    }

    await entity.save();
  } catch (error) {
    logger.error(
      `ERROR :: handleTransfer :: ${error} :: hash::${event.transactionHash}`
    );
    throw error;
  }
}

export async function handleWithdraw(event: WithdrawEvent) {
  logger.info(`HANDLE WITHDRAW :: hash::${event.transaction.hash}`);
  if (
    event.args &&  event?.args[0]?.toLowerCase() !== event?.address?.toLowerCase()
  ) {
  logger.info(`INSIDE WITHDRAW :: hash::${event?.args[0]?.toLowerCase()}`);

    try {
      let entity = Withdraw.create({
        id: event.transaction.hash.concat(event.logIndex.toString()),

        Pool_id: event.address,

        caller: event.args.sender,
        receiver: event.args.receiver,

        assets: event.args.assets?.toBigInt(),
        shares: event.args.shares?.toBigInt(),

        blockNumber: BigInt(event.block.number),
        blockTimestamp: event.block.timestamp,
        transactionHash: event.transaction.hash,
        isVault: false,
      });

      const poolData = await PoolDataEntity.get(event.address);
      if (poolData && poolData.isWhitelisted) {
        await handlePoolDataWithdraw(event);
      }
      await entity.save();
    } catch (error) {
      logger.error(
        `ERROR :: handleWithdraw :: ${error} :: hash::${event.transaction.hash}`
      );
      throw error;
    }
  }
}

export async function handleWithdrawCollateral(event: WithdrawCollateralEvent) {
  try {
    assert(event.args);

    let entity = WithdrawCollateral.create({
      id: event.transaction.hash.concat(event.logIndex.toString()),

      Pool_id: event.address,

      caller: event.args.caller,
      onBehalf: event.args.onBehalf,
      receiver: event.args.receiver,

      assets: event.args.assets?.toBigInt(),

      blockNumber: BigInt(event.block.number),
      blockTimestamp: event.block.timestamp,
      transactionHash: event.transaction.hash,
    });

    const pool = await PoolDataEntity.get(event.address);
    let txn = await UserAction.get(
      event.transaction.hash.concat(event.logIndex.toString())
    );

    if (txn == null && pool && pool.isWhitelisted) {
      txn = UserAction.create({
        id: event.transaction.hash.concat(event.logIndex.toString()),

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
        isVault: false,
        tokenId: pool?.loanTokenId,
      });

      await txn.save();
    }
    const poolData = await PoolDataEntity.get(event.address);
    if (poolData && poolData.isWhitelisted) {
      await handlePoolDataRemoveCollateral(event);
    }
    await entity.save();
  } catch (error) {
    logger.error(
      `ERROR :: handleWithdrawCollateral :: ${error} :: hash::${event.transactionHash}`
    );
    throw error;
  }
}
