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

      <!-- 显示用户USDT余额 -->
      <view class="balance-row" v-if="!isTypeBuy">
        <text class="balance-label">USDT余额</text>
        <text class="balance-value">{{ formatUsdtAmount(userUsdtBalance) }} USDT</text>
      </view>
    </view>

    <!-- 交易表单 -->
    <view class="trade-form">
      <view class="form-title">{{ isTypeBuy ? '买入数量' : '卖出数量' }}</view>

      <view class="amount-input-container">
        <input
          class="amount-input"
          type="digit"
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
        <view class="info-row" v-if="!isTypeBuy">
          <text class="info-label">手续费 ({{ feeRate }}%)</text>
          <text class="info-value">
            {{ formatUsdtAmount((parseFloat(tradeAmount) || 0) * currencyPrice * (feeRate / 100)) }}
            USDT
          </text>
        </view>
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
        <text class="notice-text">3. 卖出操作将扣除您持有的相应数量货币。</text>
      </view>
      <view class="notice-item">
        <text class="notice-text">4. 交易一旦确认，无法撤销。</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { buyTradeOrder, sellCurrencyToPlatform, getCurrencyDetail } from '@/service/app/currency'
import { useUserStore } from '@/store/user'
import { useCurrencyStore } from '@/store' // 导入货币store

// 引入用户store
const userStore = useUserStore()
// 引入货币store
const currencyStore = useCurrencyStore()

// 页面参数
const currencyId = ref<string | number>('')
const orderId = ref<string | number>('') // 添加订单ID
const currencyName = ref('')
const currencySymbol = ref('')
const currencyPrice = ref(0)
const tradeType = ref('buy') // buy 或 sell
const currencyIcon = ref('')
const currencyUnit = ref('个')
const feeRate = ref(2) // 默认手续费率2%
const minAmount = ref(0.01) // 默认最小交易量
const maxAmount = ref(100) // 默认最大交易量
const userHoldAmount = ref(0)
const userBalance = ref(0) // 用户余额
const userUsdtBalance = ref(0) // 用户持有的USDT余额

// 交易数量
const tradeAmount = ref<string>('')

// 获取页面参数
const getPageParams = () => {
  // 尝试通过不同的方式获取页面参数
  let params: Record<string, any> = {}

  try {
    // 方法1: 从onLoad参数获取 (小程序常用方式)
    const pages = getCurrentPages()
    const currentPage = pages[pages.length - 1]
    if (currentPage && (currentPage as any).options) {
      params = (currentPage as any).options
    }
  } catch (e) {
    console.error('从页面对象获取参数失败:', e)
  }

  // 如果没有获取到参数，使用备用方式
  if (Object.keys(params).length === 0) {
    const sysInfoParams = (uni.getSystemInfoSync() as any)?.options?.query
    if (sysInfoParams) {
      params = sysInfoParams
    }
  }

  console.log('交易详情页接收到的参数:', JSON.stringify(params))

  // 设置默认值和转换参数
  currencyId.value = params.id || ''
  orderId.value = params.orderId || '' // 获取订单ID
  currencyName.value = params.name ? decodeURIComponent(params.name) : '未知货币'
  currencySymbol.value = params.symbol || ''
  currencyPrice.value = params.price ? parseFloat(params.price) : 0
  tradeType.value = params.type || 'buy'

  // 如果有iconUrl参数，设置货币图标
  if (params.iconUrl) {
    try {
      currencyIcon.value = decodeURIComponent(params.iconUrl)
    } catch (e) {
      currencyIcon.value = params.iconUrl
    }
  }

  // 如果有fee参数，设置手续费率
  if (params.fee) {
    feeRate.value = parseFloat(params.fee)
  }

  // 如果有minAmount参数，设置最小交易量
  if (params.minAmount) {
    minAmount.value = parseFloat(params.minAmount)
  }

  // 如果有maxAmount参数，设置最大交易量
  if (params.maxAmount) {
    maxAmount.value = parseFloat(params.maxAmount)
  }

  // 如果传递了holdAmount参数，直接设置用户持有量
  if (params.holdAmount) {
    userHoldAmount.value = parseFloat(params.holdAmount)
  }

  console.log('处理后的交易详情参数:', {
    currencyId: currencyId.value,
    orderId: orderId.value,
    currencyName: currencyName.value,
    currencySymbol: currencySymbol.value,
    currencyPrice: currencyPrice.value,
    tradeType: tradeType.value,
    currencyIcon: currencyIcon.value,
    feeRate: feeRate.value,
    minAmount: minAmount.value,
    maxAmount: maxAmount.value,
    userHoldAmount: userHoldAmount.value,
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

// 格式化USDT显示，精确到4位小数
const formatUsdtAmount = (amount: number) => {
  // 处理undefined、null或NaN的情况
  if (amount === undefined || amount === null || isNaN(amount)) {
    return '0.0000'
  }
  return amount.toFixed(4)
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

    // 获取用户USDT余额
    await fetchUserUsdtBalance()
  } catch (error) {
    console.error('获取用户余额失败:', error)
    userBalance.value = 0

    // 即使获取人民币余额失败，也尝试获取USDT余额
    await fetchUserUsdtBalance()
  }
}

// 获取用户USDT余额
const fetchUserUsdtBalance = async () => {
  try {
    // 从store获取USDT余额
    await currencyStore.fetchUserCurrencies(false)

    // 通过store获取USDT持有量
    const usdtAmount = currencyStore.getUserCurrencyAmount('USDT')
    userUsdtBalance.value = usdtAmount
    console.log('从store获取的用户USDT余额:', usdtAmount)
  } catch (error) {
    console.error('获取USDT余额失败:', error)
    userUsdtBalance.value = 0
  }
}

// 确认交易
const handleConfirmTrade = async () => {
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

  // 如果是卖出，验证用户USDT余额是否足够支付手续费
  if (!isTypeBuy.value) {
    const feeAmount = amount * currencyPrice.value * (feeRate.value / 100)
    if (feeAmount > userUsdtBalance.value) {
      uni.showModal({
        title: 'USDT余额不足',
        content: `您的USDT余额不足以支付${formatUsdtAmount(feeAmount)} USDT的手续费，是否前往充值？`,
        confirmText: '去充值',
        cancelText: '取消',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({
              url: '/pages/trading/exchange',
            })
          }
        },
      })
      return
    }
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
            // 买入操作 - 调用API进行交易订单购买
            // API路径: /api/currencies/trade-orders/{id}/buy
            // 转换成number类型
            const orderIdVal =
              typeof orderId.value === 'string' ? parseInt(orderId.value) : orderId.value
            response = await buyTradeOrder(orderIdVal, amount)
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

            // 发送全局事件通知，告知用户余额已更新
            uni.$emit('user_balance_updated', {
              balance: newBalance,
              operation: isTypeBuy.value ? 'buy' : 'sell',
              amount: amount,
              symbol: currencySymbol.value,
            })

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
              // 返回上一页并刷新
              uni.navigateBack()

              // 尝试通知上一页刷新数据
              try {
                const pages = getCurrentPages()
                const prevPage = pages[pages.length - 2]

                // 检查上一页是否是交易所页面并调用其刷新方法
                if (prevPage && typeof (prevPage as any).refreshData === 'function') {
                  console.log('调用上一页的刷新方法')
                  ;(prevPage as any).refreshData()
                } else {
                  // 如果上一页没有refreshData方法，使用替代方案
                  console.log('上一页没有刷新方法，使用替代方案')
                  // 在返回到上一页后通过自定义事件刷新
                  uni.$emit('trade_completed', {
                    type: isTypeBuy.value ? 'buy' : 'sell',
                    currency_id: currencyId.value,
                  })
                }
              } catch (e) {
                console.error('通知上一页刷新失败:', e)
                // 出错时也尝试使用事件通知
                uni.$emit('trade_completed', {
                  type: isTypeBuy.value ? 'buy' : 'sell',
                  currency_id: currencyId.value,
                })
              }
            }, 2000)
          } else {
            // 处理API返回的错误信息
            let errorMsg = response.message || `${isTypeBuy.value ? '买入' : '卖出'}失败，请重试`
            // 一些常见错误的友好提示
            // if (errorMsg.includes('余额不足')) {
            //   errorMsg = isTypeBuy.value ? '您的余额不足，无法完成交易' : '您的货币余额不足';
            // } else if (errorMsg.includes('USDT余额不足')) {
            //   errorMsg = '您的USDT余额不足，无法支付手续费';
            // } else if (errorMsg.includes('最小交易量')) {
            //   errorMsg = `交易数量不能低于最小交易量 ${minAmount.value}`;
            // } else if (errorMsg.includes('最大交易量')) {
            //   errorMsg = `交易数量不能超过最大交易量 ${maxAmount.value}`;
            // }

            uni.showToast({
              title: errorMsg.message,
              icon: 'none',
              duration: 3000,
            })

            // // 如果是余额不足的错误，刷新余额数据
            // if (errorMsg.includes('余额不足')) {
            //   fetchUserBalance();
            // }
          }
        } catch (error: any) {
          console.error(`${isTypeBuy.value ? '买入' : '卖出'}交易出错:`, error)

          // 构造错误信息
          let errorMessage =
            error?.data.message || `${isTypeBuy.value ? '买入' : '卖出'}失败，请稍后再试`

          // 处理网络错误
          if (error.name === 'NetworkError' || errorMessage.includes('网络')) {
            errorMessage = '网络连接失败，请检查网络设置'
          }

          uni.showToast({
            title: '112121',
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
  getPageParams()
  fetchUserBalance()
})
</script>

<style lang="scss">
/* 页面样式 */
.trade-detail-container {
  padding: 30rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
}

/* 货币信息卡片 */
.currency-card {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.currency-header {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
}

.currency-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  background-color: rgba(149, 165, 166, 0.2);
}

.currency-image {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
}

.currency-icon-text {
  font-size: 36rpx;
  color: #333;
  font-weight: bold;
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
  font-size: 26rpx;
  color: #999;
  margin-top: 4rpx;
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
  color: #333;
  font-weight: 500;
}

/* 交易表单 */
.trade-form {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.form-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 20rpx;
}

.amount-input-container {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 20rpx;
  margin-bottom: 30rpx;
}

.amount-input {
  flex: 1;
  font-size: 40rpx;
  height: 90rpx;
}

.currency-unit {
  font-size: 28rpx;
  color: #666;
  margin-left: 10rpx;
}

.amount-slider-container {
  margin-bottom: 30rpx;
}

.slider-labels {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
}

.trade-info {
  background-color: #f9f9f9;
  border-radius: 16rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
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
  margin-top: 20rpx;
  padding-top: 20rpx;
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
  border-radius: 45rpx;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 500;
  margin-top: 20rpx;
}

/* 交易须知 */
.trade-notice {
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.notice-title {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 20rpx;
}

.notice-item {
  margin-bottom: 15rpx;
}

.notice-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
}
</style>
