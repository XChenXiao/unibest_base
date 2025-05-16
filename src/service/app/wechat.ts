import { httpGet, httpPost, httpPut } from '@/utils/http';
import type { IResData } from '@/types/response';

// 微信账户信息接口
export interface WechatAccount {
  id: number;
  account: string;
  real_name: string;
  is_default: boolean;
}

// 支付信息接口
export interface PaymentInfo {
  wechat_name: string | null;
  wechat_phone: string | null;
  wechat_qrcode_url: string | null;
  alipay_qrcode_url: string | null;
}

/**
 * 获取微信账户列表
 */
export const getWechatAccounts = async () => {
  return await httpGet<WechatAccount[]>('/api/wechat-accounts');
};

/**
 * 获取支付信息
 */
export const getPaymentInfo = async () => {
  return await httpGet<PaymentInfo>('/api/payment-info');
};

/**
 * 更新微信账户
 */
export const updateWechatAccount = async (id: number, data: Partial<WechatAccount>) => {
  return await httpPut<WechatAccount>(`/api/wechat-accounts/${id}`, data);
};

/**
 * 创建微信账户
 */
export const createWechatAccount = async (data: Omit<WechatAccount, 'id'>) => {
  return await httpPost<WechatAccount>('/api/wechat-accounts', data);
};

/**
 * 更新支付信息参数接口
 */
export interface UpdatePaymentInfoParams {
  // wechat_account: string;
  // wechat_real_name: string;
  wechat_qrcode: string;
}

/**
 * 更新支付信息
 */
export const updatePaymentInfo = async (data: UpdatePaymentInfoParams) => {
  return await httpPost<PaymentInfo>('/api/payment-info', data);
}; 