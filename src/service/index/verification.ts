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
  user_id: number
  status: 'pending' | 'approved' | 'rejected'
  real_name: string
  id_card_number: string
  id_card_front: string
  id_card_back: string
  id_card_front_url: string
  id_card_back_url: string
  remark?: string
  verified_at?: string
  created_at: string
  updated_at: string
}

/**
 * 获取用户实名认证状态
 */
export const getVerificationStatusAPI = () => {
  return http.get<{
    status: string;
    data?: {
      verification?: IVerificationStatus;
      verification_status: 'pending' | 'approved' | 'rejected' | 'unsubmitted';
      is_verified: boolean;
    };
  }>('/api/verification/status')
}

/**
 * 提交实名认证
 */
export const submitVerificationAPI = (data: {
  real_name: string;
  id_card_number: string;
  id_card_front: string;
  id_card_back: string;
  face_image?: string;
}) => {
  return http.post<any>('/api/verification/submit', data)
} 