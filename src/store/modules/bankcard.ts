import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { checkBankCardStatusAPI, getBankCardsAPI, IBankCard } from '@/service/index/bankcard'
import { useUserStore } from './user'

// 银行卡状态枚举
export enum BankCardStatus {
  NONE = 'none', // 未申请
  APPLYING = 'applying', // 申请中
  REVIEWING = 'reviewing', // 审核中
  APPROVED = 'approved', // 已审核通过
  REJECTED = 'rejected', // 审核拒绝
}

export const useBankCardStore = defineStore(
  'bankcard',
  () => {
    // 银行卡状态
    const bankCardStatus = ref<BankCardStatus>(BankCardStatus.NONE)

    // 银行卡列表
    const bankCards = ref<IBankCard[]>([])

    // 清除银行卡信息
    const clearBankCardInfo = () => {
      bankCardStatus.value = BankCardStatus.NONE
      bankCards.value = []
    }

    // 设置银行卡申请状态
    const setBankCardStatus = (status: BankCardStatus) => {
      bankCardStatus.value = status
    }

    // 获取银行卡状态
    const fetchBankCardStatus = async () => {
      const userStore = useUserStore()
      if (!userStore.userInfo.token) {
        return false
      }

      try {
        const res = await checkBankCardStatusAPI()

        if (res.status === 'success' && res.data) {
          // 使用类型断言处理API返回的数据
          const bankCardData = res.data as any

          // 解构获取数据
          const { has_bank_card, bank_card_opened_at, latest_application } = bankCardData

          // 更新用户是否有银行卡及开户时间
          userStore.setUserInfo({
            has_bank_card: !!has_bank_card,
            bank_card_opened_at,
          })

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
      const userStore = useUserStore()
      if (!userStore.userInfo.token) {
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

    // 判断银行卡是否在申请中或审核中
    const isBankCardProcessing = computed(() => {
      return (
        bankCardStatus.value === BankCardStatus.APPLYING ||
        bankCardStatus.value === BankCardStatus.REVIEWING
      )
    })

    // 获取银行卡状态
    const getBankCardStatus = computed(() => {
      const userStore = useUserStore()
      // 如果用户已有银行卡，直接返回已审核通过
      if (userStore.userInfo.has_bank_card) {
        return BankCardStatus.APPROVED
      }
      // 否则返回当前状态
      return bankCardStatus.value
    })

    return {
      bankCardStatus,
      bankCards,
      setBankCardStatus,
      clearBankCardInfo,
      fetchBankCardStatus,
      fetchBankCards,
      isBankCardProcessing,
      getBankCardStatus,
    }
  },
  {
    persist: true,
  },
)
