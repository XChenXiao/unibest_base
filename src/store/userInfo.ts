import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getUserInfoAPI, loginAPI, logoutAPI, registerAPI } from '@/service/index/auth'
import { getVerificationStatusAPI, IVerificationStatus } from '@/service/index/verification'
import { checkBankCardStatusAPI, getBankCardsAPI, IBankCard } from '@/service/index/bankcard'
import { getTeamInfoAPI, getTeamStatsAPI } from '@/service/index/team'
import { getUnreadAnnouncementCountAPI } from '@/service/index/message'

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
  avatar?: string
  created_at?: string
  updated_at?: string
}

// 用户认证状态接口
export interface IVerificationInfo {
  verified: boolean
  pending: boolean
  rejected: boolean
  rejection_reason: string
  real_name?: string
  id_card_number?: string
}

// 银行卡状态枚举
export enum BankCardStatus {
  NONE = 'none', // 未申请
  APPLYING = 'applying', // 申请中
  REVIEWING = 'reviewing', // 审核中
  APPROVED = 'approved', // 已审核通过
  REJECTED = 'rejected', // 审核拒绝
}

// 团队信息接口
export interface ITeamInfo {
  total_members: number
  direct_invites: number
  verified_members: number
  total_rewards: number
}

// 消息通知接口
export interface IMessageInfo {
  unread_count: number
  personal_unread: number
  global_unread: number
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
}

// 初始认证信息状态
const initVerificationInfo: IVerificationInfo = {
  verified: false,
  pending: false,
  rejected: false,
  rejection_reason: '',
}

// 初始团队信息状态
const initTeamInfo: ITeamInfo = {
  total_members: 0,
  direct_invites: 0,
  verified_members: 0,
  total_rewards: 0,
}

// 初始消息信息状态
const initMessageInfo: IMessageInfo = {
  unread_count: 0,
  personal_unread: 0,
  global_unread: 0,
}

export const useUserInfoStore = defineStore(
  'userInfo',
  () => {
    // 用户基本信息
    const userInfo = ref<IUserInfo>({ ...initUserInfo })

    // 用户认证信息
    const verificationInfo = ref<IVerificationInfo>({ ...initVerificationInfo })

    // 银行卡状态
    const bankCardStatus = ref<BankCardStatus>(BankCardStatus.NONE)

    // 银行卡列表
    const bankCards = ref<IBankCard[]>([])

    // 团队信息
    const teamInfo = ref<ITeamInfo>({ ...initTeamInfo })

    // 消息信息
    const messageInfo = ref<IMessageInfo>({ ...initMessageInfo })

    // 设置用户信息
    const setUserInfo = (val: Partial<IUserInfo>) => {
      userInfo.value = { ...userInfo.value, ...val }
      // 保存用户信息更新时间
      uni.setStorageSync('userInfoUpdateTime', Date.now())
    }

    // 清除用户信息
    const clearUserInfo = () => {
      userInfo.value = { ...initUserInfo }
      verificationInfo.value = { ...initVerificationInfo }
      bankCardStatus.value = BankCardStatus.NONE
      bankCards.value = []
      teamInfo.value = { ...initTeamInfo }
      messageInfo.value = { ...initMessageInfo }
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

          // 处理实名认证信息
          const isVerified = res.data.is_verified || false
          const verificationStatusVal = res.data.verification_status || 'unsubmitted'

          // 更新认证状态
          verificationInfo.value = {
            verified: isVerified,
            pending: verificationStatusVal === 'pending',
            rejected: verificationStatusVal === 'rejected',
            rejection_reason: userData.verification?.remark || '',
            real_name: userData.verification?.real_name,
            id_card_number: userData.verification?.id_card_number,
          }

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
      if (verificationInfo.value.verified) {
        return true
      }

      try {
        const res = await getVerificationStatusAPI()

        if (res.status === 'success' && res.data) {
          // 使用类型断言处理API返回的数据
          const resData = res.data as any

          // 更新验证状态
          verificationInfo.value = {
            verified: !!resData.is_verified,
            pending: resData.verification_status === 'pending',
            rejected: resData.verification_status === 'rejected',
            rejection_reason: resData.verification?.remark || '',
            real_name: resData.verification?.real_name,
            id_card_number: resData.verification?.id_card_number,
          }

          return true
        }

        return false
      } catch (error) {
        console.error('获取实名认证状态失败', error)
        return false
      }
    }

    // 获取银行卡状态
    const fetchBankCardStatus = async () => {
      if (!userInfo.value.token) {
        return false
      }

      try {
        const res = await checkBankCardStatusAPI()

        if (res.status === 'success' && res.data) {
          // 使用类型断言处理API返回的数据
          const bankCardData = res.data as any

          // 解构获取数据
          const { has_bank_card, latest_application } = bankCardData

          // 更新用户是否有银行卡
          setUserInfo({ has_bank_card: !!has_bank_card })

          // 设置银行卡状态
          if (has_bank_card) {
            bankCardStatus.value = BankCardStatus.APPROVED
          } else if (latest_application) {
            const status = latest_application.status
            switch (status) {
              case 'pending':
                bankCardStatus.value = BankCardStatus.REVIEWING
                break
              case 'completed':
                bankCardStatus.value = BankCardStatus.APPROVED
                break
              case 'rejected':
                bankCardStatus.value = BankCardStatus.REJECTED
                break
              default:
                bankCardStatus.value = BankCardStatus.NONE
            }
          } else {
            bankCardStatus.value = BankCardStatus.NONE
          }

          return true
        }

        return false
      } catch (error) {
        console.error('获取银行卡状态失败', error)
        return false
      }
    }

    // 获取银行卡列表
    const fetchBankCards = async () => {
      if (!userInfo.value.token) {
        return false
      }

      try {
        const res = await getBankCardsAPI()

        if (res.status === 'success' && res.data) {
          // 使用类型断言处理API返回的数据
          bankCards.value = res.data as unknown as IBankCard[]
          return true
        }

        return false
      } catch (error) {
        console.error('获取银行卡列表失败', error)
        return false
      }
    }

    // 获取团队信息
    const fetchTeamInfo = async () => {
      if (!userInfo.value.token) {
        return false
      }

      try {
        // 获取团队统计信息
        const statsRes = await getTeamStatsAPI()

        if (statsRes.status === 'success' && statsRes.data) {
          // 使用类型断言处理API返回的数据
          const statsData = statsRes.data as any

          teamInfo.value = {
            ...teamInfo.value,
            total_rewards: Number(statsData.total_rewards || 0),
            direct_invites: Number(statsData.total_invites || 0),
          }
        }

        // 获取团队详细信息
        const teamRes = await getTeamInfoAPI()

        if (teamRes.status === 'success' && teamRes.data) {
          // 使用类型断言处理API返回的数据
          const teamData = teamRes.data as any

          teamInfo.value = {
            ...teamInfo.value,
            total_members: Number(teamData.total_members || 0),
            verified_members: Number(teamData.verified_members || 0),
          }
        }

        return true
      } catch (error) {
        console.error('获取团队信息失败', error)
        return false
      }
    }

    // 获取未读消息数量
    const fetchUnreadMessageCount = async () => {
      if (!userInfo.value.token) {
        return false
      }

      try {
        const res = await getUnreadAnnouncementCountAPI()

        // 使用类型断言处理API返回的数据
        const messageData = res as any

        if (messageData && messageData.unread_count !== undefined) {
          messageInfo.value = {
            unread_count: Number(messageData.unread_count || 0),
            personal_unread: Number(messageData.personal_unread || 0),
            global_unread: Number(messageData.global_unread || 0),
          }
          return true
        }

        return false
      } catch (error) {
        console.error('获取未读消息数量失败', error)
        return false
      }
    }

    // 刷新所有用户相关数据
    const refreshAllUserData = async () => {
      if (!userInfo.value.token) {
        return false
      }

      try {
        // 并行获取所有数据
        await Promise.all([
          fetchUserInfo(),
          fetchVerificationStatus(),
          fetchBankCardStatus(),
          fetchBankCards(),
          fetchTeamInfo(),
          fetchUnreadMessageCount(),
        ])

        return true
      } catch (error) {
        console.error('刷新用户数据失败', error)
        return false
      }
    }

    // 计算属性：判断用户是否已登录
    const isLogined = computed(() => !!userInfo.value.token)

    // 计算属性：判断用户是否通过实名认证
    const isVerified = computed(() => verificationInfo.value.verified)

    // 计算属性：判断用户实名认证是否正在审核中
    const isPendingVerification = computed(() => verificationInfo.value.pending)

    // 计算属性：判断用户实名认证是否被拒绝
    const isRejectedVerification = computed(() => verificationInfo.value.rejected)

    // 计算属性：判断银行卡是否在申请中或审核中
    const isBankCardProcessing = computed(() => {
      return (
        bankCardStatus.value === BankCardStatus.APPLYING ||
        bankCardStatus.value === BankCardStatus.REVIEWING
      )
    })

    // 计算属性：获取银行卡状态
    const getBankCardStatus = computed(() => {
      // 如果用户已有银行卡，直接返回已审核通过
      if (userInfo.value.has_bank_card) {
        return BankCardStatus.APPROVED
      }
      // 否则返回当前状态
      return bankCardStatus.value
    })

    // 计算属性：获取用户有效余额（可用余额 - 冻结余额）
    const availableBalance = computed(() => {
      return userInfo.value.balance - userInfo.value.frozen_balance
    })

    return {
      // 状态
      userInfo,
      verificationInfo,
      bankCardStatus,
      bankCards,
      teamInfo,
      messageInfo,

      // 方法
      setUserInfo,
      clearUserInfo,
      updateUserBalance,
      fetchUserInfo,
      fetchVerificationStatus,
      fetchBankCardStatus,
      fetchBankCards,
      fetchTeamInfo,
      fetchUnreadMessageCount,
      refreshAllUserData,

      // 计算属性
      isLogined,
      isVerified,
      isPendingVerification,
      isRejectedVerification,
      isBankCardProcessing,
      getBankCardStatus,
      availableBalance,
    }
  },
  {
    persist: true,
  },
)
