<template>
  <wd-popup v-model="showPopup" round position="center">
    <view class="popup-content">
      <view class="popup-header">
        <text class="popup-title">购买USDT</text>
        <text class="popup-close" @click="handleClose">×</text>
      </view>
      <view class="popup-body">
        <view class="currency-info">
          <view class="currency-icon">
            <image class="icon-image" :src="usdtIconUrl" mode="aspectFit" />
          </view>
          <view class="currency-details">
            <text class="currency-name">USDT</text>
            <text class="currency-price">¥{{ price }} / USDT</text>
          </view>
        </view>

        <view class="balance-info">
          <text class="balance-label">当前余额:</text>
          <text class="balance-value">¥{{ formatAmount(localUserBalance) }}</text>
        </view>

        <view class="amount-input-container">
          <text class="amount-label">购买数量</text>
          <view class="amount-input-wrapper">
            <input
              class="amount-input"
              type="digit"
              v-model="amount"
              placeholder="请输入购买数量"
              @input="calculateTotal"
            />
            <text class="amount-unit">USDT</text>
          </view>
          <view class="amount-tips" v-if="showTips">
            <text class="tip-text" v-if="minPurchaseAmount > 0">
              最小购买数量: {{ minPurchaseAmount }} USDT
            </text>
            <text class="tip-text" v-if="maxPurchaseAmount > 0">
              最大购买数量: {{ maxPurchaseAmount }} USDT
            </text>
          </view>
        </view>

        <view class="total-amount">
          <text class="total-label">支付金额:</text>
          <text class="total-value">¥{{ formatAmount(totalAmount) }}</text>
        </view>

        <button
          class="confirm-btn"
          :class="{ 'btn-disabled': isButtonDisabled }"
          :disabled="isButtonDisabled"
          @click="handleConfirm"
        >
          确认购买
        </button>

        <!-- <view class="notice-container">
          <text class="notice-text">购买USDT需要管理员审核，审核通过后会自动到账</text>
        </view> -->
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { buyUsdt, getUserBalance } from '@/service/app'
import { useUserStore } from '@/store/user'

const props = defineProps({
  price: {
    type: Number,
    default: 1.0,
  },
  userBalance: {
    type: Number,
    default: 0,
  },
  iconUrl: {
    type: String,
    default: '',
  },
})

const emit = defineEmits(['close', 'success'])

// 用户余额状态
const localUserBalance = ref(props.userBalance)
// 用户存储
const userStore = useUserStore()

// 弹窗显示状态
const showPopup = ref(false)

// 购买数量
const amount = ref('')

// 计算总金额
const totalAmount = ref(0)

// 添加最大最小购买数量和提示显示状态
const minPurchaseAmount = ref(0)
const maxPurchaseAmount = ref(0)
const showTips = ref(false)

// 计算USDT图标URL
const usdtIconUrl = computed(() => {
  if (props.iconUrl) {
    return props.iconUrl.startsWith('http')
      ? props.iconUrl
      : `https://www.bzboc.com/storage/${props.iconUrl}`
  }
  return 'https://www.bzboc.com/storage/currencies/usdt.png'
})

// 计算按钮是否禁用
const isButtonDisabled = computed(() => {
  return totalAmount.value > localUserBalance.value || totalAmount.value <= 0
})

// 计算总金额
const calculateTotal = () => {
  const buyAmount = parseFloat(amount.value) || 0
  totalAmount.value = buyAmount * props.price
}

// 获取用户余额
const fetchUserBalance = async () => {
  try {
    console.log('获取最新用户余额')
    const response = await getUserBalance()
    console.log('用户余额API响应:', response)

    // 根据我们知道的getUserBalance返回结构处理
    if (response && response.status === 'success' && response.data) {
      if (typeof response.data.balance === 'number') {
        localUserBalance.value = response.data.balance
        console.log('获取到用户余额:', localUserBalance.value)
      } else {
        // API返回格式与预期不符，使用备选数据源
        localUserBalance.value = Number(userStore.userInfo.balance) || props.userBalance || 0
        console.log('API返回格式不符，使用备选余额:', localUserBalance.value)
      }
    } else {
      // API调用失败，使用store或props中的数据
      localUserBalance.value = Number(userStore.userInfo.balance) || props.userBalance || 0
      console.log('API调用失败，使用备选余额:', localUserBalance.value)
    }
  } catch (error) {
    console.error('获取用户余额失败:', error)
    // 使用store或props中的数据作为备选
    localUserBalance.value = Number(userStore.userInfo.balance) || props.userBalance || 0
    console.log('异常情况，使用备选余额:', localUserBalance.value)
  }
}

// 格式化金额显示
const formatAmount = (value: number) => {
  return value.toFixed(2)
}

// 打开弹窗
const open = async () => {
  // 输出初始余额信息
  console.log('打开前余额数据:', {
    props: props.userBalance,
    store: userStore.userInfo.balance,
    local: localUserBalance.value,
  })

  // 先获取最新的用户余额
  await fetchUserBalance()

  // 输出更新后的余额信息
  console.log('获取余额后状态:', {
    props: props.userBalance,
    store: userStore.userInfo.balance,
    local: localUserBalance.value,
  })

  showPopup.value = true
  amount.value = ''
  totalAmount.value = 0
  // 重置提示状态
  showTips.value = false
  minPurchaseAmount.value = 0
  maxPurchaseAmount.value = 0
}

// 初始化
onMounted(() => {
  // 初始化本地余额变量
  localUserBalance.value = props.userBalance
})

// 关闭弹窗
const handleClose = () => {
  showPopup.value = false
  emit('close')
}

// 确认购买
const handleConfirm = async () => {
  if (isButtonDisabled.value) return

  try {
    const buyAmount = parseFloat(amount.value)

    // 前端预验证，提供即时反馈
    if (!buyAmount || buyAmount <= 0) {
      uni.showToast({
        title: '请输入有效的购买数量',
        icon: 'none',
      })
      return
    }

    const res = await buyUsdt(buyAmount)

    if (res.status === 'success') {
      uni.showToast({
        title: res.message || '购买成功',
        icon: 'success',
      })

      // 通知父组件操作成功
      emit('success')

      // 关闭弹窗
      handleClose()
    } else {
      // 处理错误信息，显示友好的提示
      handleErrorMessage(res)
    }
  } catch (error: any) {
    console.error('购买USDT失败:', error)

    // 处理网络错误或其他异常
    if (error?.data?.message) {
      handleErrorMessage(error.data)
    } else if (error?.response?.data?.message) {
      handleErrorMessage(error.response.data)
    } else {
      uni.showToast({
        title: '网络错误，请稍后重试',
        icon: 'none',
        duration: 3000,
      })
    }
  }
}

// 处理错误信息
const handleErrorMessage = (errorData: any) => {
  const message = errorData.message || '操作失败'
  const data = errorData.data || {}

  // 根据错误类型提供不同的处理
  if (message.includes('购买数量不足最小限制')) {
    // 显示最小购买数量提示
    const minRequired = Number(data.min_required || data.minRequired || 0)
    minPurchaseAmount.value = minRequired
    showTips.value = true

    uni.showToast({
      title: `最小购买数量为 ${minRequired} USDT`,
      icon: 'none',
      duration: 3000,
    })
  } else if (message.includes('购买数量超过最大限制')) {
    // 显示最大购买数量提示
    const maxAllowed = Number(data.max_allowed || data.maxAllowed || 0)
    maxPurchaseAmount.value = maxAllowed
    showTips.value = true

    uni.showToast({
      title: `最大购买数量为 ${maxAllowed} USDT`,
      icon: 'none',
      duration: 3000,
    })
  } else if (message.includes('余额不足')) {
    // 余额不足的处理
    uni.showToast({
      title: '余额不足，请先充值',
      icon: 'none',
      duration: 3000,
    })
  } else {
    // 其他错误显示通用提示
    uni.showToast({
      title: message,
      icon: 'none',
      duration: 3000,
    })
  }
}

// 暴露方法
defineExpose({
  open,
})
</script>

<style lang="scss" scoped>
.popup-content {
  width: 600rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1px solid #f0f0f0;
}

.popup-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
}

.popup-close {
  font-size: 40rpx;
  color: #999;
  line-height: 1;
}

.popup-body {
  padding: 30rpx;
}

.currency-info {
  display: flex;
  align-items: center;
  margin-bottom: 30rpx;
}

.currency-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 40rpx;
  overflow: hidden;
  margin-right: 20rpx;
  background-color: #f5f5f5;
  display: flex;
  align-items: center;
  justify-content: center;
}

.icon-image {
  width: 80rpx;
  height: 80rpx;
}

.currency-details {
  flex: 1;
}

.currency-name {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 6rpx;
  display: block;
}

.currency-price {
  font-size: 26rpx;
  color: #666;
}

.balance-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
  padding: 20rpx;
  background-color: #f9f9f9;
  border-radius: 10rpx;
}

.balance-label {
  font-size: 28rpx;
  color: #666;
}

.balance-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.amount-input-container {
  margin-bottom: 30rpx;
}

.amount-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 15rpx;
  display: block;
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  border: 1px solid #e0e0e0;
  border-radius: 10rpx;
  padding: 20rpx;
}

.amount-input {
  flex: 1;
  height: 60rpx;
  font-size: 32rpx;
}

.amount-unit {
  font-size: 28rpx;
  color: #666;
  margin-left: 10rpx;
}

.amount-tips {
  margin-top: 15rpx;
  padding: 15rpx;
  background-color: #f8f8f8;
  border-radius: 8rpx;
  border-left: 4rpx solid #f39c12;
}

.tip-text {
  display: block;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 8rpx;

  &:last-child {
    margin-bottom: 0;
  }
}

.total-amount {
  display: flex;
  justify-content: space-between;
  margin-bottom: 40rpx;
}

.total-label {
  font-size: 28rpx;
  color: #666;
}

.total-value {
  font-size: 32rpx;
  color: #f39c12;
  font-weight: 500;
}

.confirm-btn {
  width: 100%;
  height: 90rpx;
  border: none;
  border-radius: 45rpx;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  color: white;
  font-size: 32rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.btn-disabled {
  background: #cccccc;
  color: #ffffff;
}

.notice-container {
  padding: 10rpx 0;
}

.notice-text {
  font-size: 24rpx;
  color: #999;
  text-align: center;
  display: block;
}
</style>
