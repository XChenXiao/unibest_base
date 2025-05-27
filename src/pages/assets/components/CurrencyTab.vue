<template>
  <view class="currency-list">
    <!-- 加载状态 -->
    <view v-if="loading" class="currency-loading">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载货币数据中...</text>
    </view>
    
    <!-- 货币内容 -->
    <view v-else>
      <!-- 添加货币记录按钮 -->
      <view class="record-button-container">
        <button class="record-button" @click="gotoCurrencyRecords">
          <text class="uni-icons uniui-list"></text>
          <text class="button-text">黄金记录</text>
        </button>
      </view>

    <view
      class="currency-item"
      v-for="(currency, index) in filteredCurrencyList"
      :key="getItemId(currency, index)"
      @click="gotoTrading(currency)"
    >
      <!-- 货币图标 -->
      <view class="currency-icon" v-if="getCurrencyIcon(currency)">
        <image class="currency-image" :src="getCurrencyIcon(currency)" mode="aspectFit" />
      </view>
      <view
        class="currency-icon"
        v-else
        :style="{ backgroundColor: getCurrencyBgColor(getCurrencySymbol(currency)) }"
      >
        <text class="currency-icon-text">{{ getCurrencySymbol(currency).charAt(0) }}</text>
      </view>

      <view class="currency-info">
        <text class="currency-name">{{ getCurrencyName(currency) }}</text>
        <text class="currency-symbol">{{ getCurrencySymbol(currency) }}</text>
      </view>

      <view class="currency-details">
        <text class="currency-price">¥{{ formatAmount(getCurrencyPrice(currency)) }}</text>
        <text class="currency-amount">
          <!-- 隐藏持有量 -->
          持有:
          {{
            getCurrencySymbol(currency) === 'USDT'
              ? formatAmount(getCurrencyUserBalance(currency))
              : formatAmount(getCurrencyUserBalance(currency)) + '克'
          }}
        </text>
      </view>

      <!-- USDT购买按钮 -->
      <view
        v-if="isUsdt(currency)"
        class="buy-button-container"
        @click.stop="openBuyDialog(currency)"
      >
        <!-- <button class="buy-button">购买</button> -->
      </view>
      <!-- 非USDT货币的领取按钮 - 可领取奖励时显示"领取奖励" -->
      <view
        v-else-if="
          canShowClaimButton(currency) &&
          hasClaimableReward(currency) &&
          !hasClaimedReward(currency)
        "
        class="claim-button-container"
        @click.stop="handleClaimCurrency(currency)"
      >
        <button class="claim-button">领取奖励</button>
      </view>
      <!-- 非USDT货币 - 已领取奖励状态 -->
      <!-- <view v-else-if="canShowClaimButton(currency) && hasClaimedReward(currency)" class="claimed-button-container">
        <text class="claimed-text">已领取</text>
      </view> -->
      <!-- 非USDT货币按钮 - 有奖励但不可领取（已领取）时显示"去交易所" -->
      <!-- 取消去交易所的按钮 -->
      <!-- <view v-else-if="canShowClaimButton(currency) && !hasClaimableReward(currency)" class="exchange-button-container" @click.stop="gotoExchange(currency)">
        <button class="exchange-button">交易所</button>
      </view> -->
      <text v-else class="uni-icons uniui-arrow-right currency-arrow"></text>
    </view>

    <!-- 空状态 -->
    <view v-if="currencyList.length === 0" class="empty-state">
      <text class="empty-text">您暂无持有货币资产</text>
      <button class="go-trading-btn" @click="gotoExchange()">前往交易所</button>
    </view>

      <!-- 购买USDT弹窗 -->
      <buy-usdt-dialog
        ref="buyUsdtDialog"
        :price="usdtPrice"
        :userBalance="userBalance"
        :iconUrl="usdtIconUrl"
        @success="handleBuySuccess"
      />
    </view>
  </view>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits, ref, computed } from 'vue'
import { Currency, UserCurrency } from '@/service/app/types'
import { claimCurrency } from '@/service/app/currency'
import BuyUsdtDialog from '@/components/currency/BuyUsdtDialog.vue'
import { showToast } from '@/utils/uniapi'

// 兼容旧版数据结构
interface CurrencyItem {
  id: number
  name: string
  symbol: string
  price: number
  holdAmount?: number
  bgColor?: string
}

// API 返回的新货币数据接口
interface ApiCurrency {
  id: number
  name: string
  symbol: string
  icon?: string
  price: string
  total_supply?: string
  circulating_supply?: string
  description?: string
  is_active?: boolean
  is_base_currency?: boolean
  created_at?: string
  updated_at?: string
  reward_amount?: string
  has_claimed_reward?: boolean
  has_claimable_reward?: boolean
  user_balance?: number | string
  user_frozen_amount?: number | string
  user_available_balance?: number | string
  user_total_purchased?: number | string
  user_total_cost?: number | string
  user_average_cost?: number | string
  user_current_value?: number | string
  user_profit?: number | string
  user_profit_rate?: number | string
}

// 定义组件接受的数据类型
type CurrencyData = Currency | UserCurrency | CurrencyItem | ApiCurrency

// 为Currency相关类型定义类型守卫
function isUserCurrency(item: CurrencyData): item is UserCurrency {
  return 'currency' in item && item.currency !== undefined
}

// 颜色映射表
const colorMap: Record<string, string> = {
  G: 'rgba(243, 156, 18, 0.2)', // 黄金
  S: 'rgba(189, 195, 199, 0.2)', // 白银
  P: 'rgba(52, 152, 219, 0.2)', // 铂金
  B: 'rgba(155, 89, 182, 0.2)', // 比特币
  U: 'rgba(46, 204, 113, 0.2)', // USDT
}

const defaultColor = 'rgba(189, 195, 199, 0.2)'

const props = defineProps({
  currencyList: {
    type: Array as () => CurrencyData[],
    default: () => [],
  },
  userBalance: {
    type: Number,
    default: 0,
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['goto-trading', 'buy-success'])

// 购买USDT弹窗引用
const buyUsdtDialog = ref(null)

// USDT价格和图标URL
const usdtPrice = ref(1.0)
const usdtIconUrl = ref('')

// 获取货币ID或索引作为key
const getItemId = (item: CurrencyData, index: number): number | string => {
  if ('id' in item) return item.id
  return index
}

// 获取货币名称
const getCurrencyName = (item: CurrencyData): string => {
  if ('name' in item) return item.name
  if (isUserCurrency(item) && item.currency && 'name' in item.currency) return item.currency.name
  return '未知货币'
}

// 获取货币符号
const getCurrencySymbol = (item: CurrencyData): string => {
  if ('symbol' in item) return item.symbol
  if (isUserCurrency(item) && item.currency && 'symbol' in item.currency)
    return item.currency.symbol
  return 'UNKN'
}

// 获取货币图标
const getCurrencyIcon = (item: CurrencyData): string => {
  let iconPath = ''

  if ('icon' in item && item.icon) {
    iconPath = item.icon
  } else if (
    isUserCurrency(item) &&
    item.currency &&
    'icon' in item.currency &&
    item.currency.icon
  ) {
    iconPath = item.currency.icon
  }

  if (iconPath) {
    return iconPath.startsWith('http') ? iconPath : `https://www.boceasy.com/storage/${iconPath}`
  }

  return ''
}

// 获取货币价格
const getCurrencyPrice = (item: CurrencyData): number => {
  if ('price' in item) {
    // 处理字符串格式的价格
    if (typeof item.price === 'string') {
      return parseFloat(item.price)
    }
    return item.price
  }
  if (isUserCurrency(item) && item.currency && 'price' in item.currency) {
    if (typeof item.currency.price === 'string') {
      return parseFloat(item.currency.price)
    }
    return item.currency.price
  }
  return 0
}

// 获取用户持有余额
const getCurrencyUserBalance = (item: CurrencyData): number => {
  // 处理API返回的user_balance字段
  if ('user_balance' in item) {
    if (typeof item.user_balance === 'string') {
      return parseFloat(item.user_balance)
    }
    return item.user_balance || 0
  }

  // 处理之前的amount字段
  if ('amount' in item) return item.amount

  // 处理老版本的holdAmount字段
  if ('holdAmount' in item) return item.holdAmount || 0

  // 如果都没有，返回0
  return 0
}

// 判断是否是USDT
const isUsdt = (item: CurrencyData): boolean => {
  const symbol = getCurrencySymbol(item)
  return symbol === 'USDT'
}

// 前往交易所
const gotoTrading = (currency?: CurrencyData) => {
  // 使用switchTab跳转到交易所页面
  uni.switchTab({
    url: '/pages/trading/index',
    success: () => {
      // 如果需要，可以使用本地存储记录当前选中的货币
      if (currency) {
        try {
          const symbol = getCurrencySymbol(currency)
          uni.setStorageSync('selected_currency_symbol', symbol)
        } catch (e) {
          console.error('保存选中货币失败:', e)
        }
      }
    },
    fail: (err) => {
      console.error('跳转到交易所失败:', err)
      // 尝试使用navigateTo
      uni.navigateTo({
        url: '/pages/trading/exchange',
      })
    },
  })

  // 仍然保留原有事件，以确保兼容性
  emit('goto-trading', currency)
}

// 前往交易所页面（新方法，专门用于"去交易所"按钮）
const gotoExchange = (currency?: CurrencyData) => {
  // 优先直接尝试跳转到交易所页面
  uni.navigateTo({
    url: '/pages/trading/exchange',
    fail: (err) => {
      console.error('跳转到交易所页面失败:', err)
      // 如果navigateTo失败，可能是因为是tabbar页面，尝试使用reLaunch
      uni.reLaunch({
        url: '/pages/trading/exchange',
        fail: (err2) => {
          console.error('重定向到交易所页面也失败:', err2)
          // 最后尝试使用switchTab
          uni.switchTab({
            url: '/pages/trading/index',
            success: () => {
              // 成功跳转后，保存货币信息供交易页面使用
              if (currency) {
                try {
                  const symbol = getCurrencySymbol(currency)
                  uni.setStorageSync('selected_currency_symbol', symbol)
                } catch (e) {
                  console.error('保存选中货币失败:', e)
                }
              }
            },
            fail: () => {
              showToast('无法跳转到交易所页面')
            },
          })
        },
      })
    },
  })
}

// 格式化金额
const formatAmount = (amount: number) => {
  return Number(amount).toFixed(2)
}

// 获取货币背景色
const getCurrencyBgColor = (symbol: string): string => {
  if (!symbol) return defaultColor
  const firstChar = symbol.charAt(0).toUpperCase()
  return colorMap[firstChar] || defaultColor
}

// 打开购买USDT弹窗
const openBuyDialog = (currency: CurrencyData) => {
  if (!isUsdt(currency)) return

  // 设置USDT价格和图标
  usdtPrice.value = getCurrencyPrice(currency)
  usdtIconUrl.value = getCurrencyIcon(currency)

  // 打开弹窗
  if (buyUsdtDialog.value) {
    // 使用open方法，此方法内部会获取最新用户余额
    ;(buyUsdtDialog.value as any).open()
  }
}

// 处理购买成功
const handleBuySuccess = () => {
  emit('buy-success')
}

// 判断是否显示领取按钮（非USDT货币且有reward_amount）
const canShowClaimButton = (item: CurrencyData): boolean => {
  if (isUsdt(item)) return false

  // 检查是否有奖励金额字段
  if ('reward_amount' in item && item.reward_amount) {
    return true
  }

  // 处理嵌套的货币对象
  if (
    isUserCurrency(item) &&
    item.currency &&
    'reward_amount' in item.currency &&
    item.currency.reward_amount
  ) {
    return true
  }

  return false
}

// 判断是否有可领取的奖励
const hasClaimableReward = (item: CurrencyData): boolean => {
  if ('has_claimable_reward' in item) {
    return !!item.has_claimable_reward
  }

  if (isUserCurrency(item) && item.currency && 'has_claimable_reward' in item.currency) {
    return !!item.currency.has_claimable_reward
  }

  return false
}

// 判断是否已经领取过奖励
const hasClaimedReward = (item: CurrencyData): boolean => {
  if ('has_claimed_reward' in item) {
    return !!item.has_claimed_reward
  }

  if (isUserCurrency(item) && item.currency && 'has_claimed_reward' in item.currency) {
    return !!item.currency.has_claimed_reward
  }

  return false
}

// 处理领取货币奖励
const handleClaimCurrency = async (currency: CurrencyData) => {
  // 检查是否已领取过奖励
  if (hasClaimedReward(currency)) {
    showToast('您已领取过该奖励')
    return
  }

  // 检查是否有可领取的奖励
  if (!hasClaimableReward(currency)) {
    showToast('暂无可领取的奖励')
    return
  }

  try {
    let currencyId = 0

    if ('id' in currency && typeof currency.id === 'number') {
      currencyId = currency.id
    } else if (
      isUserCurrency(currency) &&
      currency.currency &&
      typeof currency.currency === 'object' &&
      'id' in currency.currency
    ) {
      currencyId = (currency.currency as any).id
    }

    if (!currencyId) {
      showToast('无效的货币信息')
      return
    }

    const response = await claimCurrency(currencyId)

    if (response.status === 'success') {
      const rewardAmount = formatRewardAmount(currency)
      showToast(`成功领取 ${rewardAmount} 个${getCurrencySymbol(currency)}`)

      // 刷新页面
      emit('buy-success')
    } else {
      showToast(response.message || '领取失败，请稍后再试')
    }
  } catch (error) {
    console.error('领取奖励出错:', error)
    showToast('领取失败，请稍后再试')
  }
}

// 格式化奖励数量显示
const formatRewardAmount = (item: CurrencyData): string => {
  let amount = 0

  if ('reward_amount' in item) {
    amount =
      typeof item.reward_amount === 'string'
        ? parseFloat(item.reward_amount)
        : item.reward_amount || 0
  } else if (isUserCurrency(item) && item.currency) {
    const currency = item.currency as any
    if ('reward_amount' in currency) {
      amount =
        typeof currency.reward_amount === 'string'
          ? parseFloat(currency.reward_amount)
          : currency.reward_amount || 0
    }
  }

  return amount.toString()
}

// 前往货币记录页面
const gotoCurrencyRecords = () => {
  uni.navigateTo({
    url: '/pages/currency-records/index',
  })
}

// 过滤货币列表，让USDT在持有量为0时不显示
const filteredCurrencyList = computed(() => {
  return props.currencyList.filter((item) => {
    // 如果是USDT且持有量为0，则不显示
    if (isUsdt(item) && getCurrencyUserBalance(item) <= 0) {
      return false
    }
    // 其他货币正常显示
    return true
  })
})
</script>

<style lang="scss" scoped>
.currency-list {
  min-height: 400rpx;
}

.currency-item {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1px solid #f0f0f0;
}

.currency-item:last-child {
  border-bottom: none;
}

.currency-icon {
  width: 90rpx;
  height: 90rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  font-weight: bold;
  overflow: hidden;
}

.currency-image {
  width: 100%;
  height: 100%;
}

.currency-icon-text {
  font-size: 40rpx;
  color: #333;
}

.currency-info {
  flex: 1;
}

.currency-name {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 6rpx;
  display: block;
}

.currency-symbol {
  font-size: 24rpx;
  color: #999;
}

.currency-details {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: 20rpx;
}

.currency-price {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 6rpx;
}

.currency-amount {
  font-size: 24rpx;
  color: #999;
}

.currency-arrow {
  color: #ccc;
  font-size: 28rpx;
}

.buy-button-container {
  margin-left: 10rpx;
}

.buy-button {
  height: 60rpx;
  line-height: 60rpx;
  padding: 0 30rpx;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  color: white;
  font-size: 26rpx;
  border-radius: 30rpx;
  border: none;
}

.claim-button-container {
  margin-left: 10rpx;
}

.claim-button {
  height: 60rpx;
  line-height: 60rpx;
  padding: 0 30rpx;
  background: linear-gradient(to right, #4caf50, #2e7d32);
  color: white;
  font-size: 26rpx;
  border-radius: 30rpx;
  border: none;
}

.exchange-button-container {
  margin-left: 20rpx;
}

.exchange-button {
  font-size: 26rpx;
  padding: 8rpx 24rpx;
  background-color: #3498db;
  color: #ffffff;
  border-radius: 30rpx;
  border: none;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
}

.empty-text {
  color: #999;
  font-size: 28rpx;
  margin-bottom: 30rpx;
}

.go-trading-btn {
  background: linear-gradient(to right, #f39c12, #e74c3c);
  color: white;
  font-size: 28rpx;
  padding: 15rpx 40rpx;
  border-radius: 40rpx;
  border: none;
}

.disabled-button {
  background: linear-gradient(to right, #9e9e9e, #616161);
  opacity: 0.8;
}

/* 添加货币记录按钮样式 */
.record-button-container {
  display: flex;
  justify-content: flex-end;
  margin-bottom: 20rpx;
}

.record-button {
  display: flex;
  align-items: center;
  background-color: #f5f6fa;
  border: none;
  border-radius: 30rpx;
  padding: 12rpx 24rpx;
  font-size: 26rpx;
  color: #666;
}

.record-button .uni-icons {
  margin-right: 8rpx;
  font-size: 28rpx;
}

.button-text {
  font-size: 26rpx;
}

.claimed-button-container {
  padding: 0 20rpx;
}

.claimed-text {
  font-size: 24rpx;
  color: #999;
  background-color: #f5f5f5;
  padding: 8rpx 16rpx;
  border-radius: 4rpx;
}

/* 加载状态 */
.currency-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
  background-color: #f9f9f9;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid #f39c12;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #666;
}

/* 旋转动画 */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
