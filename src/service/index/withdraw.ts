import { http } from '@/utils/http'

/**
 * 提现申请参数接口
 */
export interface IWithdrawParams {
  amount: number
  bank_card_id: number
  withdraw_password: string
}

/**
 * 提现记录接口
 */
export interface IWithdrawRecord {
  id: number
  user_id: number
  bank_card_id: number
  amount: number
  fee: number
  actual_amount: number
  status: 'pending' | 'completed' | 'rejected' | 'failed'
  transaction_no: string
  remark: string
  created_at: string
  updated_at: string
  reviewed_at?: string
  bank_card?: {
    bank_name: string
    card_number: string
    masked_card_number: string
  }
}

/**
 * 提交提现申请
 * @param params 提现参数
 */
export const applyWithdrawAPI = (params: IWithdrawParams) => {
  return http.post<{
    status: string
    message: string
    data?: {
      withdraw_id: number
      amount: number
      status: string
    }
  }>('/api/withdraw/apply', params)
}

/**
 * 获取提现记录列表
 */
export const getWithdrawRecordsAPI = () => {
  return http.get<{
    status: string
    data: {
      current_page: number
      data: IWithdrawRecord[]
      per_page: number
      total: number
    }
  }>('/api/withdraw/records')
}

/**
 * 获取提现记录详情
 * @param id 提现记录ID
 */
export const getWithdrawDetailAPI = (id: number) => {
  return http.get<{
    status: string
    data: IWithdrawRecord
  }>(`/api/withdraw/records/${id}`)
} 