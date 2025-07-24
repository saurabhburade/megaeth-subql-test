import { BigNumber } from "ethers";

export const ZERO_BI = BigInt(0);
export const ZERO_BN = BigNumber.from(0);
export const ONE_BI = BigInt(1);
export const TWO_BI = BigInt("2");
export const ZERO_BD = 0;
export const ONE_BD = 1;
export const BI_18 = BigInt(18);
export const SECONDS_PER_DAY = 86400;
export const SECONDS_PER_HOUR = 3600;
export const SECONDS_PER_MINUTE = 60;
export const SECONDS_PER_YEAR = 31536000;
export const SECONDS_PER_MONTH = 2592000;
export const SECONDS_PER_WEEK = 604800;
// decimal of shares - decimal of underlying asset
export const LOAN_TOKEN = "0xd54414e2703108E170970546d0083a844F5c473C";
export const LOAN_TOKEN_DECIMALS = 6;
export const COLLATERAL_TOKEN = "0x84cd9C36ffAf48401425e51206171E98aec9fB6B";
export const COLLATERAL_TOKEN_DECIMALS = 18;
export const POOL_SHARES_DECIMALS = 18;
export const DECIMAL_OFFSET = POOL_SHARES_DECIMALS - LOAN_TOKEN_DECIMALS;
export const ZERO_ADDRESS = "0x0000000000000000000000000000000000000000";
export const MULTICALL_ERC20 = "0x47F016B7204fC8439252c71BBA7d0a8D725600ca";
