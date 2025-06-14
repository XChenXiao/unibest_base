import { httpGet, httpPost } from '@/utils/http'

/**
 * 实名认证请求参数接口
 */
export interface IVerificationParams {
  real_name: string
  id_card_number: string
}

/**
 * 实名认证状态接口
 */
export interface IVerificationStatus {
  id: number
  user_id: number
  status: 'pending' | 'approved' | 'rejected'
  real_name: string
  id_card_number: string
  remark?: string
  verified_at?: string
  created_at: string
  updated_at: string
}

// 验证接口返回类型
export interface VerificationResponse {
  status: string
  message?: string
  data?: {
    verification?: {
      real_name: string
      id_card_number: string
      verified_at?: string
      updated_at?: string
      status?: string
    }
  }
}

/**
 * 获取用户实名认证状态
 */
export const getVerificationStatusAPI = () => {
  return httpGet<VerificationResponse>('/api/verification/status')
}

/**
 * 提交实名认证
 */
export const submitVerificationAPI = (data: {
  real_name: string
  id_card_number: string
}) => {
  return httpPost<VerificationResponse>('/api/verification/submit', data)
}

/**
 * 更新实名信息
 */
export const updateVerificationAPI = (data: {
  real_name: string
  id_card_number: string
}) => {
  return httpPost<VerificationResponse>('/api/verification/update', data)
}