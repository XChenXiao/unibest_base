import { defineStore } from 'pinia'
import { ref } from 'vue'
import { checkAccountOpenEnabledAPI } from '@/service/index/account'

export const useAppStore = defineStore('app', () => {
  // 银行卡开户预存金
  const bankCardOpenFee = ref(10)
  // 是否已获取银行卡开户预存金
  const hasFetchedBankCardOpenFee = ref(false)
  // 是否已检查公告状态
  const hasCheckedAnnouncement = ref(false)
  // 开户功能是否开放
  const isAccountOpenEnabled = ref(false)
  // 是否已检查开户功能状态
  const hasCheckedAccountOpenEnabled = ref(false)

  // 获取银行卡开户预存金
  const fetchBankCardOpenFee = async () => {
    if (hasFetchedBankCardOpenFee.value) {
      return bankCardOpenFee.value
    }

    // 使用默认值，不发送API请求
    bankCardOpenFee.value = 10
    hasFetchedBankCardOpenFee.value = true
    console.log('使用默认银行卡开户预存金:', bankCardOpenFee.value)
    return bankCardOpenFee.value
  }

  // 设置公告检查状态
  const setAnnouncementChecked = (status: boolean) => {
    hasCheckedAnnouncement.value = status
  }

  // 检查开户功能是否开放
  const checkAccountOpenEnabled = async () => {
    if (hasCheckedAccountOpenEnabled.value) {
      return isAccountOpenEnabled.value
    }

    try {
      const enabled = await checkAccountOpenEnabledAPI()
      isAccountOpenEnabled.value = enabled
      hasCheckedAccountOpenEnabled.value = true
      console.log('检查开户功能状态:', enabled ? '已开放' : '未开放')
      return enabled
    } catch (error) {
      console.error('检查开户功能状态失败:', error)
      isAccountOpenEnabled.value = false
      hasCheckedAccountOpenEnabled.value = true
      return false
    }
  }

  return {
    bankCardOpenFee,
    hasFetchedBankCardOpenFee,
    fetchBankCardOpenFee,
    hasCheckedAnnouncement,
    setAnnouncementChecked,
    isAccountOpenEnabled,
    hasCheckedAccountOpenEnabled,
    checkAccountOpenEnabled,
  }
})
