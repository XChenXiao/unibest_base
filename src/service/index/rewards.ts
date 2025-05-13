import { http } from '@/utils/http'

/**
 * 注册奖励项接口
 */
export interface IRegisterReward {
  id: number
  description: string
  sort_order: number
  is_enabled: boolean
  created_at: string
  updated_at: string
}

/**
 * 获取注册奖励列表API响应接口
 */
export interface IRegisterRewardsResponse {
  status: string
  data?: IRegisterReward[]
  message?: string
}

/**
 * 获取注册奖励列表
 */
export const getRegisterRewardsAPI = () => {
  return http.get<IRegisterRewardsResponse>('/api/register-rewards')
} 