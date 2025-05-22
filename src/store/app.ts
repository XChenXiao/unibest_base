import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getBankCardOpenFeeAPI } from '@/service/index/bankcard'

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

    try {
      console.log('获取银行卡开户预存金')
      const res = await getBankCardOpenFeeAPI()

      if (res.status === 'success' && res.data) {
        const responseData = res.data
        if (responseData.open_fee) {
          bankCardOpenFee.value = parseFloat(responseData.open_fee) || 10
          hasFetchedBankCardOpenFee.value = true
          console.log('获取银行卡开户预存金成功:', bankCardOpenFee.value)
          return bankCardOpenFee.value
        }
      }

      return bankCardOpenFee.value
    } catch (error) {
      console.error('获取银行卡开户预存金失败:', error)
      return bankCardOpenFee.value
    }
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
