import { http } from '@/utils/http'

/**
 * 实名认证请求参数接口
 */
export interface IVerificationParams {
  real_name: string
  id_card_number: string
  id_card_front: string
  id_card_back: string
}

/**
 * 实名认证状态接口
 */
export interface IVerificationStatus {
  id: number
  status: 'pending' | 'approved' | 'rejected'
  real_name: string
  id_card_number: string
  id_card_front: string
  id_card_back: string
  rejection_reason?: string
  created_at: string
  updated_at: string
}

/**
 * 提交实名认证API
 * @param params 实名认证参数
 * @returns Promise
 */
export const submitVerificationAPI = (params: IVerificationParams) => {
  return http.post<IVerificationStatus>('/api/verification/submit', params)
}

/**
 * 查询认证状态API
 * @returns Promise
 */
export const getVerificationStatusAPI = () => {
  return http.get<IVerificationStatus>('/api/verification/status')
} 