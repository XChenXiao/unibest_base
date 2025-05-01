import { http } from '@/utils/http';
import { IResData } from '@/types/response';

export interface UserEquity {
  id: number;
  user_id: number;
  share_amount: string;
  total_cost: string;
  frozen_amount: string;
  created_at: string;
  updated_at: string;
}

export interface EquityData {
  user_equity: UserEquity;
  available_amount: number;
}

export interface EquityInfo {
  id: number;
  name: string;
  price: string;
  total_share: string;
  available_share: string;
  min_purchase: string;
  min_sell: string;
  is_active: boolean;
  created_at: string;
  updated_at: string;
}

export interface RewardConfig {
  id: number;
  type: 'registration' | 'invitation';
  level: number;
  amount: number;
  is_active: boolean;
  description: string;
  created_at: string;
  updated_at: string;
}

export interface RewardConfigsData {
  rewards: RewardConfig[];
  user_info: {
    has_claimed: boolean;
    has_claimable: boolean;
    invited_count: number;
  };
  claimable_rewards: any[];
}

export interface EquityTransaction {
  id: number;
  user_id: number;
  type: 'buy' | 'sell' | 'reward';
  amount: string;
  price: string;
  total: string;
  status: string;
  remark: string;
  created_at: string;
  updated_at: string;
}

export interface EquityTransactionResponse {
  current_page: number;
  data: EquityTransaction[];
  first_page_url: string;
  from: number;
  last_page: number;
  last_page_url: string;
  links: any[];
  next_page_url: string | null;
  path: string;
  per_page: number;
  prev_page_url: string | null;
  to: number;
  total: number;
}

/**
 * 获取股权基本信息
 */
export function getEquityInfo(): Promise<IResData<EquityInfo>> {
  return http.get('/api/equity') as Promise<IResData<EquityInfo>>;
}

/**
 * 获取当前用户股权持有情况
 */
export function getMyEquity(): Promise<IResData<EquityData>> {
  console.log('调用股权API: /api/equity/my');
  return http.get('/api/equity/my')
    .then((res: any) => {
      console.log('股权API返回数据:', res);
      return res as IResData<EquityData>;
    })
    .catch((error: any) => {
      console.error('获取股权数据失败:', error);
      throw error;
    }) as Promise<IResData<EquityData>>;
}

/**
 * 获取股权奖励配置信息
 */
export function getRewardConfigs(): Promise<IResData<RewardConfigsData>> {
  return http.get('/api/equity/reward/configs') as Promise<IResData<RewardConfigsData>>;
}

/**
 * 出售股权
 */
export function sellEquity(amount: number): Promise<IResData<any>> {
  return http.post('/api/equity/sell', { amount }) as Promise<IResData<any>>;
}

/**
 * 领取股权奖励
 */
export function claimReward(transactionId: number): Promise<IResData<any>> {
  return http.post('/api/equity/rewards/claim', { transaction_id: transactionId }) as Promise<IResData<any>>;
}

/**
 * 按类型领取股权奖励 (兼容旧接口)
 * @param type 奖励类型 - register(注册奖励) 或 invitation(邀请奖励) 
 */
export function claimEquityReward(type: 'register' | 'invitation' | string): Promise<IResData<any>> {
  if (type === 'invite') {
    type = 'invitation'; // 兼容前端使用的invite类型
  }
  
  // 旧版本接口调用 - 按类型领取
  return http.post('/api/equity/rewards/claim-by-type', { type }) as Promise<IResData<any>>;
}

/**
 * 获取当前用户股权交易记录
 * @param page 页码
 * @param perPage 每页条数
 * @returns 股权交易记录
 */
export function getEquityTransactions(page: number = 1, perPage: number = 10): Promise<IResData<EquityTransactionResponse>> {
  return http.get('/api/equity/transactions', {
    params: { page, per_page: perPage }
  }) as Promise<IResData<EquityTransactionResponse>>;
}

/**
 * 获取用户股权记录，可根据类型筛选
 * @param type 记录类型：all(全部), reward(奖励), sell(卖出)
 * @param page 页码
 * @param perPage 每页条数
 * @returns 股权记录数据
 */
export function getEquityRecords(type: 'all' | 'reward' | 'sell' = 'all', page: number = 1, perPage: number = 10): Promise<IResData<EquityTransactionResponse>> {
  // 使用User Records API获取用户股权交易记录
  const baseUrl = '/api/user/records/equity';
  
  // 调试日志
  console.log('getEquityRecords请求参数:', { type, page, per_page: perPage });
  
  return http.get(baseUrl, {
    type, 
    page, 
    per_page: perPage
  }) as Promise<IResData<EquityTransactionResponse>>;
} 