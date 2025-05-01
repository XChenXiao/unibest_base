/* eslint-disable */
import { request } from '@/utils/request';

/**
 * 交易记录类型
 */
export interface TransactionRecord {
  id: number;
  transaction_no?: string;
  type: string;
  type_text: string;
  amount: string;
  asset_name: string;
  asset_symbol: string;
  price?: string;
  fee?: string;
  total?: string;
  status: string;
  status_text: string;
  description: string;
  created_at: string;
  completed_at?: string;
  is_income?: boolean; // 前端计算的属性：收入还是支出
}

/**
 * 用户信息类型
 */
export interface UserInfo {
  id: number;
  name?: string;
  balance?: string;
  frozen_balance?: string;
  equity_balance?: string;
  invite_code?: string;
  phone?: string;
  is_verified?: boolean;
  user?: {
    id: number;
    balance?: string;
    bank_card?: {
      bank_name?: string;
      card_number?: string;
    }
  }
}

/**
 * 分页信息
 */
export interface Pagination {
  total: number;
  per_page: number;
  current_page: number;
  last_page: number;
}

/**
 * 分页响应数据
 */
export interface PaginatedResponse<T> {
  data: T[];
  pagination: Pagination;
}

/**
 * 响应数据结构
 */
export interface WalletApiResponse<T> {
  status: string;
  message: string;
  data: T;
}

/**
 * 获取余额变动记录
 * @param page 页码
 * @param perPage 每页记录数
 */
export const getBalanceTransactions = async (page: number = 1, perPage: number = 10) => {
  const response = await request<WalletApiResponse<PaginatedResponse<TransactionRecord>>>(
    '/api/user/records/balance',
    {
      method: 'GET',
      params: {
        page,
        per_page: perPage
      }
    }
  );

  // 处理收入/支出标记
  if (response?.status === 'success' && response.data?.data) {
    const recordsArray = response.data.data;
    
    // 确保是数组并且有数据
    if (Array.isArray(recordsArray) && recordsArray.length > 0) {
      // 为每条记录添加is_income标志
      recordsArray.forEach((record, index) => {
        recordsArray[index] = {
          ...record,
          is_income: isIncomeTransaction(record.type)
        };
      });
    }
  }

  return response;
};

/**
 * 获取所有交易记录
 * @param page 页码
 * @param perPage 每页记录数
 * @param type 记录类型过滤 (all, currency, equity, balance)
 * @param startDate 开始日期 (YYYY-MM-DD)
 * @param endDate 结束日期 (YYYY-MM-DD)
 */
export const getAllTransactions = async (
  page: number = 1, 
  perPage: number = 10,
  type: string = 'all',
  startDate?: string,
  endDate?: string
) => {
  const response = await request<WalletApiResponse<PaginatedResponse<TransactionRecord>>>(
    '/api/user/records/all',
    {
      method: 'GET',
      params: {
        page,
        per_page: perPage,
        type,
        start_date: startDate,
        end_date: endDate
      }
    }
  );

  // 处理收入/支出标记
  if (response?.status === 'success' && response.data?.data) {
    const recordsArray = response.data.data;
    
    // 确保是数组并且有数据
    if (Array.isArray(recordsArray) && recordsArray.length > 0) {
      // 为每条记录添加is_income标志
      recordsArray.forEach((record, index) => {
        recordsArray[index] = {
          ...record,
          is_income: isIncomeTransaction(record.type)
        };
      });
    }
  }

  return response;
};

/**
 * 判断交易类型是否为收入
 * @param type 交易类型
 * @returns boolean 是否为收入
 */
const isIncomeTransaction = (type: string): boolean => {
  // 收入类型: 出售, 充值, 奖励, 退款, 收入
  const incomeTypes = [
    'sell', 
    'recharge', 
    'reward', 
    'refund', 
    'income', 
    'equity_sell'
  ];
  return incomeTypes.includes(type);
};

/**
 * 获取货币交易记录
 * @param page 页码
 * @param perPage 每页记录数
 * @param type 记录类型过滤 (all, buy, sell, reward)，不传则获取所有
 * @returns 货币交易记录
 */
export const getCurrencyTransactions = async (
  page: number = 1,
  perPage: number = 10,
  type?: string
) => {
  const response = await request<WalletApiResponse<PaginatedResponse<TransactionRecord>>>(
    '/api/user/records/currency',
    {
      method: 'GET',
      params: {
        page,
        per_page: perPage,
        type
      }
    }
  );

  // 处理收入/支出标记
  if (response?.status === 'success' && response.data?.data) {
    const recordsArray = response.data.data;
    
    // 确保是数组并且有数据
    if (Array.isArray(recordsArray) && recordsArray.length > 0) {
      // 为每条记录添加is_income标志
      recordsArray.forEach((record, index) => {
        recordsArray[index] = {
          ...record,
          is_income: isIncomeTransaction(record.type)
        };
      });
    }
  }

  return response;
}; 