import { http } from '@/utils/http'

/**
 * 账户开户相关接口
 */

/**
 * 开户费用配置接口
 */
export interface IAccountOpenFeeConfig {
  open_fee: number
  min_deposit_amount: number
  payment_types: {
    alipay: string
    wxpay: string
    qqpay: string
    bank: string
  }
  description: string
  required_fields: {
    name: string
    phone: string
    id_card: string
    address: string
    deposit_amount: string
  }
}

/**
 * 开户订单数据接口
 */
export interface IAccountOpenOrder {
  transaction_id: number
  transaction_no: string
  order_id: string
  out_trade_no: string
  trade_no: string
  pay_type: string
  pay_info: string
  open_fee: number
  deposit_amount: number
  total_amount: number
}

/**
 * 开户订单状态接口
 */
export interface IAccountOpenOrderStatus {
  order_id: string
  transaction_no: string
  out_trade_no: string
  trade_no: string
  amount: number
  status: 'pending' | 'completed' | 'failed'
  payment_status: 'pending' | 'paid' | 'failed'
  account_status: 'inactive' | 'active'
  created_at: string
  completed_at?: string
}

/**
 * 获取账户开户费用配置
 */
export const getAccountOpenFeeAPI = () => {
  return http.get<{
    status: string
    message: string
    data: IAccountOpenFeeConfig
  }>('/api/account-open/fee')
}

/**
 * 创建开户支付订单
 */
export const createAccountOpenOrderAPI = (data: {
  payment_type: 'alipay' | 'wxpay' | 'qqpay' | 'bank'
  deposit_amount: number
  user_info: {
    name: string
    phone: string
    id_card: string
    address: string
  }
}) => {
  return http.post<{
    status: string
    message: string
    data: IAccountOpenOrder
  }>('/api/account-open/create-order', data)
}

/**
 * 查询开户订单状态
 */
export const queryAccountOpenOrderAPI = (orderId: string) => {
  return http.get<{
    status: string
    message: string
    data: IAccountOpenOrderStatus
  }>(`/api/account-open/query/${orderId}`)
}

/**
 * 获取开户记录
 */
export const getAccountOpenRecordsAPI = () => {
  return http.get<{
    status: string
    data: any
  }>('/api/account-open/records')
}
