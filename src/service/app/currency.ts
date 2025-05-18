import { Currency, UserCurrency, UserAssets } from './types';
import { httpGet, httpPost } from "@/utils/http";

/**
 * 获取所有货币列表
 */
export async function getCurrencyList() {
  return httpGet<{ status: string; data: Currency[] }>(
    '/api/currencies'
  );
}

/**
 * 获取单个货币详情
 */
export async function getCurrencyDetail(id: number | string) {
  return httpGet<{ status: string; data: Currency }>(
    `/api/currencies/${id}`
  );
}

/**
 * 获取用户持有的货币列表
 */
export async function getUserCurrencies() {
  return httpGet<{ status: string; data: UserCurrency[] }>(
    '/api/user/currencies'
  );
}

/**
 * 获取用户资产概览
 */
export async function getUserAssets() {
  return httpGet<{ status: string; data: UserAssets }>(
    '/api/user/assets'
  );
}

/**
 * 获取平台发布的货币订单
 * @param params 查询参数
 */
export async function getPlatformOrders(params?: { type?: string; currency_id?: number | string }) {
  return httpGet<{ 
    status: string; 
    data: Array<{
      id: number | string;
      order_no: string;
      type: string;
      type_text: string;
      currency_id: number | string;
      currency_name: string;
      currency_symbol: string;
      currency_icon: string;
      price: string | number;
      amount: string | number;
      remaining_amount: string | number;
      min_order_amount: string | number;
      total_amount: string | number;
      fee_rate: string | number;
      status: string;
      created_at: string;
    }>
  }>(
    '/api/currencies/trade-orders',
    params
  );
}

/**
 * 购买订单
 * @param orderId 订单ID
 * @param amount 购买数量
 */
export async function buyTradeOrder(orderId: number | string, amount: number) {
  try {
    const response = await httpPost<{ status: string; message: string; data: any }>(
      `/api/currencies/trade-orders/${orderId}/buy`,
      {
        amount
      }
    );
    
    return response;
  } catch (error: any) {
    console.error('购买交易出错:', error);
    
    // 处理网络错误或其他异常情况
    if (error.response && error.response.data) {
      // 返回API服务器的错误响应
      return error.response.data;
    }
    
    // 如果没有响应数据，创建一个标准错误响应
    return {
      status: 'error',
      message: error.message || '购买失败，请稍后再试'
    };
  }
}

/**
 * 领取货币奖励
 */
export async function claimCurrency(currencyId: number | string) {
  return httpPost<{ status: string; message: string }>(
    '/api/user/currencies/claim',
    {
      currencyId: currencyId
    }
  );
}

/**
 * 出售货币（卖给平台）
 */
export async function sellCurrencyToPlatform(currencyId: number | string, amount: number, price?: number) {
  try {
    const response = await httpPost<{ status: string; message: string }>(
      '/api/currencies/sell-to-platform',
      {
        currency_id: currencyId,
        amount
      }
    );
    
    return response;
  } catch (error: any) {
    console.error('卖出货币出错:', error);
    // 如果没有响应数据，创建一个标准错误响应
    return {
      status: 'error',
      message: error.data || '卖出失败，请稍后再试'
    };
  }
}

/**
 * 购买USDT
 * @param amount 购买数量
 */
export async function buyUsdt(amount: number) {
  return httpPost<{ 
    status: string; 
    message: string;
    data?: {
      transaction_id: number;
      amount: number;
      total: number;
    }
  }>(
    '/api/orders/buy-usdt',
    {
      amount
    }
  );
}

// 用户信息接口响应类型
export interface UserResponse {
  status: string;
  data: {
    user: {
      balance: string;
      frozen_balance: string;
      [key: string]: any;
    };
    verification_status?: string;
    [key: string]: any;
  }
}

// 余额响应类型
export interface BalanceResponse {
  status: string;
  data: {
    balance: number;
    frozen_balance: number;
  }
}

/**
 * 获取用户余额
 */
export async function getUserBalance() {
  return httpGet<any>(
    '/api/user'
  ).then(res => {
    // 从用户信息中提取余额数据
    if (res.status === 'success' && res.data && res.data.user) {
      return {
        status: 'success',
        data: {
          balance: Number(res.data.user.balance),
          frozen_balance: Number(res.data.user.frozen_balance)
        }
      };
    }
    // 返回默认余额
    return {
      status: 'success',
      data: {
        balance: 0,
        frozen_balance: 0
      }
    };
  });
} 