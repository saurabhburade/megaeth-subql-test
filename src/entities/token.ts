import { BigNumber } from "ethers";
import { Token, TokenDayData, TokenHourData } from "../types/models";

export async function handleTokenPrice(
  token: Token,
  rate: number,
  timestamp: BigInt
) {
  token.rate = rate;
  token.updatedAt = BigInt(timestamp?.toString());
  await handleDayDataTokenPrice(token, rate, timestamp);
  await handleHourDataTokenPrice(token, rate, timestamp);
  await token.save();
}
export async function handleDayDataTokenPrice(
  token: Token,
  rate: number,
  timestamp: BigInt
) {
  let dayID = BigNumber.from(timestamp).div(86400)?.toBigInt();
  let pdayID = BigNumber.from(timestamp).sub(86400).div(86400)?.toBigInt();

  let intervalEntityId = token.id.concat("_DAY_").concat(dayID.toString());
  let intervalEntityIdPrev = token.id.concat("_DAY_").concat(pdayID.toString());
  let tokenIntervalData = await TokenDayData.get(intervalEntityId);

  if (!tokenIntervalData) {
    tokenIntervalData = TokenDayData.create({
      id: intervalEntityId,
      rate: rate,
      updatedAt: BigInt(timestamp?.toString()),
      dayId: dayID,
      tokenId: token.id,
      prevDayDataId: intervalEntityIdPrev,
    });
    tokenIntervalData.dayId = dayID;
    tokenIntervalData.rate = rate;
    tokenIntervalData.updatedAt = BigInt(timestamp?.toString());
  }
  tokenIntervalData.updatedAt = BigInt(timestamp?.toString());
  tokenIntervalData.prevDayDataId = intervalEntityIdPrev;

  // Average price
  tokenIntervalData.rate = BigNumber.from(tokenIntervalData.rate)
    .add(rate)
    .div(2)
    ?.toNumber();

  token.rate = rate;
  token.updatedAt = BigInt(timestamp?.toString());
  await tokenIntervalData.save();
  await token.save();
}
export async function handleHourDataTokenPrice(
  token: Token,
  rate: number,
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

  let intervalEntityId = token.id.concat("_HOUR_").concat(hourID.toString());
  let intervalEntityIdPrev = token.id
    .concat("_HOUR_")
    .concat(pHourID.toString());

  let tokenIntervalData = await TokenHourData.get(intervalEntityId);

  if (!tokenIntervalData) {
    tokenIntervalData = TokenHourData.create({
      id: intervalEntityId,
      rate: rate,
      updatedAt: BigInt(timestamp?.toString()),
      hourId: hourID,
      tokenId: token.id,
      prevHourDataId: intervalEntityIdPrev,
    });
    tokenIntervalData.hourId = hourID;
    tokenIntervalData.rate = rate;
    tokenIntervalData.updatedAt = BigInt(timestamp?.toString());
  }
  tokenIntervalData.updatedAt = BigInt(timestamp?.toString());

  tokenIntervalData.prevHourDataId = intervalEntityIdPrev;

  // Average price
  tokenIntervalData.rate = BigNumber.from(tokenIntervalData.rate)
    .add(rate)
    .div(2)
    ?.toNumber();

  token.updatedAt = BigInt(timestamp?.toString());

  token.rate = rate;
  await tokenIntervalData.save();
  await token.save();
}
