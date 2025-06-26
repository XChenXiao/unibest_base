import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { checkBankCardStatusAPI, getBankCardsAPI, IBankCard, getBankCardBalanceAPI } from '@/service/index/bankcard'
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
    
    // 银行卡余额
    const bankCardBalance = ref(0)
    const frozenBankCardBalance = ref(0)
    const availableBankCardBalance = ref(0)
    
    // 选中的银行卡ID
    const selectedBankCardId = ref<number | null>(null)
    // 选中的银行卡信息
    const selectedBankCard = ref<IBankCard | null>(null)

    // 清除银行卡信息
    const clearBankCardInfo = () => {
      bankCardStatus.value = BankCardStatus.NONE
      bankCards.value = []
      bankCardBalance.value = 0
      frozenBankCardBalance.value = 0
      availableBankCardBalance.value = 0
      selectedBankCardId.value = null
      selectedBankCard.value = null
    }

    // 设置银行卡申请状态
    const setBankCardStatus = (status: BankCardStatus) => {
      bankCardStatus.value = status
    }
    
    // 设置银行卡余额
    const setBankCardBalance = (balance: number, frozenBalance: number = 0, availableBalance: number = 0) => {
      bankCardBalance.value = balance
      frozenBankCardBalance.value = frozenBalance
      availableBankCardBalance.value = availableBalance || balance
    }
    
    // 设置选中的银行卡
    const setSelectedBankCard = (card: IBankCard) => {
      selectedBankCardId.value = card.id
      selectedBankCard.value = card
      console.log('已在store中设置选中的银行卡:', card)
    }
    
    // 清除选中的银行卡
    const clearSelectedBankCard = () => {
      selectedBankCardId.value = null
      selectedBankCard.value = null
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
            ...userStore.userInfo,
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
          
          // 如果有选中的银行卡ID，但没有选中的银行卡信息，尝试从列表中找到对应的银行卡
          if (selectedBankCardId.value && !selectedBankCard.value) {
            const card = bankCards.value.find(card => card.id === selectedBankCardId.value)
            if (card) {
              selectedBankCard.value = card
            }
          }
          
          return true
        }

        return false
      } catch (error) {
        console.error('获取银行卡列表失败', error)
        return false
      }
    }
    
    // 获取银行卡余额
    const fetchBankCardBalance = async () => {
      const userStore = useUserStore()
      if (!userStore.userInfo.token) {
        return false
      }

      try {
        const res = await getBankCardBalanceAPI()

        if (res.status === 'success' && res.data) {
          // 使用类型断言处理API返回的数据
          const balanceData = res.data as any
          bankCardBalance.value = balanceData.bank_card_balance || 0
          // 由于后端只返回了bank_card_balance字段，其他字段设置为默认值
          frozenBankCardBalance.value = 0
          availableBankCardBalance.value = balanceData.bank_card_balance || 0
          
          return true
        }

        return false
      } catch (error) {
        console.error('获取银行卡余额失败', error)
        return false
      }
    }

    // 同步获取银行卡余额（用于提现成功后同步更新余额）
    const syncBankCardBalance = () => {
      const userStore = useUserStore()
      if (!userStore.userInfo.token || !userStore.userInfo.has_bank_card) {
        return
      }

      // 使用Promise包装，便于调用方处理
      return new Promise((resolve, reject) => {
        getBankCardBalanceAPI()
          .then(res => {
            if (res.status === 'success' && res.data) {
              // 更新余额
              const balanceData = res.data as any
              bankCardBalance.value = balanceData.bank_card_balance || 0
              frozenBankCardBalance.value = 0
              availableBankCardBalance.value = balanceData.bank_card_balance || 0
              console.log('同步更新中国银行余额成功:', balanceData.bank_card_balance)
              resolve(true)
            } else {
              console.error('同步更新中国银行余额失败: 接口返回错误')
              reject(new Error('接口返回错误'))
            }
          })
          .catch(error => {
            console.error('同步更新中国银行余额失败:', error)
            reject(error)
          })
      })
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
      bankCardBalance,
      frozenBankCardBalance,
      availableBankCardBalance,
      selectedBankCardId,
      selectedBankCard,
      setBankCardStatus,
      setBankCardBalance,
      setSelectedBankCard,
      clearSelectedBankCard,
      clearBankCardInfo,
      fetchBankCardStatus,
      fetchBankCards,
      fetchBankCardBalance,
      syncBankCardBalance,
      isBankCardProcessing,
      getBankCardStatus,
    }
  },
  {
    persist: true,
  },
)
