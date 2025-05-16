import { http } from '@/utils/http'
import qs from 'qs'
import { useUserStore } from '@/store'

// 登录状态检查函数
const checkLoginStatus = (): boolean => {
  const userStore = useUserStore()
  const isLoggedIn = userStore.isLogined // 使用计算属性来判断是否已登录
  
  if (!isLoggedIn) {
    uni.showToast({
      title: '请先登录',
      icon: 'none'
    })
    
    // 可选：自动跳转到登录页
    setTimeout(() => {
      uni.navigateTo({ url: '/pages/login/index' })
    }, 1500)
  }
  
  return isLoggedIn
}

/**
 * 银行卡数据接口
 */
export interface IBankCard {
  id: number
  bank_name: string
  card_number: string
  card_holder: string
  branch_name?: string
  is_default: boolean
  created_at: string
  updated_at: string
  masked_card_number: string
}

/**
 * 银行卡开户申请记录接口
 */
export interface IBankCardOpenRecord {
  id: number
  user_id: number
  fee_amount: number
  transaction_id: string
  status: 'pending' | 'completed' | 'rejected' | 'failed'
  name: string
  phone: string
  id_card: string
  address: string
  remarks?: string
  admin_user_id?: number
  reviewed_at?: string
  created_at: string
  updated_at: string
  status_text?: string
}

/**
 * 银行卡状态响应接口
 */
export interface IBankCardStatusResponse {
  status: string
  data: {
    has_bank_card: boolean
    bank_card_opened_at: string | null
    latest_application: null | {
      id: number
      status: string
      status_text: string
      created_at: string
      reviewed_at: string | null
      remarks: string | null
    }
    open_fee: string | number
    can_apply: boolean
  }
}

/**
 * 获取银行卡开通手续费
 */
export const getBankCardOpenFeeAPI = () => {
  // 检查登录状态
  if (!checkLoginStatus()) {
    return Promise.reject(new Error('用户未登录'))
  }
  
  return http.get<any>('/api/bank-card/open-fee')
}

/**
 * 申请开通银行卡
 */
export const openBankCardAPI = (data: {
  name: string
  phone: string
  id_card: string
  address: string
}) => {
  // 检查登录状态
  if (!checkLoginStatus()) {
    return Promise.reject(new Error('用户未登录'))
  }
  
  // 使用标准JSON格式提交，与其他API保持一致
  console.log('提交银行卡开户申请:', data)
  return http.post<any>('/api/bank-card/open', data)
}

/**
 * 获取用户的银行卡开户申请记录
 */
export const getBankCardOpenRecordsAPI = () => {
  // 检查登录状态
  if (!checkLoginStatus()) {
    return Promise.reject(new Error('用户未登录'))
  }
  
  return http.get<any>('/api/bank-card/open-records')
}

/**
 * 查询用户银行卡开户申请状态和银行卡账户开通状态
 */
export const checkBankCardStatusAPI = () => {
  // 检查登录状态
  if (!checkLoginStatus()) {
    return Promise.reject(new Error('用户未登录'))
  }
  
  return http.get<IBankCardStatusResponse>('/api/bank-card/status')
}

/**
 * 获取当前用户的所有银行卡
 */
export const getBankCardsAPI = () => {
  // 检查登录状态
  if (!checkLoginStatus()) {
    return Promise.reject(new Error('用户未登录'))
  }
  
  console.log('正在调用获取银行卡列表API')
  return http.get<{status: string, data: IBankCard[]}>('/api/bank-cards')
    .then(response => {
      console.log('获取银行卡列表返回数据:', response)
      return response
    })
    .catch(error => {
      console.error('获取银行卡列表失败:', error)
      throw error
    })
}

/**
 * 添加银行卡
 */
export const addBankCardAPI = (data: {
  bank_name: string
  card_number: string
  card_holder: string
  branch_name?: string
}) => {
  // 检查登录状态
  if (!checkLoginStatus()) {
    return Promise.reject(new Error('用户未登录'))
  }
  
  return http.post<any>('/api/bank-cards', data)
}

/**
 * 删除银行卡
 */
export const deleteBankCardAPI = (id: number) => {
  // 检查登录状态
  if (!checkLoginStatus()) {
    return Promise.reject(new Error('用户未登录'))
  }
  
  return http.delete<any>(`/api/bank-cards/${id}`)
}

/**
 * 设置默认银行卡
 */
export const setDefaultBankCardAPI = (id: number) => {
  // 检查登录状态
  if (!checkLoginStatus()) {
    return Promise.reject(new Error('用户未登录'))
  }
  
  return http.post<any>(`/api/bank-cards/${id}/default`)
} 