import { httpGet, httpPost, httpPut } from '@/utils/http';
import type { IResData } from '@/types/response';

// 支付宝账户信息接口
export interface AlipayAccount {
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
 * 获取支付宝账户列表
 */
export const getAlipayAccounts = async () => {
  return await httpGet<AlipayAccount[]>('/api/alipay-accounts');
};

/**
 * 获取支付信息
 */
export const getPaymentInfo = async () => {
  return await httpGet<PaymentInfo>('/api/payment-info');
};

/**
 * 更新支付宝账户
 */
export const updateAlipayAccount = async (id: number, data: Partial<AlipayAccount>) => {
  return await httpPut<AlipayAccount>(`/api/alipay-accounts/${id}`, data);
};

/**
 * 创建支付宝账户
 */
export const createAlipayAccount = async (data: Omit<AlipayAccount, 'id'>) => {
  return await httpPost<AlipayAccount>('/api/alipay-accounts', data);
};

/**
 * 更新支付信息
 */
export const updatePaymentInfo = async (data: { alipay_qrcode: string }) => {
  return await httpPost<PaymentInfo>('/api/payment-info', data);
}; 