import { http } from '@/utils/http'

/**
 * 充值请求参数接口
 */
export interface IRechargeParams {
  amount: number
  payment_type: 'alipay' | 'wxpay' | 'qqpay' | 'bank'
}

/**
 * 余额信息接口
 */
export interface IBalanceInfo {
  balance: number
  frozen_balance: number
  available_balance: number
}

/**
 * 充值响应数据接口
 */
export interface IRechargeResponse {
  transaction_id: number
  transaction_no: string
  order_id: string
  out_trade_no: string
  trade_no?: string
  pay_type?: string
  pay_info?: string
  amount: number
}

/**
 * 交易记录接口
 */
export interface IBalanceTransaction {
  id: number
  transaction_no: string
  amount: number
  type: string
  status: string
  remark?: string
  created_at: string
  completed_at?: string
}

/**
 * 分页数据接口
 */
export interface IPaginatedResponse<T> {
  data: T[]
  current_page: number
  last_page: number
  per_page: number
  total: number
}

/**
 * 充值订单状态查询响应接口
 */
export interface IRechargeOrderStatus {
  order_id: string
  transaction_no: string
  out_trade_no: string
  trade_no?: string
  amount: number
  status: string
  payment_status: string
  created_at: string
  completed_at?: string
}

/**
 * 用户充值API
 * @param params 充值参数
 * @returns Promise
 */
export const rechargeAPI = (params: IRechargeParams) => {
  return http.post<{
    status: string
    message: string
    data: IRechargeResponse
  }>('/api/balance/recharge', params)
}

/**
 * 查询充值订单状态API
 * @param orderId 订单ID
 * @returns Promise
 */
export const queryRechargeOrderAPI = (orderId: string) => {
  return http.get<{
    status: string
    message: string
    data: IRechargeOrderStatus
  }>(`/api/balance/recharge/${orderId}`)
}

/**
 * 获取用户余额信息API
 * @returns Promise
 */
export const getBalanceAPI = () => {
  return http.get<{
    status: string
    data: IBalanceInfo
  }>('/api/balance')
}

/**
 * 获取用户余额交易记录API
 * @param page 页码
 * @returns Promise
 */
export const getBalanceTransactionsAPI = (page: number = 1) => {
  return http.get<{
    status: string
    data: IPaginatedResponse<IBalanceTransaction>
  }>(`/api/balance/transactions?page=${page}`)
} 