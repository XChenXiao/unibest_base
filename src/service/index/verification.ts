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
 * 获取用户实名认证状态
 */
export const getVerificationStatusAPI = () => {
  return http.get<{
    status: string;
    verified: boolean;
    pending: boolean;
    rejected: boolean;
    rejection_reason?: string;
  }>('/api/verification/status')
}

/**
 * 提交实名认证
 */
export const submitVerificationAPI = (data: {
  real_name: string;
  id_card_number: string;
  id_card_front_image: string;
  id_card_back_image: string;
  face_image?: string;
}) => {
  return http.post<any>('/api/verification/submit', data)
} 