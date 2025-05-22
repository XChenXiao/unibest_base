import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserInfoAPI } from '@/service/index/auth'
import { getVerificationStatusAPI, IVerificationStatus } from '@/service/index/verification'

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
  has_bank_card: false,
}

// 银行卡状态枚举
export enum BankCardStatus {
  NONE = 'none', // 未申请
  APPLYING = 'applying', // 申请中
  REVIEWING = 'reviewing', // 审核中
  APPROVED = 'approved', // 已审核通过
  REJECTED = 'rejected', // 审核拒绝
}

// 认证状态类型
interface VerificationResponse {
  status: string
  data?: {
    user: IUserInfo & {
      verification?: IVerificationStatus
    }
    verification_status: 'pending' | 'approved' | 'rejected' | 'unsubmitted'
    is_verified: boolean
  }
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
      rejection_reason: '',
    })

    // 银行卡申请状态 - 本地状态，不通过API获取
    const bankCardApplicationStatus = ref(BankCardStatus.NONE)

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
        rejection_reason: '',
      }
    }

    // 更新用户余额
    const updateUserBalance = (newBalance: number, newFrozenBalance?: number) => {
      // 直接更新用户余额
      if (typeof newBalance === 'number') {
        userInfo.value.balance = newBalance
      }

      // 如果提供了冻结余额，也进行更新
      if (typeof newFrozenBalance === 'number') {
        userInfo.value.frozen_balance = newFrozenBalance
      }

      console.log('用户余额已更新:', {
        balance: userInfo.value.balance,
        frozen_balance: userInfo.value.frozen_balance,
      })

      // 保存用户信息更新时间到存储
      uni.setStorageSync('userInfoUpdateTime', Date.now())
    }

    // 获取用户信息
    const fetchUserInfo = async () => {
      if (!userInfo.value.token) {
        return false
      }

      try {
        console.log('开始获取用户信息')
        const res = (await getUserInfoAPI()) as VerificationResponse

        if (res.status === 'success' && res.data) {
          // 获取用户数据 - 固定结构: res.data.user
          const userData = res.data.user

          // 确保余额字段为数字
          if (userData) {
            // 将余额相关字段转为数字
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

          // 处理实名认证信息 - 固定结构: res.data.is_verified 和 res.data.verification_status
          const isVerified = res.data.is_verified || false
          const verificationStatusVal = res.data.verification_status || 'unsubmitted'

          // 更新认证状态
          verificationStatus.value = {
            verified: isVerified,
            pending: verificationStatusVal === 'pending',
            rejected: verificationStatusVal === 'rejected',
            rejection_reason: userData.verification?.remark || '',
          }

          console.log('用户信息和认证状态已更新:', {
            is_verified: isVerified,
            verification_status: verificationStatusVal,
            user_name: userData.name,
          })

          // 保存用户信息更新时间到存储
          uni.setStorageSync('userInfoUpdateTime', Date.now())

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

      // 已认证用户，跳过请求
      if (verificationStatus.value.verified) {
        console.log('用户已通过认证，无需获取认证状态')
        return true
      }

      try {
        console.log('开始获取实名认证状态')
        const res = await getVerificationStatusAPI()

        if (res.status === 'success' && res.data) {
          // 使用类型断言处理嵌套数据结构
          const resData = res.data as any

          // 更新验证状态
          verificationStatus.value = {
            verified: !!resData.is_verified,
            pending: resData.verification_status === 'pending',
            rejected: resData.verification_status === 'rejected',
            rejection_reason: resData.verification?.remark || '',
          }

          console.log('已获取实名认证状态:', {
            is_verified: resData.is_verified,
            verification_status: resData.verification_status,
          })

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

    // 设置银行卡申请状态
    const setBankCardStatus = (status: BankCardStatus) => {
      bankCardApplicationStatus.value = status
    }

    // 判断银行卡是否在申请中或审核中
    const isBankCardProcessing = computed(() => {
      return (
        bankCardApplicationStatus.value === BankCardStatus.APPLYING ||
        bankCardApplicationStatus.value === BankCardStatus.REVIEWING
      )
    })

    // 获取银行卡状态
    const getBankCardStatus = computed(() => {
      // 如果用户已有银行卡，直接返回已审核通过
      if (userInfo.value.has_bank_card) {
        return BankCardStatus.APPROVED
      }
      // 否则返回当前状态
      return bankCardApplicationStatus.value
    })

    return {
      userInfo,
      verificationStatus,
      bankCardApplicationStatus,
      setUserInfo,
      clearUserInfo,
      updateUserBalance,
      fetchUserInfo,
      fetchVerificationStatus,
      setBankCardStatus,
      isLogined,
      isVerified,
      isPendingVerification,
      isRejectedVerification,
      isBankCardProcessing,
      getBankCardStatus,
    }
  },
  {
    persist: true,
  },
)
