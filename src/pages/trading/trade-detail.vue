<route lang="json5">
{
  style: {
    navigationBarTitleText: '交易详情',
  },
}
</route>

<template>
  <view class="trade-detail-container">
    <!-- 货币信息卡片 -->
    <view class="currency-card">
      <view class="currency-header">
        <view class="currency-icon" v-if="currencyIcon">
          <image class="currency-image" :src="currencyIcon" mode="aspectFit" />
        </view>
        <view
          class="currency-icon"
          v-else
          :style="{ backgroundColor: getBgColorBySymbol(currencySymbol) }"
        >
          <text class="currency-icon-text">
            {{ currencySymbol ? currencySymbol.charAt(0) : 'C' }}
          </text>
        </view>

        <view class="currency-title">
          <text class="currency-name">{{ currencyName || '货币' }}</text>
          <text class="currency-symbol">({{ currencySymbol || 'COIN' }})</text>
        </view>
      </view>

      <view class="price-row">
        <text class="price-label">{{ isTypeBuy ? '买入价格' : '卖出价格' }}</text>
        <text class="price-value">¥{{ formatAmount(currencyPrice) }}</text>
      </view>

      <!-- 如果是卖出，显示用户持有量 -->
      <view class="hold-row" v-if="!isTypeBuy">
        <text class="hold-label">持有数量</text>
        <text class="hold-value">{{ formatAmount(userHoldAmount) }}</text>
      </view>

      <!-- 显示用户余额 -->
      <view class="balance-row" v-if="isTypeBuy">
        <text class="balance-label">账户余额</text>
        <text class="balance-value">¥{{ formatAmount(userBalance) }}</text>
      </view>

      <!-- 不再显示USDT余额，因为不再需要USDT支付手续费 -->
    </view>

    <!-- 交易表单 -->
    <view class="trade-form">
      <view class="form-title">{{ isTypeBuy ? '买入数量' : '卖出数量' }}</view>

      <view class="amount-input-container">
        <input
          class="amount-input"
          type="number"
          v-model="tradeAmount"
          :placeholder="`请输入${isTypeBuy ? '买入' : '卖出'}数量`"
        />
        <text class="currency-unit">{{ currencyUnit }}</text>
      </view>

      <view class="amount-slider-container">
        <slider
          :min="minAmount"
          :max="maxAmount"
          :value="sliderValue"
          @change="handleSliderChange"
          activeColor="#f39c12"
          :block-size="20"
        />
        <view class="slider-labels">
          <text>{{ formatAmount(minAmount) }}</text>
          <text>{{ formatAmount(maxAmount) }}</text>
        </view>
      </view>

      <view class="trade-info">
        <view class="info-row">
          <text class="info-label">交易总额</text>
          <text class="info-value">
            ¥{{ formatAmount((parseFloat(tradeAmount) || 0) * currencyPrice) }}
          </text>
        </view>
        <!-- 不再显示USDT手续费 -->
        <view class="info-row total-row">
          <text class="info-label">实际{{ isTypeBuy ? '支付' : '获得' }}</text>
          <text class="info-value highlight">¥{{ formatAmount(actualAmount) }}</text>
        </view>
      </view>

      <button class="confirm-button" @click="handleConfirmTrade">
        确认{{ isTypeBuy ? '买入' : '卖出' }}
      </button>
    </view>

    <!-- 交易须知 -->
    <view class="trade-notice">
      <view class="notice-title">交易须知</view>
      <view class="notice-item">
        <text class="notice-text">1. 交易前请确认价格和数量无误。</text>
      </view>
      <view class="notice-item">
        <text class="notice-text">2. 买入操作将扣除您账户中相应的人民币余额。</text>
      </view>
      <view class="notice-item">
        <text class="notice-text">3. 卖出操作将扣除您持有的相应数量货币，直接获得人民币收益。</text>
      </view>
      <view class="notice-item">
        <text class="notice-text">4. 交易一旦确认，无法撤销。</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import {
  buyTradeOrder,
  sellCurrencyToPlatform,
  getCurrencyDetail,
  buyUsdt,
} from '@/service/app/currency'
import { httpGet } from '@/utils/http'
import { useUserStore } from '@/store/user'
import { useCurrencyStore } from '@/store' // 导入货币store
import { useUserInfoStore } from '@/store/userInfo' // 导入userInfoStore
import { usePlatformStore } from '@/store/platform' // 导入平台设置store

// 引入用户store
const userStore = useUserStore()
// 引入货币store
const currencyStore = useCurrencyStore()
// 引入userInfoStore
const userInfoStore = useUserInfoStore()
// 引入平台设置store
const platformStore = usePlatformStore()

// 页面参数
const currencyId = ref<string | number>('')
const orderId = ref<string | number>('') // 添加订单ID
const currencyName = ref('')
const currencySymbol = ref('')
const currencyPrice = ref(0)
const tradeType = ref('buy') // buy 或 sell
const currencyIcon = ref('')
const currencyUnit = ref('克')
const feeRate = ref(2) // 默认手续费率2%
const minAmount = ref(0.01) // 默认最小交易量
const maxAmount = ref(100) // 默认最大交易量
const userHoldAmount = ref(0)
const userBalance = ref(0) // 用户余额

// 交易数量
const tradeAmount = ref<string>('')

// 页面加载时获取参数
onLoad((options) => {
  console.log('onLoad接收到的页面参数:', JSON.stringify(options))

  if (!options || Object.keys(options).length === 0) {
    console.warn('没有接收到页面参数')
    return
  }

  // 设置页面参数
  currencyId.value = options.id || ''
  orderId.value = options.orderId || ''
  currencyName.value = options.name ? decodeURIComponent(options.name) : '未知货币'
  currencySymbol.value = options.symbol || ''
  currencyPrice.value = options.price ? parseFloat(options.price) : 0
  tradeType.value = options.type || 'buy'

  // 设置货币图标
  if (options.iconUrl) {
    try {
      currencyIcon.value = decodeURIComponent(options.iconUrl)
    } catch (e) {
      currencyIcon.value = options.iconUrl
    }
  }

  // 设置其他参数
  if (options.fee) feeRate.value = parseFloat(options.fee)
  if (options.minAmount) minAmount.value = parseFloat(options.minAmount)
  if (options.maxAmount) maxAmount.value = parseFloat(options.maxAmount)
  if (options.holdAmount) userHoldAmount.value = parseFloat(options.holdAmount)

  console.log('处理后的交易详情参数:', {
    currencyId: currencyId.value,
    orderId: orderId.value,
    currencyName: currencyName.value,
    currencySymbol: currencySymbol.value,
    currencyPrice: currencyPrice.value,
    tradeType: tradeType.value,
    currencyIcon: currencyIcon.value,
  })

  // 获取其他数据
  fetchCurrencyDetails()
})

// 获取页面参数 - 兼容app端和H5端
const getPageParams = () => {
  let params: Record<string, any> = {}

  try {
    // 尝试从getCurrentPages获取页面参数
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]

    console.log('当前页面信息:', currentPage)

    if (currentPage && (currentPage as any).options) {
      params = (currentPage as any).options
      console.log('从getCurrentPages获取到参数:', JSON.stringify(params))
    }

    // 如果没有获取到参数，尝试其他方式
    if (Object.keys(params).length === 0) {
      // 检查全局参数（如果有的话）
      if ((globalThis as any).pageParams) {
        params = (globalThis as any).pageParams
        console.log('从全局变量获取到参数:', JSON.stringify(params))
      }
    }
  } catch (e) {
    console.error('获取页面参数失败:', e)
  }

  console.log('最终获取到的参数:', JSON.stringify(params))

  // 如果还是没有参数，使用默认值进行测试
  if (Object.keys(params).length === 0) {
    console.warn('没有获取到页面参数，可能影响页面功能')
    // 可以设置一些默认值用于调试
    currencyName.value = '测试货币'
    currencySymbol.value = 'TEST'
    currencyPrice.value = 100
    return
  }

  // 设置参数
  currencyId.value = params.id || ''
  orderId.value = params.orderId || ''
  currencyName.value = params.name ? decodeURIComponent(params.name) : '未知货币'
  currencySymbol.value = params.symbol || ''
  currencyPrice.value = params.price ? parseFloat(params.price) : 0
  tradeType.value = params.type || 'buy'

  // 设置货币图标
  if (params.iconUrl) {
    try {
      currencyIcon.value = decodeURIComponent(params.iconUrl)
    } catch (e) {
      currencyIcon.value = params.iconUrl
    }
  }

  // 设置其他参数
  if (params.fee) feeRate.value = parseFloat(params.fee)
  if (params.minAmount) minAmount.value = parseFloat(params.minAmount)
  if (params.maxAmount) maxAmount.value = parseFloat(params.maxAmount)
  if (params.holdAmount) userHoldAmount.value = parseFloat(params.holdAmount)

  console.log('处理后的交易详情参数:', {
    currencyId: currencyId.value,
    orderId: orderId.value,
    currencyName: currencyName.value,
    currencySymbol: currencySymbol.value,
    currencyPrice: currencyPrice.value,
    tradeType: tradeType.value,
    currencyIcon: currencyIcon.value,
  })

  // 获取其他数据
  fetchCurrencyDetails()
}

// 获取货币详情数据
const fetchCurrencyDetails = async () => {
  try {
    uni.showLoading({ title: '加载中...' })

    // 获取用户持有的货币
    if (tradeType.value === 'sell') {
      // 先从store获取货币列表
      await currencyStore.fetchUserCurrencies(false)
      console.log('交易详情页从store获取用户货币数据')

      if (currencyStore.userCurrencies && currencyStore.userCurrencies.length > 0) {
        // 直接打印所有货币ID和符号，帮助排查问题
        console.log(
          '所有货币列表:',
          currencyStore.userCurrencies.map((c) => ({
            id: c.id,
            symbol: c.symbol || c.currency?.symbol,
          })),
        )
        console.log('当前查找的货币ID:', currencyId.value, '符号:', currencySymbol.value)

        // 通过符号从store获取持有量
        const holdAmount = currencyStore.getUserCurrencyAmount(currencySymbol.value)
        console.log('从store获取的货币持有量:', holdAmount)

        userHoldAmount.value = holdAmount

        // 卖出时，最大交易量不能超过持有量
        maxAmount.value = Math.min(maxAmount.value, userHoldAmount.value)
        console.log('更新后的用户持有量:', userHoldAmount.value, '最大交易量:', maxAmount.value)
      } else {
        console.log('store中没有货币数据')
        userHoldAmount.value = 0
        maxAmount.value = 0
      }
    }

    // 如果没有设置货币图标，尝试获取
    if (!currencyIcon.value) {
      try {
        const detailResponse = await getCurrencyDetail(currencyId.value)
        console.log('获取货币详情响应:', JSON.stringify(detailResponse))

        if (detailResponse.status === 'success' && detailResponse.data) {
          // 安全地访问图标属性
          const currency = detailResponse.data
          const icon = (currency as any)?.icon
          if (icon && typeof icon === 'string') {
            currencyIcon.value = getCurrencyIconUrl(icon)
          }
        }
      } catch (error) {
        console.error('获取货币详情失败:', error)
      }
    }
  } catch (error) {
    console.error('获取货币详情失败:', error)
  } finally {
    uni.hideLoading()
  }
}

// 获取货币图标URL
const getCurrencyIconUrl = (iconPath: string) => {
  if (!iconPath) return ''

  // 如果已经是完整URL，直接返回
  if (iconPath.startsWith('http')) {
    return iconPath
  }

  // 否则拼接基础URL
  return `https://www.boceasy.com/storage/${iconPath}`
}

// 根据货币符号获取背景颜色
const getBgColorBySymbol = (symbol: string) => {
  const colorMap: Record<string, string> = {
    GOLD: 'rgba(243, 156, 18, 0.2)',
    SILVER: 'rgba(189, 195, 199, 0.2)',
    PLATINUM: 'rgba(52, 152, 219, 0.2)',
    // 可以添加更多颜色映射
  }

  return colorMap[symbol] || 'rgba(149, 165, 166, 0.2)' // 默认颜色
}

// 交易类型是否为买入
const isTypeBuy = computed(() => tradeType.value === 'buy')

// 滑块值
const sliderValue = computed(() => {
  const amount = parseFloat(tradeAmount.value) || 0
  return Math.min(Math.max(amount, minAmount.value), maxAmount.value)
})

// 计算实际金额
const actualAmount = computed(() => {
  const amount = parseFloat(tradeAmount.value) || 0
  const total = amount * currencyPrice.value

  // 无论买入还是卖出，都直接返回交易总额
  return total
})

// 处理滑块变化
const handleSliderChange = (e: any) => {
  tradeAmount.value = e.detail.value.toString()
}

// 格式化金额显示
const formatAmount = (amount: number) => {
  // 处理undefined、null或NaN的情况
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0.00'
  }
  return amount.toFixed(2)
}

// 获取用户余额
const fetchUserBalance = async () => {
  try {
    // 不再调用API接口，直接从store获取数据
    console.log('从userStore获取用户余额数据')

    // 确保类型转换正确
    if (userStore.userInfo && userStore.userInfo.balance !== undefined) {
      // 将store中的balance转换为数字类型
      const balanceValue =
        typeof userStore.userInfo.balance === 'string'
          ? parseFloat(userStore.userInfo.balance)
          : userStore.userInfo.balance || 0

      userBalance.value = balanceValue
      console.log('从store获取的用户余额:', balanceValue)
    } else {
      console.log('用户余额数据不存在，设置为0')
      userBalance.value = 0
    }
  } catch (error) {
    console.error('获取用户余额失败:', error)
    userBalance.value = 0
  }
}

// 确认交易
const handleConfirmTrade = async () => {
  // 检查实名认证状态
  const { useVerificationStore } = await import('@/store')
  const verificationStore = useVerificationStore()
  
  // 确保平台设置已加载
  if (!platformStore.isLoaded) {
    await platformStore.fetchPlatformSettings()
  }
  
  // 检查平台交易功能是否开启
  if (currencySymbol.value === 'GOLD') {
    if (isTypeBuy.value && !platformStore.enableGoldBuy) {
      uni.showToast({
        title: '购买系统正在维护更新',
        icon: 'none',
      })
      return
    }
    
    if (!isTypeBuy.value && !platformStore.enableGoldSell) {
      uni.showToast({
        title: '购买系统正在维护更新',
        icon: 'none',
      })
      return
    }
  }
  
  // 检查USDT购买功能
  if (currencySymbol.value === 'USDT' && isTypeBuy.value && !platformStore.enableUsdtBuy) {
    uni.showToast({
      title: '购买系统正在维护更新',
      icon: 'none',
    })
    return
  }

  if (!verificationStore.isVerified) {
    uni.showModal({
      title: '需要实名认证',
      content: '交易功能需要完成实名认证后才能使用，请先完成实名认证。',
      confirmText: '去认证',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 用户点击确认，跳转到实名认证页面
          uni.navigateTo({
            url: '/pages/my/identity-verify',
          })
        }
      },
    })
    return
  }

  // 如果是卖出操作，不再检查银行卡状态
  if (!isTypeBuy.value) {
    // 已取消银行卡校验逻辑
    console.log('卖出黄金无需校验银行卡状态')
  }

  // 输入验证
  if (!tradeAmount.value || parseFloat(tradeAmount.value) <= 0) {
    uni.showToast({
      title: '请输入有效的交易数量',
      icon: 'none',
    })
    return
  }

  const amount = parseFloat(tradeAmount.value)

  // 验证最小交易量
  if (amount < minAmount.value) {
    uni.showToast({
      title: `最小交易量为${minAmount.value}`,
      icon: 'none',
    })
    return
  }

  // 验证最大交易量
  if (amount > maxAmount.value) {
    uni.showToast({
      title: `最大交易量为${maxAmount.value}`,
      icon: 'none',
    })
    return
  }

  // 如果是卖出，验证用户持有量
  if (!isTypeBuy.value && amount > userHoldAmount.value) {
    uni.showToast({
      title: '持有量不足',
      icon: 'none',
    })
    return
  }

  // 如果是买入，验证用户余额是否足够
  if (isTypeBuy.value && actualAmount.value > userBalance.value) {
    uni.showToast({
      title: '余额不足，无法完成交易',
      icon: 'none',
    })
    return
  }

  // 确认提示
  uni.showModal({
    title: '确认交易',
    content: `确定要${isTypeBuy.value ? '买入' : '卖出'} ${amount} ${currencySymbol.value}吗？`,
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({ title: '处理中...' })

          let response

          if (isTypeBuy.value) {
            // 买入操作
            // 转换成number类型
            const orderIdVal =
              typeof orderId.value === 'string' ? parseInt(orderId.value) : orderId.value

            // 区分USDT和其他货币的购买API路径
            if (currencySymbol.value === 'USDT') {
              // USDT使用新的API路径: /api/orders/buy-usdt
              response = await buyUsdt(amount)
            } else {
              // 其他货币使用原来的API路径: /api/currencies/trade-orders/{id}/buy
              response = await buyTradeOrder(orderIdVal, amount)
            }
          } else {
            // 卖出操作 - 调用API出售货币到平台
            // API路径: /api/currencies/sell-to-platform
            // 转换成number类型
            const currencyIdVal =
              typeof currencyId.value === 'string' ? parseInt(currencyId.value) : currencyId.value
            response = await sellCurrencyToPlatform(currencyIdVal, amount)
          }

          // 打印API响应结果
          console.log(`${isTypeBuy.value ? '买入' : '卖出'}响应结果:`, JSON.stringify(response))

          if (response.status === 'success') {
            // 计算交易后的新余额
            let newBalance = userBalance.value

            if (isTypeBuy.value) {
              // 买入时，余额减少
              newBalance = userBalance.value - actualAmount.value
            } else {
              // 卖出时，余额增加
              newBalance = userBalance.value + actualAmount.value
            }

            // 更新Pinia中的用户余额
            userStore.updateUserBalance(newBalance)

            // 刷新store中的货币数据
            console.log('交易成功，刷新store中的货币数据')
            await currencyStore.fetchUserCurrencies(true)

            // 交易成功，显示成功提示
            uni.showToast({
              title: isTypeBuy.value ? '买入成功' : '卖出成功',
              icon: 'success',
              duration: 2000,
            })

            // 更新用户余额数据 - 使用store而非API
            console.log('交易成功，使用store获取最新数据')
            // 直接从userStore和currencyStore获取更新后的数据
            fetchUserBalance()

            // 如果是交易成功，等待2秒后返回上一页
            setTimeout(() => {
              uni.navigateBack()
            }, 2000)
          } else {
            // 处理API返回的错误信息
            const errorMsg = response.message || `${isTypeBuy.value ? '买入' : '卖出'}失败，请重试`
            uni.showToast({
              title: response.message,
              icon: 'none',
              duration: 3000,
            })
          }
        } catch (error: any) {
          console.error(`${isTypeBuy.value ? '买入' : '卖出'}交易出错:`, error)

          // 构造错误信息
          let errorMessage =
            error?.data.message || `${isTypeBuy.value ? '买入' : '卖出'}失败，请稍后再试`

          uni.showToast({
            title: error?.data.message,
            icon: 'none',
            duration: 3000,
          })
        } finally {
          uni.hideLoading()
        }
      }
    },
  })
}

// 页面加载
onMounted(() => {
  // onLoad已经处理了页面参数，这里只需要获取用户余额
  console.log('页面已挂载，获取用户余额')
  fetchUserBalance()
})
</script>

<style lang="scss">
/* 页面样式 */
.trade-detail-container {
  min-height: 100vh;
  padding: 30rpx;
  background-color: #f5f5f5;
}
/* 货币信息卡片 */
.currency-card {
  padding: 30rpx;
  margin-bottom: 30rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.currency-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.currency-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80rpx;
  height: 80rpx;
  margin-right: 20rpx;
  background-color: rgba(149, 165, 166, 0.2);
  border-radius: 50%;
}

.currency-image {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
}

.currency-icon-text {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.currency-title {
  display: flex;
  flex-direction: column;
}

.currency-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
}

.currency-symbol {
  margin-top: 4rpx;
  font-size: 26rpx;
  color: #999;
}

.price-row,
.hold-row,
.balance-row {
  display: flex;
  justify-content: space-between;
  margin-top: 20rpx;
}

.price-label,
.hold-label,
.balance-label {
  font-size: 28rpx;
  color: #666;
}

.price-value,
.hold-value,
.balance-value {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}
/* 交易表单 */
.trade-form {
  padding: 30rpx;
  margin-bottom: 30rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.form-title {
  margin-bottom: 20rpx;
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
}

.amount-input-container {
  display: flex;
  align-items: center;
  padding-bottom: 20rpx;
  margin-bottom: 30rpx;
  border-bottom: 1px solid #e0e0e0;
}

.amount-input {
  flex: 1;
  height: 90rpx;
  font-size: 40rpx;
}

.currency-unit {
  margin-left: 10rpx;
  font-size: 28rpx;
  color: #666;
}

.amount-slider-container {
  margin-bottom: 30rpx;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  margin-top: 10rpx;
  font-size: 24rpx;
  color: #999;
}

.trade-info {
  padding: 20rpx;
  margin-bottom: 30rpx;
  background-color: #f9f9f9;
  border-radius: 16rpx;
}

.info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10rpx;
}

.info-label {
  font-size: 26rpx;
  color: #666;
}

.info-value {
  font-size: 26rpx;
  color: #333;
}

.total-row {
  padding-top: 20rpx;
  margin-top: 20rpx;
  border-top: 1px dashed #e0e0e0;
}

.total-row .info-label,
.total-row .info-value {
  font-size: 30rpx;
  font-weight: 500;
}

.highlight {
  color: #f39c12;
}

.confirm-button {
  width: 100%;
  height: 90rpx;
  margin-top: 20rpx;
  font-size: 32rpx;
  font-weight: 500;
  color: #ffffff;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  border-radius: 45rpx;
}
/* 交易须知 */
.trade-notice {
  padding: 30rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.notice-title {
  margin-bottom: 20rpx;
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
}

.notice-item {
  margin-bottom: 15rpx;
}

.notice-text {
  font-size: 26rpx;
  line-height: 1.5;
  color: #666;
}
</style>
