import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getPlatformFrontendSettings } from '@/service/index/platform'

export const usePlatformStore = defineStore('platform', () => {
  // 平台功能开关状态
  const enableBankAccount = ref(true) // 默认开启
  const enableExchange = ref(true) // 默认开启
  const enableGoldBuy = ref(true) // 默认开启
  const enableGoldSell = ref(true) // 默认开启
  const enableUsdtBuy = ref(true) // 默认开启

  // 加载状态
  const isLoading = ref(false)
  const isLoaded = ref(false)

  // 标记是否已经请求过平台设置
  const hasRequestedSettings = ref(false)

  /**
   * 获取平台前端功能开关设置
   * @param forceUpdate 是否强制更新，默认为false
   */
  const fetchPlatformSettings = async (forceUpdate = false) => {
    // 如果已经请求过且不是强制更新，则直接返回
    if (hasRequestedSettings.value && !forceUpdate) {
      console.log('平台设置已经请求过，跳过重复请求')
      return
    }

    if (isLoading.value) return

    isLoading.value = true
    try {
      console.log('开始获取平台功能开关设置...')
      const response = await getPlatformFrontendSettings()
      console.log('获取平台功能开关设置响应:', response)

      if (response.status === 'success' && response.data) {
        // 明确使用类型断言处理响应数据
        const settings = response.data as {
          enable_bank_account: boolean
          enable_exchange: boolean
          enable_gold_buy: boolean
          enable_gold_sell: boolean
          enable_usdt_buy: boolean
        }

        console.log('平台功能开关设置:', settings)
        enableBankAccount.value = settings.enable_bank_account
        enableExchange.value = settings.enable_exchange
        enableGoldBuy.value = settings.enable_gold_buy
        enableGoldSell.value = settings.enable_gold_sell
        enableUsdtBuy.value = settings.enable_usdt_buy
        isLoaded.value = true
        hasRequestedSettings.value = true // 标记已经请求过

        console.log(
          '平台功能开关状态已更新: 银行卡=',
          enableBankAccount.value,
          '交易所=',
          enableExchange.value,
          '黄金买入=',
          enableGoldBuy.value,
          '黄金卖出=',
          enableGoldSell.value,
          'USDT买入=',
          enableUsdtBuy.value
        )
      } else {
        console.warn('获取平台功能开关设置失败或返回数据为空:', response)
      }
    } catch (error) {
      console.error('获取平台设置失败:', error)
    } finally {
      isLoading.value = false
    }
  }

  return {
    enableBankAccount,
    enableExchange,
    enableGoldBuy,
    enableGoldSell,
    enableUsdtBuy,
    isLoading,
    isLoaded,
    hasRequestedSettings,
    fetchPlatformSettings,
  }
})
