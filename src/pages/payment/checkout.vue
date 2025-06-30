<route lang="json5" type="page">
{
  style: {
    navigationBarTitleText: '支付结算',
    navigationBarBackgroundColor: '#f5f5f5',
    navigationBarTextStyle: 'black',
    'app-plus': {
      titleNView: {
        titleSize: '16px',
        titleWeight: 'bold',
        titleAlign: 'center',
      },
    },
  },
}
</route>

<template>
  <view class="container">
    <!-- 顶部支付图片 -->
    <view class="header-image-container">
      <image class="header-image" src="/static/images/bg/payment.png" mode="widthFix"></image>
    </view>

    <!-- 结算表单 -->
    <view class="form-container" v-if="currentStep === 'form'">
      <view class="form-header">
        <view class="form-title">{{ pageTitle }}</view>
        <view class="form-subtitle">请确认订单信息并完成支付</view>
      </view>

      <view class="order-info">
        <view class="order-title">订单信息</view>
        
        <view class="order-item">
          <text class="item-label">商品名称</text>
          <text class="item-value">{{ orderInfo.productName }}</text>
        </view>
        
        <view class="order-item">
          <text class="item-label">订单编号</text>
          <text class="item-value">{{ orderInfo.orderNo }}</text>
        </view>
        
        <view class="order-item">
          <text class="item-label">创建时间</text>
          <text class="item-value">{{ orderInfo.createTime }}</text>
        </view>
      </view>

      <view class="fee-info">
        <view class="fee-label">
          支付金额
          <text class="required-mark">*</text>
        </view>
        <view class="amount-input-container">
          <view class="amount-input-wrapper">
            <text class="amount-prefix">¥</text>
            <view class="amount-display">{{ orderInfo.amount || '0.00' }}</view>
          </view>
        </view>

        <!-- 支付提示 -->
        <view class="payment-tip">
          <text class="tip-title">温馨提示</text>

          <!-- 支付提示列表 -->
          <view class="payment-tips-list">
            <view class="payment-tip-item">
              <text class="tip-dot">•</text>
              <text class="tip-desc">请在下单后30分钟内完成支付，否则订单将自动取消</text>
            </view>
            <view class="payment-tip-item">
              <text class="tip-dot">•</text>
              <text class="tip-desc">支付成功后，系统将自动为您处理订单</text>
            </view>
            <view class="payment-tip-item">
              <text class="tip-dot">•</text>
              <text class="tip-desc">如有疑问，请联系客服处理</text>
            </view>
          </view>
        </view>
      </view>

      <view class="payment-methods">
        <view class="method-title">选择支付方式</view>
        
        <view class="method-list">
          <view
            class="method-item"
            :class="{ 'method-item-active': paymentMethod === 'alipay' }"
            @click="selectPaymentMethod('alipay')"
          >
            <view class="method-icon">
              <image src="/static/images/alipay.png" class="method-icon-img" mode="aspectFit"></image>
            </view>
            <text class="method-name">支付宝</text>
            <view class="method-radio">
              <view class="radio-dot" v-if="paymentMethod === 'alipay'"></view>
            </view>
          </view>
          
          <view
            class="method-item"
            :class="{ 'method-item-active': paymentMethod === 'wxpay' }"
            @click="selectPaymentMethod('wxpay')"
          >
            <view class="method-icon">
              <image src="/static/images/wechat-pay.png" class="method-icon-img" mode="aspectFit"></image>
            </view>
            <text class="method-name">微信支付</text>
            <view class="method-radio">
              <view class="radio-dot" v-if="paymentMethod === 'wxpay'"></view>
            </view>
          </view>
        </view>
      </view>

      <button
        class="confirm-payment-btn"
        @click="processPayment"
        :disabled="loading || !paymentMethod"
      >
        {{ loading ? '处理中...' : '立即支付' }}
      </button>
      <!-- <view class="submit-hint">确认后将跳转到相应的支付平台</view> -->
    </view>

    <!-- 支付处理状态 -->
    <view class="payment-status-container" v-if="currentStep === 'processing'">
      <view class="status-icon">
        <text class="iconfont icon-loading loading-icon"></text>
      </view>
      <view class="status-title">支付处理中</view>
      <view class="status-desc">
        系统正在处理您的支付请求，请稍候...
        <text class="status-time">订单号：{{ orderInfo.orderNo }}</text>
      </view>
      <view class="status-tips">
        <view class="tip-item">
          <text class="tip-dot"></text>
          <text class="tip-text">如果您已完成支付，请点击下方按钮查询支付结果</text>
        </view>
        <view class="tip-item">
          <text class="tip-dot"></text>
          <text class="tip-text">如果长时间未收到支付结果，请联系客服处理</text>
        </view>
      </view>
      <button class="btn-check" @click="checkPaymentStatus">查询支付结果</button>
      <button class="btn-back" @click="backToForm">返回修改</button>
    </view>

    <!-- 支付成功状态 -->
    <view class="success-container" v-if="currentStep === 'success'">
      <view class="success-icon">
        <text class="iconfont icon-success"></text>
      </view>
      <view class="success-title">支付成功</view>
      <view class="success-desc">
        您的订单支付已完成，我们将尽快为您处理。
        <text class="success-time">订单号：{{ orderInfo.orderNo }}</text>
      </view>
      <view class="success-tips">
        <view class="tip-item">
          <text class="tip-dot"></text>
          <text class="tip-text">您可以在"订单管理"中查看订单处理进度</text>
        </view>
        <view class="tip-item">
          <text class="tip-dot"></text>
          <text class="tip-text">如有问题，请联系客服处理</text>
        </view>
      </view>
      <button class="btn-back" @click="backToOrders">返回订单列表</button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, computed, onUnmounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { useUserStore } from '@/store'
import { rechargeAPI, queryRechargeOrderAPI, IRechargeResponse, IRechargeOrderStatus } from '@/service/index/balance'

// 用户数据
const userStore = useUserStore()

// 页面参数
const pageParams = ref<{
  orderNo?: string;
  productId?: string;
  amount?: string;
  type?: string; // 支付类型：recharge-充值, order-订单支付
}>({})

// 申请步骤：form-表单填写，success-支付成功
const currentStep = ref('form')

// 加载状态
const loading = ref(false)

// 选择的支付方式
const paymentMethod = ref('')

// 定时器ID
const checkTimerId = ref<number | null>(null)

// 订单信息
const orderInfo = reactive({
  orderNo: '',
  productName: '商品名称',
  amount: '0.00',
  createTime: formatDate(new Date()),
})

// 计算页面标题
const pageTitle = computed(() => {
  if (pageParams.value.type === 'recharge') {
    return '账户充值'
  } else {
    return '支付结算'
  }
})

// 格式化日期
function formatDate(date: Date): string {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  const hours = String(date.getHours()).padStart(2, '0')
  const minutes = String(date.getMinutes()).padStart(2, '0')
  const seconds = String(date.getSeconds()).padStart(2, '0')
  return `${year}-${month}-${day} ${hours}:${minutes}:${seconds}`
}

// 选择支付方式
const selectPaymentMethod = (method: string) => {
  paymentMethod.value = method
}

// 页面加载时获取参数
onLoad((options) => {
  pageParams.value = options as any
  
  // 如果有传递的订单号，获取订单信息
  if (options.orderNo) {
    orderInfo.orderNo = options.orderNo
    fetchOrderInfo(options.orderNo, options.type)
  }
  
  // 如果有传递的金额，直接设置
  if (options.amount) {
    orderInfo.amount = options.amount
  }
  
  // 根据支付类型设置商品名称
  if (options.type === 'recharge') {
    orderInfo.productName = '账户充值'
  } else {
    orderInfo.productName = '商品支付'
  }
})

// 每次页面显示时检查状态
onShow(async () => {
  // 刷新用户信息
  await userStore.fetchUserInfo()
})

// 获取订单信息
const fetchOrderInfo = async (orderNo: string, type?: string) => {
  try {
    loading.value = true
    
    if (type === 'recharge' && orderNo) {
      // 如果是充值订单且有订单号，调用查询充值订单API
      const res = await queryRechargeOrderAPI(orderNo)
      if (res.status === 'success' && res.data) {
        // 使用类型断言访问数据
        const data = res.data as any
        orderInfo.orderNo = data.order_id || data.out_trade_no || orderNo
        orderInfo.amount = String(data.amount)
        orderInfo.createTime = data.created_at || formatDate(new Date())
        orderInfo.productName = '账户充值'
        
        // 如果订单已支付，更新状态
        if (data.status === 'completed' || data.status === 'paid') {
          currentStep.value = 'success'
        }
      }
    } else if (type === 'recharge') {
      // 如果是充值类型但没有订单号，只设置商品名称和金额
      orderInfo.productName = '账户充值'
      orderInfo.createTime = formatDate(new Date())
      // 金额已在onLoad中设置
    } else {
      // 其他类型订单或默认情况
      // 模拟API调用
      setTimeout(() => {
        // 模拟数据
        orderInfo.productName = type === 'recharge' ? '账户充值' : '测试商品'
        orderInfo.amount = pageParams.value.amount || '100.00'
        orderInfo.createTime = formatDate(new Date())
        loading.value = false
      }, 500)
    }
  } catch (error) {
    console.error('获取订单信息失败:', error)
    uni.showToast({
      title: '获取订单信息失败',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

// 处理支付
const processPayment = async () => {
  if (!paymentMethod.value) {
    uni.showToast({
      title: '请选择支付方式',
      icon: 'none',
    })
    return
  }
  
  try {
    loading.value = true
    
    // 二次确认
    uni.showModal({
      title: '确认支付',
      content: `您确定要使用${paymentMethod.value === 'alipay' ? '支付宝' : '微信支付'}支付 ¥${orderInfo.amount} 元吗？`,
      success: async (res) => {
        if (res.confirm) {
          // 根据不同的支付类型调用不同的API
          if (pageParams.value.type === 'recharge') {
            // 充值支付 - 创建新订单
            await createAndHandleRechargePayment()
          } else {
            // 默认或其他类型的支付
            // 模拟支付过程
            setTimeout(() => {
              // 模拟支付成功
              handlePaymentSuccess()
              loading.value = false
            }, 1500)
          }
        } else {
          loading.value = false
        }
      },
    })
  } catch (error) {
    console.error('支付处理失败:', error)
    uni.showToast({
      title: '支付处理失败，请重试',
      icon: 'none',
    })
    loading.value = false
  }
}

// 创建并处理充值支付
const createAndHandleRechargePayment = async () => {
  try {
    // 显示加载状态
    uni.showLoading({
      title: '创建充值订单...',
    })
    
    // 调用充值API创建订单
    const res = await rechargeAPI({
      amount: parseFloat(orderInfo.amount),
      payment_type: paymentMethod.value as 'alipay' | 'wxpay',
    })
    
    uni.hideLoading()
    
    if (res.status === 'success' && res.data) {
      // 使用类型断言
      const rechargeData = res.data as any
      
      // 更新订单信息
      orderInfo.orderNo = rechargeData.out_trade_no || rechargeData.order_id || ''
      
      // 如果有支付信息，处理支付
      if (rechargeData && typeof rechargeData === 'object' && 'pay_info' in rechargeData) {
        try {
          // 定义支付信息接口
          interface PayInfo {
            pay_url?: string
            qr_code?: string
            callback_url?: string
            [key: string]: any
          }

          // 初始化支付信息对象
          const payInfo: PayInfo = {}

          // 直接处理pay_info为URL字符串的情况
          if (rechargeData.pay_info && typeof rechargeData.pay_info === 'string') {
            // 检查是否是URL字符串
            if (rechargeData.pay_info.includes('http')) {
              console.log('支付信息是URL字符串，直接使用')
              payInfo.pay_url = rechargeData.pay_info
            }
          }

          // 记录最终使用的支付URL
          console.log('支付URL:', payInfo.pay_url)

          // 如果有支付URL，统一处理支付跳转
          if (payInfo.pay_url) {
            // 切换到处理状态页面
            currentStep.value = 'processing'
            
            // 开始定时检查支付状态
            const orderNo = rechargeData.order_id || rechargeData.out_trade_no || orderInfo.orderNo
            if (orderNo) {
              startCheckPaymentStatus(orderNo)
            }
            
            // 支付宝支付，直接通过浏览器打开支付链接
            // #ifdef H5
            window.open(payInfo.pay_url, '_blank')
            return // 阻止后续代码执行
            // #endif
            
            // #ifdef APP-PLUS
            plus.runtime.openURL(payInfo.pay_url)
            return // 阻止后续代码执行
            // #endif
          } else {
            uni.showToast({
              title: '未获取到有效的支付链接',
              icon: 'none'
            })
          }
        } catch (error) {
          console.error('处理支付信息失败:', error)
          uni.showToast({
            title: '支付信息处理失败',
            icon: 'none'
          })
        }
      } else {
        uni.showToast({
          title: '未获取到支付信息',
          icon: 'none'
        })
      }
    } else {
      uni.showToast({
        title: res.message || '创建支付订单失败',
        icon: 'none'
      })
    }
  } catch (error) {
    uni.hideLoading()
    console.error('处理充值支付失败:', error)
    uni.showToast({
      title: '支付处理失败，请重试',
      icon: 'none'
    })
  } finally {
    loading.value = false
  }
}

// 开始检查支付状态
const startCheckPaymentStatus = (orderNo: string) => {
  // 设置定时器，每3秒检查一次支付状态
  const timer = setInterval(async () => {
    try {
      console.log('正在查询订单状态:', orderNo)
      const res = await queryRechargeOrderAPI(orderNo)
      console.log('订单状态查询结果:', res)
      
      if (res.status === 'success' && res.data) {
        // 使用类型断言
        const data = res.data as any
        
        // 如果支付成功，停止检查并更新状态
        if (data.status === 'completed' || data.status === 'paid') {
          clearInterval(timer)
          handlePaymentSuccess()
          
          // 显示支付成功信息
          uni.showToast({
            title: '支付已完成',
            icon: 'success',
            duration: 2000
          })
          
          console.log('支付已完成，订单状态:', data.status)
        } else {
          // 显示当前订单状态
          console.log('当前订单状态:', data.status)
          
          // 如果仍在处理中，显示提示
          if (data.status === 'pending') {
            uni.showToast({
              title: '订单处理中，请稍候...',
              icon: 'none',
              duration: 1500
            })
          }
        }
      }
    } catch (error) {
      console.error('检查支付状态失败:', error)
    }
  }, 3000)
  
  // 保存定时器ID，以便在组件销毁时清除
  checkTimerId.value = timer
  
  // 120秒后自动停止检查（增加到120秒，原来是60秒）
  setTimeout(() => {
    if (checkTimerId.value) {
      clearInterval(checkTimerId.value)
      checkTimerId.value = null
      
      // 显示提示信息
      uni.showModal({
        title: '订单查询超时',
        content: '支付状态查询超时，如果您已完成支付，请稍后在订单记录中查看结果或点击"查询支付结果"按钮手动查询',
        showCancel: false
      })
    }
  }, 120000) // 增加到120秒
}

// 手动查询支付状态
const checkPaymentStatus = async () => {
  if (!orderInfo.orderNo) {
    uni.showToast({
      title: '订单号不存在',
      icon: 'none'
    })
    return
  }
  
  try {
    uni.showLoading({
      title: '查询中...'
    })
    
    console.log('手动查询订单状态:', orderInfo.orderNo)
    const res = await queryRechargeOrderAPI(orderInfo.orderNo)
    console.log('订单状态查询结果:', res)
    
    uni.hideLoading()
    
    if (res.status === 'success' && res.data) {
      const data = res.data as any
      
      // 如果支付成功，更新状态
      if (data.status === 'completed' || data.status === 'paid') {
        handlePaymentSuccess()
      } else {
        // 显示当前订单状态
        let statusText = '处理中'
        if (data.status === 'pending') {
          statusText = '等待支付'
        } else if (data.status === 'failed') {
          statusText = '支付失败'
        }
        
        uni.showModal({
          title: '订单状态',
          content: `当前订单状态: ${statusText}，请稍后再试或联系客服`,
          showCancel: false
        })
      }
    } else {
      uni.showToast({
        title: res.message || '查询失败',
        icon: 'none'
      })
    }
  } catch (error) {
    uni.hideLoading()
    console.error('手动查询支付状态失败:', error)
    uni.showToast({
      title: '查询失败，请稍后再试',
      icon: 'none'
    })
  }
}

// 处理支付成功
const handlePaymentSuccess = () => {
  // 更新页面状态为支付成功
  currentStep.value = 'success'
  
  // 显示支付成功提示
  uni.showToast({
    title: '支付成功',
    icon: 'success',
    duration: 2000,
  })
  
  // 刷新用户信息以更新余额
  userStore.fetchUserInfo()
}

// 返回表单页面
const backToForm = () => {
  currentStep.value = 'form'
  
  // 停止检查支付状态
  if (checkTimerId.value) {
    clearInterval(checkTimerId.value)
    checkTimerId.value = null
  }
}

// 返回订单列表
const backToOrders = () => {
  // 根据支付类型决定返回的页面
  if (pageParams.value.type === 'recharge') {
    // 充值支付成功后返回我的钱包页面
    uni.redirectTo({
      url: '/pages/my/wallet'
    })
  } else {
    // 默认返回上一页
    uni.navigateBack({
      delta: 1,
      success: () => {
        // 获取当前页面栈
        const pages = getCurrentPages()
        // 获取上一页
        const prevPage = pages[pages.length - 2]
        if (prevPage) {
          // 直接调用上一页的方法进行刷新
          if (prevPage.$vm.refreshOrders) {
            prevPage.$vm.refreshOrders()
          }
        }
      },
    })
  }
}

// 在组件卸载前清除定时器
onUnmounted(() => {
  if (checkTimerId.value) {
    clearInterval(checkTimerId.value)
    checkTimerId.value = null
  }
})
</script>

<style lang="scss" scoped>
.container {
  box-sizing: border-box;
  min-height: 100vh;
  padding: 30rpx;
  background-color: #f5f5f5;
}

/* 顶部图片样式 */
.header-image-container {
  width: 100vw;
  margin: -30rpx -30rpx 20rpx -30rpx;
  overflow: hidden;
}

.header-image {
  display: block;
  width: 100%;
  height: auto;
}

.form-container {
  box-sizing: border-box;
  width: 100%;
  padding: 30rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
}

.form-header {
  margin-bottom: 30rpx;
}

.form-title {
  margin-bottom: 10rpx;
  font-size: 36rpx;
  font-weight: bold;
}

.form-subtitle {
  font-size: 26rpx;
  color: #6b7280;
}

/* 订单信息样式 */
.order-info {
  padding: 20rpx;
  margin-bottom: 30rpx;
  background-color: #f9fafb;
  border-radius: 12rpx;
}

.order-title {
  margin-bottom: 15rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.order-item {
  display: flex;
  justify-content: space-between;
  margin-bottom: 10rpx;
}

.item-label {
  font-size: 26rpx;
  color: #666;
}

.item-value {
  font-size: 26rpx;
  color: #333;
}

/* 支付金额样式 */
.fee-info {
  padding: 20rpx;
  margin-bottom: 30rpx;
  background-color: #f9fafb;
  border-radius: 12rpx;
}

.fee-label {
  font-size: 26rpx;
  color: #6b7280;
}

.required-mark {
  margin-left: 5rpx;
  color: #e74c3c;
}

.amount-input-container {
  margin-bottom: 20rpx;
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  padding-bottom: 10rpx;
  margin: 10rpx 0;
  border-bottom: 1px solid #e0e0e0;
}

.amount-prefix {
  margin-right: 10rpx;
  font-size: 40rpx;
  color: #333;
}

.amount-display {
  flex: 1;
  height: 80rpx;
  padding-left: 10rpx;
  font-size: 36rpx;
  line-height: 80rpx;
  color: #333;
}

/* 支付提示样式 */
.payment-tip {
  padding: 16rpx;
  margin-top: 16rpx;
  background-color: #fff9f0;
  border-radius: 8rpx;
}

.tip-title {
  display: block;
  margin-bottom: 8rpx;
  font-size: 28rpx;
  font-weight: bold;
  color: #ff9800;
}

.payment-tips-list {
  margin-top: 16rpx;
}

.payment-tip-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8rpx;
}

.tip-dot {
  margin-right: 8rpx;
  font-size: 28rpx;
  line-height: 1.3;
  color: #ff9800;
}

.tip-desc {
  flex: 1;
  font-size: 24rpx;
  line-height: 1.5;
  color: #666;
}

/* 支付方式样式 */
.payment-methods {
  margin-bottom: 30rpx;
}

.method-title {
  margin-bottom: 15rpx;
  font-size: 28rpx;
  color: #333;
}

.method-list {
  background-color: #f9fafb;
  border-radius: 12rpx;
}

.method-item {
  display: flex;
  align-items: center;
  padding: 24rpx 20rpx;
  border-bottom: 1px solid #e0e0e0;
}

.method-item:last-child {
  border-bottom: none;
}

.method-item-active {
  background-color: rgba(59, 130, 246, 0.05);
}

.method-icon {
  width: 60rpx;
  height: 60rpx;
  overflow: hidden;
}

.method-icon-img {
  width: 100%;
  height: 100%;
  object-fit: contain;
}

.method-name {
  flex: 1;
  margin-left: 20rpx;
  font-size: 28rpx;
  color: #333;
}

.method-radio {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 40rpx;
  height: 40rpx;
  border: 2rpx solid #d9d9d9;
  border-radius: 50%;
}

.radio-dot {
  width: 24rpx;
  height: 24rpx;
  background-color: #3b82f6;
  border-radius: 50%;
}

/* 按钮样式 */
.confirm-payment-btn {
  width: 100%;
  height: 90rpx;
  margin-top: 30rpx;
  font-size: 32rpx;
  font-weight: 500;
  color: white;
  background: linear-gradient(to right, #3b82f6, #2563eb);
  border: none;
  border-radius: 45rpx;
}

.confirm-payment-btn:disabled {
  background: linear-gradient(to right, #d4d4d4, #a0a0a0);
  opacity: 0.6;
}

.submit-hint {
  margin-top: 15rpx;
  font-size: 24rpx;
  color: #6b7280;
  text-align: center;
}

/* 支付处理状态样式 */
.payment-status-container {
  box-sizing: border-box;
  width: 100%;
  padding: 40rpx 30rpx;
  text-align: center;
  background-color: #ffffff;
  border-radius: 20rpx;
}

.status-icon {
  margin-bottom: 20rpx;
  font-size: 80rpx;
  color: #3b82f6;
}

.loading-icon {
  display: inline-block;
  animation: rotate 2s linear infinite;
}

@keyframes rotate {
  from {
    transform: rotate(0deg);
  }
  to {
    transform: rotate(360deg);
  }
}

.status-title {
  margin-bottom: 20rpx;
  font-size: 36rpx;
  font-weight: bold;
  color: #111827;
}

.status-desc {
  margin-bottom: 30rpx;
  font-size: 28rpx;
  line-height: 1.6;
  color: #4b5563;
}

.status-time {
  display: block;
  margin-top: 10rpx;
  color: #3b82f6;
}

.status-tips {
  padding: 20rpx;
  margin-bottom: 40rpx;
  text-align: left;
  background-color: #f9fafb;
  border-radius: 12rpx;
}

.btn-check {
  width: 100%;
  padding: 24rpx 0;
  margin-bottom: 20rpx;
  font-size: 30rpx;
  color: white;
  background-color: #3b82f6;
  border: none;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 6rpx rgba(59, 130, 246, 0.3);
}

.btn-back {
  width: 100%;
  padding: 24rpx 0;
  font-size: 30rpx;
  color: #6b7280;
  background-color: #f3f4f6;
  border: none;
  border-radius: 12rpx;
}

/* 支付成功状态样式 */
.success-container {
  box-sizing: border-box;
  width: 100%;
  padding: 40rpx 30rpx;
  text-align: center;
  background-color: #ffffff;
  border-radius: 20rpx;
}

.success-icon {
  margin-bottom: 20rpx;
  font-size: 80rpx;
  color: #10b981;
}

.success-title {
  margin-bottom: 20rpx;
  font-size: 36rpx;
  font-weight: bold;
  color: #111827;
}

.success-desc {
  margin-bottom: 30rpx;
  font-size: 28rpx;
  line-height: 1.6;
  color: #4b5563;
}

.success-time {
  display: block;
  margin-top: 10rpx;
  color: #3b82f6;
}

.success-tips {
  padding: 20rpx;
  margin-bottom: 40rpx;
  text-align: left;
  background-color: #f9fafb;
  border-radius: 12rpx;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15rpx;
}

.tip-item:last-child {
  margin-bottom: 0;
}

.tip-dot {
  width: 12rpx;
  height: 12rpx;
  margin-top: 12rpx;
  margin-right: 15rpx;
  background-color: #3b82f6;
  border-radius: 50%;
}

.tip-text {
  font-size: 26rpx;
  line-height: 1.5;
  color: #6b7280;
}

.btn-back {
  width: 100%;
  padding: 24rpx 0;
  font-size: 30rpx;
  color: white;
  background-color: #3b82f6;
  border: none;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 6rpx rgba(59, 130, 246, 0.3);
}

/* 图标字体 */
.iconfont {
  font-family: 'iconfont' !important;
}

.icon-loading:before {
  content: '\e644';
}

.icon-success:before {
  content: '\e6b1';
}
</style> 