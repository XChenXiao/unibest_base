import { defineStore } from 'pinia'

export interface BankCard {
  id: number
  bankName: string
  bankCode: string
  cardNumber: string
  holderName: string
  phone: string
  logo?: string
}

export const useBankCardStore = defineStore('bankCard', {
  state: () => ({
    bankCards: [] as BankCard[],
    balance: '0.00'
  }),
  
  getters: {
    getBankCards: (state) => state.bankCards,
    getBalance: (state) => state.balance
  },
  
  actions: {
    // 添加银行卡
    addBankCard(card: Omit<BankCard, 'id' | 'logo'>) {
      // 生成唯一ID
      const id = this.bankCards.length > 0 
        ? Math.max(...this.bankCards.map(card => card.id)) + 1 
        : 1
      
      // 根据银行代码设置logo
      const bankLogos: Record<string, string> = {
        'BOC': '/static/images/bank-boc.png',
        'ICBC': '/static/images/bank-icbc.png',
        'CCB': '/static/images/bank-ccb.png',
        'ABC': '/static/images/bank-abc.png',
        'CMBC': '/static/images/bank-cmbc.png',
        'CMB': '/static/images/bank-cmb.png',
        'SPDB': '/static/images/bank-spdb.png',
        'CIB': '/static/images/bank-cib.png'
      }
      
      const logo = bankLogos[card.bankCode] || '/static/images/bank-default.png'
      
      // 添加到列表
      this.bankCards.push({
        ...card,
        id,
        logo
      })
      
      // 保存到本地存储
      this.saveBankCardsToStorage()
      
      return id
    },
    
    // 删除银行卡
    removeBankCard(id: number) {
      const index = this.bankCards.findIndex(card => card.id === id)
      if (index !== -1) {
        this.bankCards.splice(index, 1)
        this.saveBankCardsToStorage()
        return true
      }
      return false
    },
    
    // 设置余额
    setBalance(balance: string) {
      this.balance = balance
      uni.setStorageSync('bank_balance', balance)
    },
    
    // 保存银行卡到本地存储
    saveBankCardsToStorage() {
      uni.setStorageSync('bank_cards', JSON.stringify(this.bankCards))
    },
    
    // 从本地存储加载银行卡
    loadBankCardsFromStorage() {
      try {
        const cardsStr = uni.getStorageSync('bank_cards')
        if (cardsStr) {
          this.bankCards = JSON.parse(cardsStr)
        }
        
        const balance = uni.getStorageSync('bank_balance')
        if (balance) {
          this.balance = balance
        }
      } catch (error) {
        console.error('加载银行卡数据失败', error)
      }
    }
  }
}) 