import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserInfoAPI } from '@/service/index/auth'

// 用户基本信息接口
export interface IUserInfo {
  id?: number
  name: string
  phone: string
  email: string
  token: string
  balance: number
  frozen_balance: number
  equity_balance: number
  invite_code: string
  referrer_invite_code: string
  has_bank_card: boolean
  bank_card_opened_at?: string | null
  avatar?: string
  created_at?: string
  updated_at?: string
}

// 初始用户信息状态
const initUserInfo: IUserInfo = {
  name: '',
  phone: '',
  email: '',
  token: '',
  balance: 0,
  frozen_balance: 0,
  equity_balance: 0,
  invite_code: '',
  referrer_invite_code: '',
  has_bank_card: false,
  bank_card_opened_at: null,
}

export const useUserStore = defineStore(
  'user',
  () => {
    // 用户基本信息
    const userInfo = ref<IUserInfo>({ ...initUserInfo })

    // 设置用户信息
    const setUserInfo = (val: Partial<IUserInfo>) => {
      userInfo.value = { ...userInfo.value, ...val }
      // 保存用户信息更新时间
      uni.setStorageSync('userInfoUpdateTime', Date.now())
    }

    // 清除用户信息
    const clearUserInfo = () => {
      userInfo.value = { ...initUserInfo }
      // 清除本地存储
      uni.removeStorageSync('userInfoUpdateTime')
    }

    // 更新用户余额
    const updateUserBalance = (
      newBalance: number,
      newFrozenBalance?: number,
      newEquityBalance?: number,
    ) => {
      if (typeof newBalance === 'number') {
        userInfo.value.balance = newBalance
      }

      if (typeof newFrozenBalance === 'number') {
        userInfo.value.frozen_balance = newFrozenBalance
      }

      if (typeof newEquityBalance === 'number') {
        userInfo.value.equity_balance = newEquityBalance
      }

      // 保存用户信息更新时间
      uni.setStorageSync('userInfoUpdateTime', Date.now())
    }

    // 获取用户信息
    const fetchUserInfo = async () => {
      if (!userInfo.value.token) {
        return false
      }

      try {
        const res = await getUserInfoAPI()

        if (res.status === 'success' && res.data) {
          // 获取用户数据
          const userData = res.data.user

          // 确保余额字段为数字
          if (userData) {
            if (userData.balance !== undefined) {
              userData.balance = Number(userData.balance)
            }
            if (userData.frozen_balance !== undefined) {
              userData.frozen_balance = Number(userData.frozen_balance)
            }
            if (userData.equity_balance !== undefined) {
              userData.equity_balance = Number(userData.equity_balance)
            }
          }

          // 保留token
          const token = userInfo.value.token

          // 更新用户信息
          setUserInfo({ ...userData, token })

          // 保存用户信息更新时间
          uni.setStorageSync('userInfoUpdateTime', Date.now())

          return {
            status: 'success',
            user: userData,
            is_verified: res.data.is_verified || false,
            verification_status: res.data.verification_status || 'unsubmitted',
          }
        }

        return false
      } catch (error) {
        console.error('获取用户信息失败', error)
        return false
      }
    }

    // 判断用户是否已登录
    const isLogined = computed(() => !!userInfo.value.token)

    // 计算属性：获取用户有效余额（可用余额 - 冻结余额）
    const availableBalance = computed(() => {
      return userInfo.value.balance - userInfo.value.frozen_balance
    })

    return {
      userInfo,
      setUserInfo,
      clearUserInfo,
      updateUserBalance,
      fetchUserInfo,
      isLogined,
      availableBalance,
    }
  },
  {
    persist: true,
  },
)
