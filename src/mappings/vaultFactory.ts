import { VaultCreatedLog as VaultCreatedEvent } from "../types/abi-interfaces/VaultFactory";
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
  PoolManagerSet,
  Token,
  Unpaused,
  VaultDataEntity,
  VaultFactory,
} from "../types/models";
// import {
//   Pool as PoolTemplate,
//   Vault as VaultTemplate,
// } from "../generated/templates";

import {
  MULTICALL_ERC20,
  ONE_BD,
  ONE_BI,
  ZERO_BD,
  ZERO_BI,
} from "../utils/constants";

import {
  handleDayDataVault,
  handleHourDataVault,
  handleVaultWithdraw,
} from "../entities/vault";
import { ERC20Fetcher__factory, Vault__factory } from "../types/contracts";
import assert from "assert";
import { BigNumber } from "ethers";
import { createVaultDatasource } from "../types";
import { EthereumBlock } from "@subql/types-ethereum";

export async function handleVaultCreated(event: VaultCreatedEvent) {
  assert(event.args);

  let vaultFactory = await VaultFactory.get(ONE_BI.toString());
  if (!vaultFactory) {
    vaultFactory = VaultFactory.create({
      id: ONE_BI.toString(),
      timestamp: event.block.timestamp,
      lastUpdate: event.block.timestamp,
      totalVaults: ZERO_BI,
    });
    vaultFactory.totalVaults = ZERO_BI;
    vaultFactory.timestamp = event.block.timestamp;
  }
  vaultFactory.totalVaults = BigNumber.from(vaultFactory.totalVaults)
    .add(ONE_BI)
    ?.toBigInt();
  vaultFactory.lastUpdate = event.block.timestamp;

  // get vault details through multicall
  const multicallErc20Contract = ERC20Fetcher__factory.connect(
    MULTICALL_ERC20,
    api
  );
  const vaultBasicDetails = await multicallErc20Contract.getTokenDetails([
    event.args.vault,
  ]);
  let vault = VaultDataEntity.create({
    id: event.args.vault,
    manager: event.args.poolManager,
    timestamp: event.block.timestamp,
    lastUpdate: event.block.timestamp,
    fee: ZERO_BI,
    depositApy: ZERO_BI,
    convertToAssetsMultiplier: 0,
    totalDepositsVolume: ZERO_BI,
    totalWithdrawalsVolume: ZERO_BI,
    totalAssets: ZERO_BI,
    totalShares: ZERO_BI,
    vaultFactoryId: ONE_BI.toString(),
    decimals: BigInt(vaultBasicDetails[0].decimals),
    name: vaultBasicDetails[0].name,
    symbol: vaultBasicDetails[0].symbol,
  });
  if (vaultBasicDetails) {
    logger.info("VAULT FOUND ADDRESS:{} NAME:{} SYMBOL:{} DECIMALS:{}", [
      event.args.vault,
      vaultBasicDetails[0].name,
      vaultBasicDetails[0].symbol,
      vaultBasicDetails[0].decimals.toString(),
    ]);
    vault.name = vaultBasicDetails[0].name;
    vault.symbol = vaultBasicDetails[0].symbol;
    vault.decimals = BigInt(vaultBasicDetails[0].decimals);
  }

  vault.depositApy = ZERO_BI;
  vault.manager = event.args.poolManager;
  vault.timestamp = event.block.timestamp;
  vault.lastUpdate = event.block.timestamp;
  vault.fee = ZERO_BI;
  vault.convertToAssetsMultiplier = ONE_BD;
  vault.totalDepositsVolume = ZERO_BI;
  vault.totalWithdrawalsVolume = ZERO_BI;
  vault.totalAssets = ZERO_BI;
  vault.totalShares = ZERO_BI;

  vault.vaultFactoryId = ONE_BI.toString();

  vault.fee = ZERO_BI;

  let token = await Token.get(event.args.token);
  if (!token) {
    const tokenBasicDetails = await multicallErc20Contract.getTokenDetails([
      event.args.token,
    ]);
    if (tokenBasicDetails) {
      logger.info(
        "ORDERBOOK CREATED :: FOR LOAN TOKEN ADDRESS:{} NAME:{} SYMBOL:{} DECIMALS:{}",
        [
          event.args.token,
          tokenBasicDetails[0].name,
          tokenBasicDetails[0].symbol,
          tokenBasicDetails[0].decimals.toString(),
        ]
      );

      token = Token.create({
        id: event.args.token,
        symbol: tokenBasicDetails[0].symbol,
        name: tokenBasicDetails[0].name,
        decimals: BigInt(tokenBasicDetails[0].decimals),
        rate: ZERO_BD,
        updatedAt: event.block.timestamp,
        blockNumber: BigInt(event.block.number),
        blockTimestamp: event.block.timestamp,
        transactionHash: event.transaction.hash,
        address: event.args.token,
      });
      token.decimals = BigInt(tokenBasicDetails[0].decimals);
      token.name = tokenBasicDetails[0].name;
      token.symbol = tokenBasicDetails[0].symbol;
      token.address = event.args.token;
      token.rate = ZERO_BD;
      token.dataFeedId = event.args.token;
      token.updatedAt = event.block.timestamp;
      token.blockNumber = BigInt(event.block.number);
      token.blockTimestamp = event.block.timestamp;
      token.transactionHash = event.transaction.hash;
      await token.save();
    }
  }
  if (token) {
    vault.tokenId = token.id;
  }
  await vaultFactory.save();
  await vault.save();
  // TRACK VAULT

  await createVaultDatasource({ address: event?.args?.vault });
}

export async function handleBlockForVaults(block: EthereumBlock) {
  const vaultFactory = await VaultFactory.get(ONE_BI.toString());
  const multicallErc20Contract = ERC20Fetcher__factory.connect(
    MULTICALL_ERC20,
    api
  );
  if (vaultFactory) {
    const totalVaults = vaultFactory?.totalVaults ?? ZERO_BI;
    const chunkSize = 10;
    for (let start = 0; start < totalVaults; start += chunkSize) {
      const vaults: VaultDataEntity[] = await VaultDataEntity.getByFields([], {
        limit: chunkSize,
        offset: start,
      });

      logger.info(
        `handleBlockForVaults VAULT DATA start::${start} totalPools::${totalVaults} chunkSize::${chunkSize} getByFields poolsLength::${vaults.length}`
      );
      const poolAddresses = vaults?.map((v) => v.id);
      const vaultConversionFactorDataRaw =
        await multicallErc20Contract.getVaultExchangeRates(poolAddresses);
      const calculateAverageAPYCalls = vaults?.map((v) => ({
        callData: "0x14f6ca87", // calculateAverageAPY()
        target: v?.id,
      }));
      const averageAPYRaw = await multicallErc20Contract.aggregate(
        calculateAverageAPYCalls
      );
      for (let index = 0; index < vaults.length; index++) {
        const vaultConversionFactorData = vaultConversionFactorDataRaw[index];
        const vaultEntry = vaults[index];
        logger.info(
          `VAULT FOUND AT INDEX :: ${index.toString()}  INDEX :: ${
            vaultEntry.id
          }  calculateAverageAPY :: ${averageAPYRaw[index]?.returnData}`
        );

        const vaultContract = Vault__factory.connect(vaultEntry.id, api);
        const averageAPY = await vaultContract.calculateAverageAPY();

        if (vaultConversionFactorData) {
          vaultEntry.convertToAssetsMultiplier =
            vaultConversionFactorData.exchangeRate?.toNumber();
        }
        if (averageAPY) {
          vaultEntry.depositApy = averageAPY.toBigInt();
        }
        vaultEntry.lastUpdate = block.timestamp;
        handleHourDataVault(vaultEntry, block.timestamp);
        handleDayDataVault(vaultEntry, block.timestamp);
        vaultEntry.save();
      }
    }
  }
}
