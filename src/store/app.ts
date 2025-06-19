import { defineStore } from 'pinia'
import { ref } from 'vue'

export const useAppStore = defineStore('app', () => {
  // 银行卡开户预存金
  const bankCardOpenFee = ref(10)
  // 是否已获取银行卡开户预存金
  const hasFetchedBankCardOpenFee = ref(false)
  // 是否已检查公告状态
  const hasCheckedAnnouncement = ref(false)

  // 获取银行卡开户预存金
  const fetchBankCardOpenFee = async () => {
    if (hasFetchedBankCardOpenFee.value) {
      return bankCardOpenFee.value
    }

    // 直接使用默认值，不再发送API请求
    bankCardOpenFee.value = 10
    hasFetchedBankCardOpenFee.value = true
    console.log('使用默认银行卡开户预存金:', bankCardOpenFee.value)
    return bankCardOpenFee.value
  }

  // 设置公告检查状态
  const setAnnouncementChecked = (status: boolean) => {
    hasCheckedAnnouncement.value = status
  }

  return {
    bankCardOpenFee,
    hasFetchedBankCardOpenFee,
    fetchBankCardOpenFee,
    hasCheckedAnnouncement,
    setAnnouncementChecked,
  }
})
