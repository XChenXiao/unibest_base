import { http } from '@/utils/request'

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
 * 获取实名认证状态
 * @returns Promise<VerificationResponse>
 */
export const getVerificationStatusAPI = (): Promise<VerificationResponse> => {
  return http.get('/api/verification/status')
}

/**
 * 提交实名认证
 * @param data 实名认证数据
 * @returns Promise<VerificationResponse>
 */
export const submitVerificationAPI = (data: {
  real_name: string
  id_card_number: string
}): Promise<VerificationResponse> => {
  return http.post('/api/verification/submit', data)
}

/**
 * 更新实名信息
 * @param data 实名认证数据
 * @returns Promise<VerificationResponse>
 */
export const updateVerificationAPI = (data: {
  real_name: string
  id_card_number: string
}): Promise<VerificationResponse> => {
  return http.post('/api/verification/update', data)
} 