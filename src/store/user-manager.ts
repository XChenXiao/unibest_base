import { defineStore } from 'pinia'
import { useUserStore } from './modules/user'
import { useVerificationStore } from './modules/verification'
import { useBankCardStore } from './modules/bankcard'
import { useTeamStore } from './modules/team'
import { useMessageStore } from './modules/message'

/**
 * 用户信息统一管理器，协调各个用户相关模块
 */
export const useUserManagerStore = defineStore('userManager', () => {
  // 获取完整用户信息（包括余额、认证状态、银行卡等）
  const getUserCompleteInfo = async (forceUpdate = false) => {
    const userStore = useUserStore()
    const verificationStore = useVerificationStore()
    const bankCardStore = useBankCardStore()
    const teamStore = useTeamStore()
    const messageStore = useMessageStore()

    // 检查上次更新时间
    const lastUpdateTime = uni.getStorageSync('userInfoUpdateTime') || 0
    const now = Date.now()
    const MIN_UPDATE_INTERVAL = 5 * 60 * 1000 // 5分钟

    // 是否需要更新
    const shouldUpdate =
      forceUpdate || !lastUpdateTime || now - lastUpdateTime > MIN_UPDATE_INTERVAL

    // 判断是否有token
    if (!userStore.userInfo.token) {
      return null
    }

    if (shouldUpdate) {
      console.log('获取最新用户信息数据')

      // 并行获取所有数据
      const results = await Promise.allSettled([
        userStore.fetchUserInfo(),
        verificationStore.fetchVerificationStatus(),
        bankCardStore.fetchBankCardStatus(),
        bankCardStore.fetchBankCards(),
        teamStore.fetchTeamInfo(),
        messageStore.fetchUnreadMessageCount(),
      ])

      // 检查用户基本信息是否成功获取
      const userInfoSuccess = results[0].status === 'fulfilled' && results[0].value
      if (!userInfoSuccess) {
        console.error('获取用户基本信息失败，可能需要重新登录')
      }
    } else {
      console.log('使用缓存的用户信息数据')
    }

    // 返回所有数据
    return {
      userInfo: userStore.userInfo,
      verificationInfo: verificationStore.verificationInfo,
      bankCardStatus: bankCardStore.bankCardStatus,
      bankCards: bankCardStore.bankCards,
      teamInfo: teamStore.teamInfo,
      messageInfo: messageStore.messageInfo,
    }
  }

  // 刷新所有用户相关数据
  const refreshAllUserData = async () => {
    return await getUserCompleteInfo(true)
  }

  // 清除所有用户信息（退出登录时使用）
  const clearAllUserData = () => {
    const userStore = useUserStore()
    const verificationStore = useVerificationStore()
    const bankCardStore = useBankCardStore()
    const teamStore = useTeamStore()
    const messageStore = useMessageStore()

    userStore.clearUserInfo()
    verificationStore.clearVerificationInfo()
    bankCardStore.clearBankCardInfo()
    teamStore.clearTeamInfo()
    messageStore.clearMessageInfo()
  }

  return {
    getUserCompleteInfo,
    refreshAllUserData,
    clearAllUserData,
  }
})
