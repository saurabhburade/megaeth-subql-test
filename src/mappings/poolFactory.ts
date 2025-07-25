import { PoolCreatedLog as PoolCreatedEvent } from "../types/abi-interfaces/PoolFactory";
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
  Token,
  Unpaused,
} from "../types/models";

// import { handlePoolDataCreation } from "./entities/poolData";
import { ERC20Fetcher__factory, Pool, Pool__factory } from "../types/contracts";

import {
  MULTICALL_ERC20,
  ONE_BD,
  ONE_BI,
  ZERO_BD,
  ZERO_BI,
  ZERO_BN,
} from "../utils/constants";
// import { handleTokenPrice } from "./entities/token";
// import { handlePoolDayData } from "./intervals/poolDayDatas";
// import { handlePoolHourData } from "./intervals/poolHourDatas";
import { createPoolDatasource } from "../types";
import assert from "assert";
import { EthereumBlock } from "@subql/types-ethereum";
import { BigNumber } from "ethers";
import { handlePoolDataCreation } from "../entities/poolData";

export async function handlePoolCreated(event: PoolCreatedEvent) {
  assert(event.args);

  let poolFactory = await PoolFactory.get(ONE_BI.toString());
  let entity = await PoolCreated.get(event.args.pool);
  if (!entity) {
    logger.info("CREATING NEW POOL DATA SOURCE ::: {}", [
      event.args.pool.toString(),
    ]);
    // track only if whitelisted
    // await createPoolDatasource({ address: event.args.pool });
  }
  if (!entity) {
    if (!poolFactory) {
      poolFactory = PoolFactory.create({
        id: ONE_BI.toString(),
        timestamp: event.block.timestamp,
        lastUpdate: event.block.timestamp,
        totalPools: ZERO_BI,
        totalWhitelistedPools: ZERO_BI,
      });
    }

    poolFactory.lastUpdate = event.block.timestamp;
    poolFactory.totalPools = poolFactory.totalPools + ONE_BI;
    await poolFactory.save();
    const poolAddress = event.args.pool;
    const poolContract = Pool__factory.connect(poolAddress, api);

    const multicallErc20Contract = ERC20Fetcher__factory.connect(
      MULTICALL_ERC20,
      api
    );
    const poolCompleteDataRaw =
      await multicallErc20Contract.getPoolsCompleteData([poolAddress]);
    const poolCompleteData = poolCompleteDataRaw[0];
    // // TODO: batch in single rpc call
    // let poolData = poolContract.getPoolData();
    let orderbookRes = await poolContract.getOrderbook();
    // let poolConfig = poolContract.getPoolConfig();

    if (poolCompleteData) {
      const oraclePrices = poolCompleteData;
      let loantoken = await Token.get(event.args.loanToken);
      if (!loantoken) {
        const tokenBasicDetails = await multicallErc20Contract.getTokenDetails([
          event.args!.loanToken,
        ]);
        if (tokenBasicDetails) {
          logger.info(
            "ORDERBOOK CREATED :: FOR LOAN TOKEN ADDRESS:{} NAME:{} SYMBOL:{} DECIMALS:{}",
            [
              event.args.loanToken.toString(),
              tokenBasicDetails[0].name,
              tokenBasicDetails[0].symbol,
              tokenBasicDetails[0].decimals.toString(),
            ]
          );

          loantoken = Token.create({
            id: event.args!.loanToken,

            address: event.args!.loanToken,
            blockNumber: BigInt(event.blockNumber),
            blockTimestamp: event.block.timestamp,
            decimals: BigInt(tokenBasicDetails[0].decimals),
            name: tokenBasicDetails[0].name,
            rate: ZERO_BD,
            symbol: tokenBasicDetails[0].symbol,
            transactionHash: event.transaction.hash,
            updatedAt: event.block.timestamp,
          });

          if (oraclePrices.loanPrice) {
            loantoken.rate = oraclePrices.loanPrice.div(10 ** 8).toNumber();
          }
          loantoken.dataFeedId = event.args.loanToken;
          loantoken.updatedAt = event.block.timestamp;
          loantoken.blockNumber = BigInt(event.block.number);
          loantoken.blockTimestamp = event.block.timestamp;
          loantoken.transactionHash = event.transaction.hash;
          await loantoken.save();
        }
      } else {
        if (oraclePrices.loanPrice) {
          loantoken.rate = oraclePrices.loanPrice.div(10 ** 8).toNumber();
        }
        loantoken.updatedAt = event.block.timestamp;
        loantoken.blockNumber = BigInt(event.block.number);
        loantoken.blockTimestamp = event.block.timestamp;
        loantoken.transactionHash = event.transaction.hash;
        await loantoken.save();
      }
      let collateralToken = await Token.get(event.args.collateralToken);
      if (!collateralToken) {
        const tokenBasicDetails = await multicallErc20Contract.getTokenDetails([
          event.args!.collateralToken,
        ]);
        if (tokenBasicDetails) {
          logger.info(
            "ORDERBOOK CREATED :: FOR COLLATERAL TOKEN ADDRESS:{} NAME:{} SYMBOL:{} DECIMALS:{}",
            [
              event.args.collateralToken.toString(),
              tokenBasicDetails[0].name,
              tokenBasicDetails[0].symbol,
              tokenBasicDetails[0].decimals.toString(),
            ]
          );

          collateralToken = Token.create({
            id: event.args!.collateralToken,

            address: event.args!.collateralToken,
            blockNumber: BigInt(event.blockNumber),
            blockTimestamp: event.block.timestamp,
            decimals: BigInt(tokenBasicDetails[0].decimals),
            name: tokenBasicDetails[0].name,
            rate: ZERO_BD,
            symbol: tokenBasicDetails[0].symbol,
            transactionHash: event.transaction.hash,
            updatedAt: event.block.timestamp,
          });

          if (!oraclePrices.collateralPrice) {
            collateralToken.rate =
              Number(oraclePrices.collateralPrice ?? 0) / 10 ** 8;
          }
          collateralToken.dataFeedId = event.args.collateralToken;
          collateralToken.updatedAt = event.block.timestamp;
          collateralToken.blockNumber = BigInt(event.block.number);
          collateralToken.blockTimestamp = event.block.timestamp;
          collateralToken.transactionHash = event.transaction.hash;
          await collateralToken.save();
        }
      } else {
        if (!oraclePrices.collateralPrice) {
          collateralToken.rate =
            Number(oraclePrices.collateralPrice ?? 0) / 10 ** 8;
        }
        collateralToken.updatedAt = event.block.timestamp;
        collateralToken.blockNumber = BigInt(event.block.number);
        collateralToken.blockTimestamp = event.block.timestamp;
        collateralToken.transactionHash = event.transaction.hash;
        await collateralToken.save();
      }
      logger.info("New Pool Created: {}", [event.args.pool.toString()]);
      entity = PoolCreated.create({
        id: event.args.pool,
        PoolAddress: event.args.pool,
        blockNumber: BigInt(event.blockNumber),
        blockTimestamp: event.block.timestamp,

        transactionHash: event.transaction.hash,
        Orderbook_id: orderbookRes,
        params_collateralToken: event.args.collateralToken,
        params_irm: poolCompleteData[2].irm,
        params_lltv: poolCompleteData[2].lltv?.toBigInt(),
        params_loanToken: event.args.loanToken,
        params_oracle: poolCompleteData[2].oracle,
      });

      await entity.save();
      await handlePoolDataCreation(
        event,
        poolCompleteData,
        orderbookRes,
        loantoken,
        collateralToken
      );
    }
  }
}

export async function handleBlockForPools(block: EthereumBlock) {
  try {
    const poolFactory = await PoolFactory.get(ONE_BI.toString());
    const multicallErc20Contract = ERC20Fetcher__factory.connect(
      MULTICALL_ERC20,
      api
    );

    if (poolFactory && poolFactory !== null) {
      const totalPools = poolFactory?.totalPools ?? ZERO_BI;
      const chunkSize = 10;
      for (let start = 0; start < totalPools; start += chunkSize) {
        const pools: PoolDataEntity[] = await PoolDataEntity.getByFields([], {
          limit: chunkSize,
          offset: start,
        });
        logger.info(
          `handleBlockForPools POOL DATA start::${start} totalPools::${totalPools} chunkSize::${chunkSize} getByFields poolsLength::${pools.length}`
        );
        const poolAddresses = pools?.map((p) => p.id);
        const completePoolsDatas =
          await multicallErc20Contract.getPoolsCompleteData(poolAddresses);
        for (let index = 0; index < pools.length; index++) {
          const poolEntry = pools[index];
          const completePooldataRes = completePoolsDatas[index];

          logger.info(
            `POOL FOUND AT INDEX :: ${index.toString()} POOL :: ${poolEntry.id.toString()}`
          );
          // Process each pool here

          const ir = completePooldataRes.interestRate || ZERO_BN;
          const ltv = completePooldataRes.ltv || ZERO_BN;
          const depositApy = completePooldataRes.apy || ZERO_BN;
          const poolDataStats = completePooldataRes.poolData;
          const totalSupplyAssets = poolDataStats.totalSupplyAssets || ZERO_BN;
          const totalSupplyShares = poolDataStats.totalSupplyShares || ZERO_BN;
          const totalBorrowAssets = poolDataStats.totalBorrowAssets || ZERO_BN;
          const totalBorrowShares = poolDataStats.totalBorrowShares || ZERO_BN;
          poolEntry.depositApy = depositApy.toBigInt();

          const lastUpdate = poolDataStats.lastUpdate || ZERO_BN;
          const fee = ZERO_BI;
          let assetsMultiplier = ONE_BD;
          let borrowMultiplier = ZERO_BD;

          if (completePooldataRes[2].loanToken) {
            const loanToken = await Token.get(completePooldataRes[2].loanToken);
            if (loanToken) {
              assetsMultiplier = BigNumber.from(totalSupplyAssets.add(ONE_BI))
                .div(BigNumber.from(totalSupplyShares).add(ONE_BD))
                .toNumber();

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
                  .toNumber()
              : ZERO_BD;

          poolEntry.totalSupplyAssets = totalSupplyAssets?.toBigInt();
          poolEntry.totalSupplyShares = totalSupplyShares?.toBigInt();
          poolEntry.totalBorrowAssets = totalBorrowAssets?.toBigInt();
          poolEntry.totalBorrowShares = totalBorrowShares?.toBigInt();
          poolEntry.lastUpdate = lastUpdate?.toBigInt();
          poolEntry.fee = fee;
          poolEntry.utilization = utilization;
          poolEntry.ir = ir?.toBigInt();
          poolEntry.ltv = ltv?.toBigInt();
          poolEntry.convertToAssetsMultiplier = assetsMultiplier;
          poolEntry.convertBorrowAssetsMultiplier = borrowMultiplier;
          poolEntry.depositApy = depositApy?.toBigInt();

          await poolEntry.save();

          // handlePoolHourData(poolEntry, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI);
          // handlePoolDayData(poolEntry, ZERO_BI, ZERO_BI, ZERO_BI, ZERO_BI);
          if (poolEntry.loanTokenId) {
            const loanToken = await Token.get(poolEntry.loanTokenId);
            if (loanToken !== null) {
              const loanTokenPrice = completePooldataRes.loanPrice;
              const parsedPrice = BigNumber.from(loanTokenPrice)
                .div(BigNumber.from(10 ** 8))
                .toNumber();
              // handleTokenPrice(loanToken, parsedPrice, block.timestamp);
            }
          }
          if (poolEntry.collateralTokenId) {
            const collateralToken = await Token.get(
              poolEntry.collateralTokenId!
            );
            if (collateralToken !== null) {
              const rawPrice = completePooldataRes.collateralPrice;
              const parsedPrice = BigNumber.from(rawPrice).div(
                BigNumber.from(10 ** 8)
              );
              // handleTokenPrice(collateralToken, parsedPrice, block.timestamp);
            }
          }
          logger.info(
            "handleBlockForPools POOL DATA pool::{} ir::{} ltv::{} depositApy::{}",
            [
              poolEntry.id.toString(),
              ir.toString(),
              ltv.toString(),
              depositApy.toString(),
            ]
          );
        }
      }
    } else {
      logger.error(`NO POOL FACTORY`);

      throw Error("NO POOL FACTORY");
    }
  } catch (error) {
    logger.error(`handleBlockForPools ERROR ${error}`);
    throw error;
  }
}
