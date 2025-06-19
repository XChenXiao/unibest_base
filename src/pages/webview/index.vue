<route lang="json5">
  {
    style: {
      navigationBarTitleText: '微信支付',
      navigationBarBackgroundColor: '#07C160',
      navigationBarTextStyle: 'white'
    },
  }
  </route>
  
  <template>
    <view class="webview-container">
      <!-- #ifdef APP-PLUS -->
      <web-view :src="webviewUrl" @message="handleMessage"></web-view>
      <!-- #endif -->
      
      <!-- #ifdef H5 -->
      <view class="fallback-message">
        <image src="/static/images/loading.gif" class="loading-icon" mode="aspectFit"></image>
        <text>正在跳转到微信支付，请稍候...</text>
      </view>
      <!-- #endif -->
      
      <!-- #ifdef MP-WEIXIN -->
      <web-view :src="webviewUrl" @message="handleMessage"></web-view>
      <!-- #endif -->
      
      <!-- 支付状态提示 -->
      <wd-popup v-model="showStatusTip" position="center" :close-on-click-overlay="false" v-if="paymentStatus">
        <view class="payment-status-popup">
          <view class="status-icon" :class="paymentStatus">
            <text class="iconfont" :class="paymentStatus === 'success' ? 'icon-success' : 'icon-close'"></text>
          </view>
          <text class="status-title">{{ paymentStatus === 'success' ? '支付成功' : '支付失败' }}</text>
          <text class="status-desc">{{ paymentStatus === 'success' ? '您的开户支付已完成' : '请重新尝试或联系客服' }}</text>
          <button class="status-button" @click="handleStatusClose">{{ paymentStatus === 'success' ? '完成' : '返回' }}</button>
        </view>
      </wd-popup>
    </view>
  </template>
  
  <script lang="ts" setup>
  import { ref, onMounted, onUnmounted } from 'vue'
  import { onLoad } from '@dcloudio/uni-app'
  import { queryAccountOpenOrderAPI } from '@/service/index/account'
  
  const webviewUrl = ref('')
  const orderId = ref('')
  const checkTimer = ref<number | null>(null)
  const paymentStatus = ref<'success' | 'fail' | ''>('')
  const showStatusTip = ref(false)
  
  onLoad((options) => {
    if (options.url) {
      webviewUrl.value = decodeURIComponent(options.url)
      
      // #ifdef H5
      // H5端直接跳转到目标URL
      setTimeout(() => {
        window.location.href = webviewUrl.value
      }, 1000)
      // #endif
    } else {
      uni.showToast({
        title: '参数错误',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 2000)
    }
    
    // 获取订单ID
    if (options.orderId) {
      orderId.value = options.orderId
      // 开始检查支付状态
      startPaymentCheck()
    }
  })
  
  // 处理webview消息
  const handleMessage = (event: any) => {
    console.log('webview消息:', event)
    // 微信支付可能会通过message返回支付结果
    try {
      const message = event.detail
      if (message && message.data && typeof message.data === 'string') {
        // 尝试解析消息数据
        const data = JSON.parse(message.data)
        if (data.type === 'wechatpay' && data.status) {
          // 根据支付结果处理
          if (data.status === 'success') {
            showPaymentSuccess()
          } else if (data.status === 'fail') {
            showPaymentFail()
          }
        }
      }
    } catch (e) {
      console.error('处理webview消息失败', e)
    }
  }
  
  // 开始支付状态检查
  const startPaymentCheck = () => {
    if (!orderId.value) return
    
    // 清除可能存在的定时器
    if (checkTimer.value) {
      clearInterval(checkTimer.value)
    }
    
    // 设置新的定时器，每3秒检查一次
    checkTimer.value = setInterval(() => {
      checkPaymentStatus()
    }, 3000)
  }
  
  // 检查支付状态
  const checkPaymentStatus = async () => {
    if (!orderId.value) return
    
    try {
      const res = await queryAccountOpenOrderAPI(orderId.value)
      console.log('支付状态查询结果:', res)
      
      if (res.status === 'success' && res.data) {
        if (res.data.status === 'completed') {
          showPaymentSuccess()
        } else if (res.data.status === 'failed') {
          showPaymentFail()
        }
      }
    } catch (error) {
      console.error('查询支付状态失败:', error)
    }
  }
  
  // 显示支付成功
  const showPaymentSuccess = () => {
    stopPaymentCheck()
    paymentStatus.value = 'success'
    showStatusTip.value = true
  }
  
  // 显示支付失败
  const showPaymentFail = () => {
    stopPaymentCheck()
    paymentStatus.value = 'fail'
    showStatusTip.value = true
  }
  
  // 停止支付状态检查
  const stopPaymentCheck = () => {
    if (checkTimer.value) {
      clearInterval(checkTimer.value)
      checkTimer.value = null
    }
  }
  
  // 处理状态弹窗关闭
  const handleStatusClose = () => {
    showStatusTip.value = false
    
    if (paymentStatus.value === 'success') {
      // 支付成功，跳转到个人中心
      uni.reLaunch({
        url: '/pages/my/index'
      })
    } else {
      // 支付失败，返回上一页
      uni.navigateBack()
    }
  }
  
  // 页面卸载时清理定时器
  onUnmounted(() => {
    stopPaymentCheck()
  })
  </script>
  
  <style lang="scss" scoped>
  .webview-container {
    width: 100%;
    height: 100vh;
  }
  
  .fallback-message {
    display: flex;
    flex-direction: column;
    align-items: center;
    justify-content: center;
    height: 100vh;
    font-size: 32rpx;
    color: #666;
    
    .loading-icon {
      width: 100rpx;
      height: 100rpx;
      margin-bottom: 20rpx;
    }
  }
  
  .payment-status-popup {
    width: 560rpx;
    padding: 40rpx;
    border-radius: 20rpx;
    background-color: #fff;
    display: flex;
    flex-direction: column;
    align-items: center;
    
    .status-icon {
      width: 120rpx;
      height: 120rpx;
      border-radius: 60rpx;
      display: flex;
      align-items: center;
      justify-content: center;
      margin-bottom: 30rpx;
      
      &.success {
        background-color: #07C160;
        color: white;
      }
      
      &.fail {
        background-color: #FA5151;
        color: white;
      }
      
      .iconfont {
        font-size: 60rpx;
      }
    }
    
    .status-title {
      font-size: 36rpx;
      font-weight: 600;
      margin-bottom: 20rpx;
    }
    
    .status-desc {
      font-size: 28rpx;
      color: #666;
      margin-bottom: 40rpx;
    }
    
    .status-button {
      width: 70%;
      height: 80rpx;
      line-height: 80rpx;
      border-radius: 40rpx;
      font-size: 30rpx;
      color: white;
      background-color: #07C160;
    }
  }
  </style> 