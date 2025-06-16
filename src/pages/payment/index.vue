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
            <view class="method-icon">
              <image
                src="@/static/images/alipay.png"
                class="payment-icon-img"
                mode="aspectFit"
              ></image>
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
            <view class="method-icon" style="width: 62rpx; height: 62rpx">
              <image
                src="@/static/images/wechat-pay.png"
                class="payment-icon-img"
                mode="aspectFit"
              ></image>
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
        <button class="pay-button" :disabled="!selectedMethod || isProcessing" @click="handlePayment">
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
  import { onLoad, onShow } from '@dcloudio/uni-app'
  import {
    createAccountOpenOrderAPI,
    queryAccountOpenOrderAPI,
    type IAccountOpenOrder,
    type IAccountOpenOrderStatus,
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
  
    // 设置预存金额和总金额，以便在页面加载时就能显示
    if (options.depositAmount) {
      const amount = parseFloat(options.depositAmount)
      orderInfo.value.deposit_amount = amount
      orderInfo.value.total_amount = amount // 总金额等于预存金额
    }
  })
  
  // 每次页面显示时检查支付状态
  onShow(() => {
    // 如果有订单ID，检查支付状态
    if (orderInfo.value.order_id) {
      checkPaymentStatus()
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
        icon: 'none',
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
          icon: 'none',
        })
        return
      }
  
      // 创建开户支付订单
      const res = await createAccountOpenOrderAPI({
        payment_type: selectedMethod.value,
        deposit_amount: depositAmount,
        user_info: userInfo,
      })
  
      if (res.status === 'success' && res.data) {
        // 将返回的订单数据赋值给orderInfo
        const orderData = res.data as unknown as IAccountOpenOrder
        orderInfo.value = orderData
  
        // 统一处理支付方式，不区分平台
        await handleUnifiedPayment(orderData)
      } else {
        uni.showToast({
          title: res.message || '创建订单失败',
          icon: 'none',
        })
      }
    } catch (error) {
      console.error('支付处理失败:', error)
      uni.showToast({
        title: '支付处理失败，请重试',
        icon: 'none',
      })
    } finally {
      isProcessing.value = false
    }
  }
  
  // 统一支付处理方式
  const handleUnifiedPayment = async (orderData: IAccountOpenOrder) => {
    try {
      // 定义支付信息接口
      interface PayInfo {
        pay_url?: string;
        qr_code?: string;
        callback_url?: string;
        [key: string]: any;
      }
      
      // 安全解析支付信息
      let payInfo: PayInfo = {}
      if (orderData.pay_info) {
        try {
          payInfo = JSON.parse(orderData.pay_info) as PayInfo
        } catch (e) {
          console.error('支付信息解析失败:', e)
          // 如果解析失败，使用空对象继续后续逻辑
        }
      }
  
      // 记录调试日志
      console.log('支付信息:', { orderData, payInfo })
  
      // 根据支付信息处理不同的支付方式
      if (payInfo && typeof payInfo === 'object') {
        // 如果是微信支付，跳转到WebView页面
        if (selectedMethod.value === 'wxpay') {
          let payUrl = ''
          
          // 优先使用pay_url字段
          if (payInfo.pay_url) {
            payUrl = payInfo.pay_url
          } 
          // 如果没有pay_url但有其他URL字段，尝试使用
          else if (payInfo.url) {
            payUrl = payInfo.url
          }
          // 直接使用pay_info作为URL（如果是字符串形式）
          else if (typeof orderData.pay_info === 'string' && orderData.pay_info.includes('http')) {
            payUrl = orderData.pay_info
          }
          
          // 如果找到了支付URL，跳转到WebView页面
          if (payUrl) {
            // #ifdef APP-PLUS
            // APP端使用内置WebView
            uni.navigateTo({
              url: `/pages/webview/index?url=${encodeURIComponent(payUrl)}&orderId=${orderInfo.value.order_id}`,
            })
            // #endif
  
            // #ifdef H5
            // H5端使用新窗口打开
            window.open(payUrl, '_blank')
            // #endif
  
            // #ifdef MP-WEIXIN
            // 微信小程序使用内置WebView（如果支持）或复制链接
            uni.navigateTo({
              url: `/pages/webview/index?url=${encodeURIComponent(payUrl)}&orderId=${orderInfo.value.order_id}`,
              fail: () => {
                // 如果WebView导航失败，复制链接
                uni.setClipboardData({
                  data: payUrl,
                  success: () => {
                    uni.showModal({
                      title: '打开微信支付',
                      content: '链接已复制，请在浏览器中打开完成支付',
                      showCancel: false
                    })
                  }
                })
              }
            })
            // #endif
  
            // 开始检查支付状态
            startPaymentCheck()
            return // 提前返回，不执行后续逻辑
          }
        }
        
        // 处理其他支付方式或备用逻辑（当微信支付没有URL时）
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
                duration: 3000,
              })
            },
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
            url: `/pages/webview/index?url=${encodeURIComponent(payInfo.callback_url)}&orderId=${orderInfo.value.order_id}`,
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
                  data: payInfo.callback_url!,
                  success: () => {
                    uni.showToast({
                      title: '链接已复制',
                      icon: 'success',
                    })
                  },
                })
              }
            },
          })
          // #endif
  
          startPaymentCheck()
        } else {
          // 未识别的支付方式，显示交易号
          uni.showModal({
            title: '支付提示',
            content: `请记录您的订单号: ${orderData.transaction_no || orderData.order_id}，并联系客服完成支付`,
            showCancel: false
          })
        }
      } else {
        // payInfo不是对象或为空的处理
        uni.showModal({
          title: '支付提示',
          content: `您的订单已创建 (订单号: ${orderData.transaction_no || orderData.order_id})，请保存订单号并联系客服进行支付`,
          showCancel: false
        })
      }
    } catch (e) {
      console.error('处理支付信息失败:', e)
      uni.showToast({
        title: '支付信息处理失败，请联系客服',
        icon: 'none',
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
    if (!orderInfo.value.order_id) {
      console.log('缺少订单ID，无法检查支付状态')
      return
    }
  
    try {
      // 记录调试日志
      console.log('正在检查订单状态:', orderInfo.value.order_id)
      
      const res = await queryAccountOpenOrderAPI(orderInfo.value.order_id)
  
      // 记录返回结果
      console.log('订单状态查询结果:', res)
  
      if (res.status === 'success' && res.data) {
        // 检查订单状态
        if (res.data.status === 'completed') {
          // 支付成功
          stopPaymentCheck()
          closeQRCode()
  
          uni.showToast({
            title: '支付成功！',
            icon: 'success',
          })
  
          // 刷新用户信息
          await userStore.fetchUserInfo()
  
          // 延迟跳转
          setTimeout(() => {
            uni.reLaunch({
              url: '/pages/my/index',
            })
          }, 2000)
        } else if (res.data.status === 'failed') {
          // 支付失败
          stopPaymentCheck()
          uni.showModal({
            title: '支付失败',
            content: '很抱歉，您的支付未能完成，请稍后重试或联系客服',
            showCancel: false
          })
        }
        // 其他状态继续等待
      } else {
        console.log('查询响应格式不正确:', res)
      }
    } catch (error) {
      console.error('检查支付状态失败:', error)
      // 查询失败不停止检查，继续等待下次检查
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
    padding: 30rpx;
    background-color: #f5f5f5;
  }
  
  .payment-card {
    padding: 30rpx;
    margin-bottom: 30rpx;
    background-color: white;
    border-radius: 20rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  }
  
  .payment-header {
    padding-bottom: 20rpx;
    margin-bottom: 20rpx;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .payment-title {
    display: block;
    margin-bottom: 20rpx;
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
  }
  
  .payment-amount {
    display: flex;
    align-items: center;
    justify-content: space-between;
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
    padding: 30rpx;
    margin-bottom: 30rpx;
    background-color: white;
    border-radius: 20rpx;
    box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  }
  
  .method-title {
    margin-bottom: 20rpx;
    font-size: 30rpx;
    font-weight: 600;
    color: #333;
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
    }
  
    .method-name {
      flex: 1;
      margin-left: 20rpx;
      font-size: 28rpx;
      color: #333;
    }
  
    .method-item.active {
      .method-name {
        color: #1890ff;
      }
    }
  
    .method-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 60rpx;
      height: 60rpx;
      overflow: hidden;
      border-radius: 12rpx;
    }
  
    .payment-icon-img {
      width: 100%;
      height: 100%;
      object-fit: contain;
    }
  
    .method-radio {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 40rpx;
      height: 40rpx;
      border: 2rpx solid #d9d9d9;
      border-radius: 50%;
  
      .radio-dot {
        width: 24rpx;
        height: 24rpx;
        background-color: #1890ff;
        border-radius: 50%;
      }
    }
  }
  
  .payment-footer {
    position: fixed;
    right: 0;
    bottom: 0;
    left: 0;
    padding: 30rpx;
    background-color: white;
    border-top: 1px solid #f0f0f0;
  }
  
  .pay-button {
    width: 100%;
    height: 90rpx;
    font-size: 32rpx;
    font-weight: 600;
    color: white;
    background: linear-gradient(135deg, #1890ff, #096dd9);
    border: none;
    border-radius: 45rpx;
  
    &:disabled {
      background: #d9d9d9;
    }
  }
  
  // 二维码弹窗
  .qrcode-popup {
    width: 600rpx;
    overflow: hidden;
    background-color: white;
    border-radius: 20rpx;
  }
  
  .qrcode-header {
    display: flex;
    align-items: center;
    justify-content: space-between;
    padding: 30rpx;
    border-bottom: 1px solid #f0f0f0;
  }
  
  .qrcode-title {
    font-size: 32rpx;
    font-weight: 600;
    color: #333;
  }
  
  .qrcode-close {
    display: flex;
    align-items: center;
    justify-content: center;
    width: 60rpx;
    height: 60rpx;
    color: #999;
  }
  
  .qrcode-content {
    padding: 30rpx;
    text-align: center;
  }
  
  .qrcode-wrapper {
    width: 400rpx;
    height: 400rpx;
    margin: 0 auto 30rpx;
    overflow: hidden;
    border: 1px solid #f0f0f0;
    border-radius: 12rpx;
  }
  
  .qrcode-image {
    width: 100%;
    height: 100%;
  }
  
  .qrcode-tip {
    display: block;
    margin-bottom: 10rpx;
    font-size: 28rpx;
    color: #666;
  }
  
  .qrcode-amount {
    display: block;
    font-size: 30rpx;
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
    font-size: 28rpx;
    color: white;
    background-color: #1890ff;
    border: none;
    border-radius: 40rpx;
  }
  </style>
  