// 从各个模块导出API
import { getBankCardsAPI } from './index/bankcard';
import { applyWithdrawAPI as withdraw, applyBankCardWithdrawAPI } from './index/withdraw';
import { getUserInfo } from './app/user';
import { getUserBalance, buyUsdt, getUserAssets, getUserCurrencies, getCurrencyList } from './app/currency';
import { getEquityInfo, getMyEquity, sellEquity, getRewardConfigs, claimReward, claimEquityReward } from './app/equity';

// 重新导出
export { 
  getBankCardsAPI as getUserBankCards,
  withdraw,
  applyBankCardWithdrawAPI,
  getUserInfo,
  getUserBalance,
  buyUsdt,
  getUserAssets,
  getUserCurrencies,
  getCurrencyList,
  getEquityInfo,
  getMyEquity,
  sellEquity,
  getRewardConfigs,
  claimReward,
  claimEquityReward
}; 