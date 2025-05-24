<route lang="json5">
{
  style: {
    navigationBarTitleText: '支付',
  },
}
</route>

<template>
  <view class="payment-container">
    <!-- 支付信息卡片 -->
    <view class="payment-card">
      <view class="payment-header">
        <text class="payment-title">账户开户支付</text>
        <view class="payment-amount">
          <text class="amount-label">支付金额</text>
          <text class="amount-value">¥{{ orderInfo.total_amount || 0 }}</text>
        </view>
      </view>
      
      <view class="payment-details">
        <view class="detail-item">
          <text class="detail-label">预存金额</text>
          <text class="detail-value">¥{{ orderInfo.deposit_amount || 0 }}</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">订单号</text>
          <text class="detail-value">{{ orderInfo.order_id || '' }}</text>
        </view>
      </view>
    </view>

    <!-- 支付方式选择 -->
    <view class="payment-methods">
      <view class="method-title">选择支付方式</view>
      <view class="method-list">
        <view 
          class="method-item" 
          :class="{ active: selectedMethod === 'alipay' }"
          @click="selectPaymentMethod('alipay')"
        >
          <view class="method-icon alipay-icon">
            <text class="iconfont icon-alipay"></text>
          </view>
          <text class="method-name">支付宝</text>
          <view class="method-radio">
            <view class="radio-dot" v-if="selectedMethod === 'alipay'"></view>
          </view>
        </view>
        
        <view 
          class="method-item" 
          :class="{ active: selectedMethod === 'wxpay' }"
          @click="selectPaymentMethod('wxpay')"
        >
          <view class="method-icon wechat-icon">
            <text class="iconfont icon-wechat"></text>
          </view>
          <text class="method-name">微信支付</text>
          <view class="method-radio">
            <view class="radio-dot" v-if="selectedMethod === 'wxpay'"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 支付按钮 -->
    <view class="payment-footer">
      <button 
        class="pay-button" 
        :disabled="!selectedMethod || isProcessing"
        @click="handlePayment"
      >
        {{ isProcessing ? '处理中...' : `立即支付 ¥${orderInfo.total_amount || 0}` }}
      </button>
    </view>

    <!-- 支付二维码弹窗 -->
    <wd-popup v-model="showQRCode" position="center" :close-on-click-overlay="false">
      <view class="qrcode-popup">
        <view class="qrcode-header">
          <text class="qrcode-title">扫码支付</text>
          <view class="qrcode-close" @click="closeQRCode">
            <text class="iconfont icon-close"></text>
          </view>
        </view>
        
        <view class="qrcode-content">
          <view class="qrcode-wrapper" v-if="paymentQRCode">
            <image :src="paymentQRCode" class="qrcode-image" mode="aspectFit"></image>
          </view>
          <text class="qrcode-tip">请使用{{ selectedMethodName }}扫描二维码完成支付</text>
          <text class="qrcode-amount">支付金额：¥{{ orderInfo.total_amount || 0 }}</text>
        </view>
        
        <view class="qrcode-footer">
          <button class="check-button" @click="checkPaymentStatus">检查支付状态</button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad } from '@dcloudio/uni-app'
import { 
  createAccountOpenOrderAPI, 
  queryAccountOpenOrderAPI,
  type IAccountOpenOrder 
} from '@/service/index/account'
import { useUserStore } from '@/store'

// 用户存储
const userStore = useUserStore()

// 页面参数
const pageParams = ref<{
  userInfo?: string
  depositAmount?: string
  paymentType?: string
}>({})

// 订单信息
const orderInfo = ref<Partial<IAccountOpenOrder>>({})

// 支付相关状态
const selectedMethod = ref<'alipay' | 'wxpay' | ''>('')
const isProcessing = ref(false)
const showQRCode = ref(false)
const paymentQRCode = ref('')
const checkTimer = ref<number | null>(null)

// 计算属性
const selectedMethodName = computed(() => {
  return selectedMethod.value === 'alipay' ? '支付宝' : '微信'
})

// 页面加载时获取参数
onLoad((options) => {
  pageParams.value = options as any
  
  // 如果有传入的支付方式，设置默认选中
  if (options.paymentType) {
    selectedMethod.value = options.paymentType as 'alipay' | 'wxpay'
  } else {
    selectedMethod.value = 'alipay' // 默认选择支付宝
  }
})

// 选择支付方式
const selectPaymentMethod = (method: 'alipay' | 'wxpay') => {
  selectedMethod.value = method
}

// 处理支付
const handlePayment = async () => {
  if (!selectedMethod.value) {
    uni.showToast({
      title: '请选择支付方式',
      icon: 'none'
    })
    return
  }

  try {
    isProcessing.value = true
    
    // 解析用户信息
    const userInfo = pageParams.value.userInfo ? JSON.parse(pageParams.value.userInfo) : {}
    const depositAmount = parseFloat(pageParams.value.depositAmount || '0')
    
    if (!userInfo.name || !depositAmount) {
      uni.showToast({
        title: '参数错误，请重新操作',
        icon: 'none'
      })
      return
    }

    // 创建开户支付订单
    const res = await createAccountOpenOrderAPI({
      payment_type: selectedMethod.value,
      deposit_amount: depositAmount,
      user_info: userInfo
    })

    if (res.status === 'success' && res.data) {
      orderInfo.value = res.data
      
      // 统一处理支付方式，不区分平台
      await handleUnifiedPayment(res.data)
    } else {
      uni.showToast({
        title: res.message || '创建订单失败',
        icon: 'none'
      })
    }
  } catch (error) {
    console.error('支付处理失败:', error)
    uni.showToast({
      title: '支付处理失败，请重试',
      icon: 'none'
    })
  } finally {
    isProcessing.value = false
  }
}

// 统一支付处理方式
const handleUnifiedPayment = async (orderData: IAccountOpenOrder) => {
  try {
    // 解析支付信息
    const payInfo = JSON.parse(orderData.pay_info || '{}')
    
    // 如果有支付链接，直接跳转
    if (payInfo.pay_url) {
      // #ifdef APP-PLUS
      // APP端使用系统浏览器打开支付链接
      plus.runtime.openURL(payInfo.pay_url)
      // #endif
      
      // #ifdef H5
      // H5端直接跳转
      window.location.href = payInfo.pay_url
      // #endif
      
      // #ifdef MP-WEIXIN || MP-ALIPAY
      // 小程序端复制链接提示用户
      uni.setClipboardData({
        data: payInfo.pay_url,
        success: () => {
          uni.showToast({
            title: '链接已复制，请在浏览器中打开',
            icon: 'none',
            duration: 3000
          })
        }
      })
      // #endif
      
      // 开始检查支付状态
      startPaymentCheck()
    } 
    // 如果有二维码，显示二维码
    else if (payInfo.qr_code) {
      paymentQRCode.value = payInfo.qr_code
      showQRCode.value = true
      startPaymentCheck()
    }
    // 如果是回调URL方式
    else if (payInfo.callback_url) {
      // #ifdef APP-PLUS
      // APP端使用内置浏览器
      uni.navigateTo({
        url: `/pages/webview/index?url=${encodeURIComponent(payInfo.callback_url)}`
      })
      // #endif
      
      // #ifdef H5
      window.location.href = payInfo.callback_url
      // #endif
      
      // #ifdef MP-WEIXIN || MP-ALIPAY
      // 小程序端显示提示
      uni.showModal({
        title: '支付提示',
        content: '请复制链接到浏览器中完成支付',
        confirmText: '复制链接',
        success: (res) => {
          if (res.confirm) {
            uni.setClipboardData({
              data: payInfo.callback_url,
              success: () => {
                uni.showToast({
                  title: '链接已复制',
                  icon: 'success'
                })
              }
            })
          }
        }
      })
      // #endif
      
      startPaymentCheck()
    }
    else {
      uni.showToast({
        title: '支付信息格式错误',
        icon: 'none'
      })
    }
  } catch (e) {
    console.error('处理支付信息失败:', e)
    uni.showToast({
      title: '支付信息解析失败',
      icon: 'none'
    })
  }
}

// 开始支付状态检查
const startPaymentCheck = () => {
  if (checkTimer.value) {
    clearInterval(checkTimer.value)
  }
  
  checkTimer.value = setInterval(() => {
    checkPaymentStatus()
  }, 3000) // 每3秒检查一次
}

// 检查支付状态
const checkPaymentStatus = async () => {
  if (!orderInfo.value.order_id) return
  
  try {
    const res = await queryAccountOpenOrderAPI(orderInfo.value.order_id)
    
    if (res.status === 'success' && res.data) {
      if (res.data.status === 'completed' && res.data.payment_status === 'paid') {
        // 支付成功
        stopPaymentCheck()
        closeQRCode()
        
        uni.showToast({
          title: '支付成功！',
          icon: 'success'
        })
        
        // 刷新用户信息
        await userStore.fetchUserInfo()
        
        // 延迟跳转
        setTimeout(() => {
          uni.reLaunch({
            url: '/pages/my/index'
          })
        }, 2000)
      }
    }
  } catch (error) {
    console.error('检查支付状态失败:', error)
  }
}

// 停止支付状态检查
const stopPaymentCheck = () => {
  if (checkTimer.value) {
    clearInterval(checkTimer.value)
    checkTimer.value = null
  }
}

// 关闭二维码弹窗
const closeQRCode = () => {
  showQRCode.value = false
  stopPaymentCheck()
}

// 页面卸载时清理定时器
onUnmounted(() => {
  stopPaymentCheck()
})
</script>

<style lang="scss" scoped>
.payment-container {
  min-height: 100vh;
  background-color: #f5f5f5;
  padding: 30rpx;
}

.payment-card {
  background-color: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.payment-header {
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 20rpx;
  margin-bottom: 20rpx;
}

.payment-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
  display: block;
  margin-bottom: 20rpx;
}

.payment-amount {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.amount-label {
  font-size: 28rpx;
  color: #666;
}

.amount-value {
  font-size: 36rpx;
  font-weight: 600;
  color: #ff4d4f;
}

.payment-details {
  .detail-item {
    display: flex;
    justify-content: space-between;
    margin-bottom: 15rpx;
    
    &:last-child {
      margin-bottom: 0;
    }
  }
  
  .detail-label {
    font-size: 26rpx;
    color: #666;
  }
  
  .detail-value {
    font-size: 26rpx;
    color: #333;
  }
}

.payment-methods {
  background-color: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.method-title {
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 20rpx;
}

.method-list {
  .method-item {
    display: flex;
    align-items: center;
    padding: 20rpx 0;
    border-bottom: 1px solid #f0f0f0;
    
    &:last-child {
      border-bottom: none;
    }
    
    &.active {
      .method-name {
        color: #1890ff;
      }
    }
  }
  
  .method-icon {
    width: 60rpx;
    height: 60rpx;
    border-radius: 12rpx;
    display: flex;
    align-items: center;
    justify-content: center;
    margin-right: 20rpx;
    
    &.alipay-icon {
      background-color: #1677ff;
      color: white;
    }
    
    &.wechat-icon {
      background-color: #07c160;
      color: white;
    }
    
    .iconfont {
      font-size: 36rpx;
    }
  }
  
  .method-name {
    flex: 1;
    font-size: 28rpx;
    color: #333;
  }
  
  .method-radio {
    width: 40rpx;
    height: 40rpx;
    border: 2rpx solid #d9d9d9;
    border-radius: 50%;
    display: flex;
    align-items: center;
    justify-content: center;
    
    .radio-dot {
      width: 20rpx;
      height: 20rpx;
      background-color: #1890ff;
      border-radius: 50%;
    }
  }
}

.payment-footer {
  position: fixed;
  bottom: 0;
  left: 0;
  right: 0;
  padding: 30rpx;
  background-color: white;
  border-top: 1px solid #f0f0f0;
}

.pay-button {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(135deg, #1890ff, #096dd9);
  color: white;
  border: none;
  border-radius: 45rpx;
  font-size: 32rpx;
  font-weight: 600;
  
  &:disabled {
    background: #d9d9d9;
    color: #999;
  }
}

// 二维码弹窗样式
.qrcode-popup {
  width: 600rpx;
  background-color: white;
  border-radius: 20rpx;
  overflow: hidden;
}

.qrcode-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1px solid #f0f0f0;
}

.qrcode-title {
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.qrcode-close {
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: #999;
  font-size: 36rpx;
}

.qrcode-content {
  padding: 40rpx;
  text-align: center;
}

.qrcode-wrapper {
  width: 400rpx;
  height: 400rpx;
  margin: 0 auto 30rpx;
  border: 1px solid #f0f0f0;
  border-radius: 12rpx;
  overflow: hidden;
}

.qrcode-image {
  width: 100%;
  height: 100%;
}

.qrcode-tip {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.qrcode-amount {
  display: block;
  font-size: 32rpx;
  font-weight: 600;
  color: #ff4d4f;
}

.qrcode-footer {
  padding: 30rpx;
  border-top: 1px solid #f0f0f0;
}

.check-button {
  width: 100%;
  height: 80rpx;
  background-color: #1890ff;
  color: white;
  border: none;
  border-radius: 40rpx;
  font-size: 28rpx;
}
</style> 