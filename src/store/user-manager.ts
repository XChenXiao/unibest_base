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

    // 判断是否首次进入应用
    const isFirstEnter = !uni.getStorageSync('userInfoUpdateTime')

    // 判断是否有token
    if (!userStore.userInfo.token) {
      return null
    }

    // 只根据forceUpdate参数判断是否需要更新
    if (forceUpdate) {
      console.log('获取用户信息数据')

      // 首次进入应用时，只获取基本用户信息
      if (isFirstEnter) {
        console.log('首次进入应用，只获取基本用户信息')
        // 只获取用户基本信息和验证状态
        const basicResults = await Promise.allSettled([
          userStore.fetchUserInfo(),
          verificationStore.fetchVerificationStatus(),
        ])

        // 检查用户基本信息是否成功获取
        const userInfoSuccess = basicResults[0].status === 'fulfilled' && basicResults[0].value
        if (!userInfoSuccess) {
          console.error('获取用户基本信息失败，可能需要重新登录')
          return null
        }
      }
      // 非首次进入应用，根据需要获取完整信息
      else {
        console.log('非首次进入应用，获取完整用户信息')

        // 获取基本用户信息
        const userInfoPromise = userStore.fetchUserInfo()
        const verificationPromise = verificationStore.fetchVerificationStatus()

        // 等待基本信息获取完成
        const basicResults = await Promise.allSettled([userInfoPromise, verificationPromise])

        // 检查用户基本信息是否成功获取
        const userInfoSuccess = basicResults[0].status === 'fulfilled' && basicResults[0].value
        if (!userInfoSuccess) {
          console.error('获取用户基本信息失败，可能需要重新登录')
          return null
        }

        // 基本信息获取成功后，再获取其他信息
        await Promise.allSettled([
          bankCardStore.fetchBankCardStatus(),
          bankCardStore.fetchBankCards(),
          teamStore.fetchTeamInfo(),
          messageStore.fetchUnreadMessageCount(),
        ])
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

  // 获取基本用户信息（只包括用户信息和认证状态，不包括银行卡和团队信息）
  const getBasicUserInfo = async (forceUpdate = false) => {
    const userStore = useUserStore()
    const verificationStore = useVerificationStore()
    const messageStore = useMessageStore()

    // 判断是否有token
    if (!userStore.userInfo.token) {
      return null
    }

    // 只根据forceUpdate参数判断是否需要更新
    if (forceUpdate) {
      console.log('获取基本用户信息数据')

      // 获取认证状态
      const verificationPromise = verificationStore.fetchVerificationStatus()
      const messagePromise = messageStore.fetchUnreadMessageCount()

      // 等待认证状态获取完成
      await verificationPromise

      // 判断用户是否已完成实名认证
      const userVerified = verificationStore.isVerified

      // 并行获取基本数据，但对于已实名认证的用户，跳过用户信息请求
      const promises = []

      if (!userVerified) {
        // 未实名认证的用户，需要请求用户信息
        console.log('用户未实名认证，获取用户信息')
        promises.push(userStore.fetchUserInfo())
      } else {
        console.log('用户已实名认证，跳过获取用户信息')
      }

      // 添加消息获取请求
      promises.push(messagePromise)

      // 等待所有请求完成
      const results = await Promise.allSettled(promises)

      // 只有在请求了用户信息时才检查结果
      if (!userVerified) {
        const userInfoSuccess = results[0].status === 'fulfilled' && results[0].value
        if (!userInfoSuccess) {
          console.error('获取用户基本信息失败，可能需要重新登录')
        }
      }
    } else {
      console.log('使用缓存的用户基本信息数据')
    }

    // 返回基本数据
    return {
      userInfo: userStore.userInfo,
      verificationInfo: verificationStore.verificationInfo,
      messageInfo: messageStore.messageInfo,
    }
  }

  // 刷新所有用户相关数据
  const refreshAllUserData = async () => {
    return await getUserCompleteInfo(true)
  }

  // 刷新基本用户数据（不包括银行卡和团队信息）
  const refreshBasicUserData = async () => {
    return await getBasicUserInfo(true)
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
    getBasicUserInfo,
    refreshAllUserData,
    refreshBasicUserData,
    clearAllUserData,
  }
})
