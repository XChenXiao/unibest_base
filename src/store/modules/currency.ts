import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getUserCurrencies } from '@/service/app/currency'
import type { UserCurrency } from '@/service/app/types'

// 最小更新时间间隔(毫秒)：1分钟
const MIN_UPDATE_INTERVAL = 1 * 60 * 1000

// 拓展UserCurrency接口，包含API可能返回的其他字段
interface ExtendedUserCurrency extends UserCurrency {
  symbol?: string
  user_available_balance?: number | string
  [key: string]: any
}

// 用户货币数据store
export const useCurrencyStore = defineStore(
  'currency',
  () => {
    // 用户持有的货币列表
    const userCurrencies = ref<ExtendedUserCurrency[]>([])

    // 最后更新时间
    const lastUpdateTime = ref<number>(0)

    // 加载状态
    const loading = ref<boolean>(false)

    // 设置用户货币数据
    const setUserCurrencies = (currencies: ExtendedUserCurrency[]) => {
      userCurrencies.value = currencies
      lastUpdateTime.value = Date.now()
    }

    // 清除用户货币数据
    const clearUserCurrencies = () => {
      userCurrencies.value = []
      lastUpdateTime.value = 0
    }

    // 获取用户货币数据
    const fetchUserCurrencies = async (forceUpdate = false) => {
      // 如果已经在加载中，则跳过
      if (loading.value) {
        console.log('已经在加载用户货币数据，跳过重复请求')
        return userCurrencies.value
      }

      // 检查是否需要更新
      const now = Date.now()
      if (
        !forceUpdate &&
        userCurrencies.value.length > 0 &&
        now - lastUpdateTime.value < MIN_UPDATE_INTERVAL
      ) {
        console.log('使用缓存的用户货币数据')
        return userCurrencies.value
      }

      console.log('开始获取用户货币数据')
      loading.value = true

      try {
        const response = await getUserCurrencies()

        if (response.status === 'success' && Array.isArray(response.data)) {
          console.log('获取用户货币数据成功:', response.data)
          setUserCurrencies(response.data as ExtendedUserCurrency[])
          return userCurrencies.value
        } else {
          console.warn('获取用户货币数据失败:', response)
          return userCurrencies.value
        }
      } catch (error) {
        console.error('获取用户货币数据出错:', error)
        return userCurrencies.value
      } finally {
        loading.value = false
      }
    }

    // 获取特定货币的持有量
    const getUserCurrencyAmount = (symbol: string): number => {
      console.log(`查询货币 ${symbol} 的持有量`)
      console.log('当前store中的所有货币数据:', userCurrencies.value)

      if (!userCurrencies.value || userCurrencies.value.length === 0) {
        console.log('store中没有货币数据')
        return 0
      }

      // 查找匹配的货币
      const currency = userCurrencies.value.find((c) => {
        // 直接检查symbol属性
        if (c.symbol === symbol) {
          return true
        }

        // 检查currency对象中的symbol属性
        if (c.currency && c.currency.symbol === symbol) {
          return true
        }

        return false
      })

      if (!currency) {
        console.log(`未找到货币 ${symbol}`)
        return 0
      }

      console.log(`找到货币 ${symbol}，数据结构:`, currency)

      // 计算可用余额
      let availableBalance = 0

      // 根据不同的数据结构提取可用余额
      if (currency.user_available_balance !== undefined) {
        // 直接使用user_available_balance字段
        availableBalance =
          typeof currency.user_available_balance === 'number'
            ? currency.user_available_balance
            : parseFloat(String(currency.user_available_balance) || '0')
        console.log(`使用user_available_balance字段: ${availableBalance}`)
      } else if (currency.user_balance !== undefined) {
        // 使用user_balance字段
        availableBalance =
          typeof currency.user_balance === 'number'
            ? currency.user_balance
            : parseFloat(String(currency.user_balance) || '0')
        console.log(`使用user_balance字段: ${availableBalance}`)
      } else if (currency.amount !== undefined) {
        // 使用amount字段（可能是总持有量）
        const amount = currency.amount // 已经是number类型

        // 如果有冻结金额，则可用余额 = 总金额 - 冻结金额
        const frozenAmount = currency.frozen_amount || 0

        availableBalance = amount - frozenAmount
        console.log(
          `使用amount字段: ${amount}, 冻结金额: ${frozenAmount}, 可用余额: ${availableBalance}`,
        )
      } else if (currency.currency && currency.currency.user_available_balance !== undefined) {
        // 从currency子对象中获取
        availableBalance =
          typeof currency.currency.user_available_balance === 'number'
            ? currency.currency.user_available_balance
            : parseFloat(String(currency.currency.user_available_balance) || '0')
        console.log(`使用currency.user_available_balance字段: ${availableBalance}`)
      } else {
        console.log(`货币 ${symbol} 没有找到可用的余额字段，当前数据:`, currency)
      }

      console.log(`最终返回的持有量: ${availableBalance}`)
      return availableBalance
    }

    // 强制清除缓存并刷新数据（用于用户资产变化后）
    const forceRefreshUserCurrencies = async () => {
      console.log('强制清除缓存并刷新用户货币数据')
      // 清除缓存
      lastUpdateTime.value = 0
      // 强制刷新
      return await fetchUserCurrencies(true)
    }

    return {
      userCurrencies,
      lastUpdateTime,
      loading,
      setUserCurrencies,
      clearUserCurrencies,
      fetchUserCurrencies,
      getUserCurrencyAmount,
      forceRefreshUserCurrencies,
    }
  },
  {
    persist: true, // 启用持久化存储
  },
)
