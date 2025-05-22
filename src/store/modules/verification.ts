import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { getVerificationStatusAPI, IVerificationStatus } from '@/service/index/verification'
import { useUserStore } from './user'

// 用户认证状态接口
export interface IVerificationInfo {
  verified: boolean
  pending: boolean
  rejected: boolean
  rejection_reason: string
  real_name?: string
  id_card_number?: string
}

// 初始认证信息状态
const initVerificationInfo: IVerificationInfo = {
  verified: false,
  pending: false,
  rejected: false,
  rejection_reason: '',
}

export const useVerificationStore = defineStore(
  'verification',
  () => {
    // 用户认证信息
    const verificationInfo = ref<IVerificationInfo>({ ...initVerificationInfo })

    // 清除认证信息
    const clearVerificationInfo = () => {
      verificationInfo.value = { ...initVerificationInfo }
    }

    // 设置认证信息
    const setVerificationInfo = (val: Partial<IVerificationInfo>) => {
      verificationInfo.value = { ...verificationInfo.value, ...val }
    }

    // 获取实名认证状态
    const fetchVerificationStatus = async () => {
      const userStore = useUserStore()
      if (!userStore.userInfo.token) {
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

    // 判断用户是否通过实名认证
    const isVerified = computed(() => verificationInfo.value.verified)

    // 判断用户实名认证是否正在审核中
    const isPendingVerification = computed(() => verificationInfo.value.pending)

    // 判断用户实名认证是否被拒绝
    const isRejectedVerification = computed(() => verificationInfo.value.rejected)

    return {
      verificationInfo,
      clearVerificationInfo,
      setVerificationInfo,
      fetchVerificationStatus,
      isVerified,
      isPendingVerification,
      isRejectedVerification,
    }
  },
  {
    persist: true,
  },
)
