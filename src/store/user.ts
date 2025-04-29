import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserInfoAPI } from '@/service/index/auth'
import { getVerificationStatusAPI } from '@/service/index/verification'

const initState: IUserInfo = { 
  name: '',
  phone: '',
  email: '',
  token: '',
  balance: 0,
  frozen_balance: 0,
  equity_balance: 0,
  invite_code: '',
  referrer_invite_code: '',
  has_bank_card: false
}

export const useUserStore = defineStore(
  'user',
  () => {
    const userInfo = ref<IUserInfo>({ ...initState })
    
    // 实名认证状态
    const verificationStatus = ref({
      verified: false,
      pending: false,
      rejected: false,
      rejection_reason: ''
    })
    
    // 设置用户信息
    const setUserInfo = (val: IUserInfo) => {
      userInfo.value = { ...userInfo.value, ...val }
    }
    
    // 清除用户信息
    const clearUserInfo = () => {
      userInfo.value = { ...initState }
      verificationStatus.value = {
        verified: false,
        pending: false,
        rejected: false,
        rejection_reason: ''
      }
    }
    
    // 获取用户信息
    const fetchUserInfo = async () => {
      if (!userInfo.value.token) {
        return false
      }
      
      try {
        const res = await getUserInfoAPI()
        if (res.status === 'success' && res.data) {
          // 更新用户信息，但保留token
          const token = userInfo.value.token
          setUserInfo({ ...res.data, token })
          
          // 获取实名认证状态
          await fetchVerificationStatus()
          
          return true
        }
        return false
      } catch (error) {
        console.error('获取用户信息失败', error)
        return false
      }
    }
    
    // 获取实名认证状态
    const fetchVerificationStatus = async () => {
      if (!userInfo.value.token) {
        return false
      }
      
      try {
        const res = await getVerificationStatusAPI()
        if (res.status === 'success' && res.data) {
          verificationStatus.value = {
            verified: res.data.verified,
            pending: res.data.pending,
            rejected: res.data.rejected,
            rejection_reason: res.data.rejection_reason || ''
          }
          return true
        }
        return false
      } catch (error) {
        console.error('获取实名认证状态失败', error)
        return false
      }
    }
    
    // 判断用户是否已登录
    const isLogined = computed(() => !!userInfo.value.token)
    
    // 判断用户是否通过实名认证
    const isVerified = computed(() => verificationStatus.value.verified)
    
    // 判断用户实名认证是否正在审核中
    const isPendingVerification = computed(() => verificationStatus.value.pending)
    
    // 判断用户实名认证是否被拒绝
    const isRejectedVerification = computed(() => verificationStatus.value.rejected)

    return {
      userInfo,
      verificationStatus,
      setUserInfo,
      clearUserInfo,
      fetchUserInfo,
      fetchVerificationStatus,
      isLogined,
      isVerified,
      isPendingVerification,
      isRejectedVerification
    }
  },
  {
    persist: true,
  },
)
