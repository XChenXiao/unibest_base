<route lang="json5">
{
  style: {
    navigationBarTitleText: '银行卡开户支付',
  },
}
</route>

<template>
  <view class="payment-container">
    <!-- 支付信息卡片 -->
    <view class="payment-card">
      <view class="payment-header">
        <text class="payment-title">银行卡开户支付</text>
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
          <text class="detail-label">支付状态</text>
          <text class="detail-value status-text" :class="statusClass">{{ orderInfo.status_text || '待支付' }}</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">订单编号</text>
          <text class="detail-value">{{ orderInfo.out_trade_no || '' }}</text>
        </view>
      </view>
    </view>

    <!-- 支付状态 -->
    <view class="status-container">
      <view class="status-icon" :class="{'success-icon': isPaid, 'pending-icon': !isPaid}">
        <text class="iconfont" :class="isPaid ? 'icon-success' : 'icon-time'"></text>
      </view>
      <view class="status-title">{{ isPaid ? '支付成功' : '等待支付' }}</view>
      <view class="status-desc">
        {{ isPaid ? '您的银行卡开户申请已提交，正在处理中' : '请尽快完成支付以完成银行卡开户' }}
      </view>

      <view class="action-buttons">
        <button class="btn-check" @click="checkPaymentStatus">刷新支付状态</button>
        <button v-if="!isPaid" class="btn-repay" @click="handleRepay">重新支付</button>
        <button class="btn-back" @click="goBack">{{ isPaid ? '返回' : '取消支付' }}</button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue'
import { onLoad, onShow } from '@dcloudio/uni-app'
import { 
  getBankCardOpenOrderStatusAPI, 
  IBankCardOpenOrderStatus,
  verifyBankCardPaymentAPI
} from '@/service/index/bankcard'
import { useUserStore } from '@/store'

// 用户存储
const userStore = useUserStore()

// 页面参数
const pageParams = ref<{
  record_id?: string
  out_trade_no?: string
  total_amount?: string
  pay_info?: string
  pay_type?: string
  payment_type?: string
}>({})

// 订单信息
const orderInfo = ref<Partial<IBankCardOpenOrderStatus> & {
  total_amount?: number
}>({})

// 加载状态
const loading = ref(false)
const checkTimer = ref<number | null>(null)

// 页面加载时获取参数
onLoad((options) => {
  pageParams.value = options as any
  
  // 初始化订单信息
  if (options.record_id) {
    orderInfo.value.id = parseInt(options.record_id)
  }
  
  if (options.out_trade_no) {
    orderInfo.value.out_trade_no = options.out_trade_no
  }
  
  // 如果有缓存的订单信息，取出使用
  const cachedOrder = uni.getStorageSync('bank_card_open_order')
  if (cachedOrder) {
    if (!orderInfo.value.id && cachedOrder.record_id) {
      orderInfo.value.id = cachedOrder.record_id
    }
    if (!orderInfo.value.out_trade_no && cachedOrder.out_trade_no) {
      orderInfo.value.out_trade_no = cachedOrder.out_trade_no
    }
  }
  
  // 立即查询订单状态
  checkPaymentStatus()
  
  // 启动自动查询
  startAutoCheck()
})

// 每次页面显示时查询支付状态
onShow(() => {
  checkPaymentStatus()
  
  // 如果没有自动查询，启动
  if (!checkTimer.value) {
    startAutoCheck()
  }
})

// 判断是否已支付
const isPaid = computed(() => {
  return orderInfo.value.status === 'completed' || 
         orderInfo.value.payment_status === 'paid'
})

// 状态样式
const statusClass = computed(() => {
  if (isPaid.value) {
    return 'status-success'
  } else if (orderInfo.value.status === 'failed' || orderInfo.value.payment_status === 'failed') {
    return 'status-error'
  } else {
    return 'status-pending'
  }
})

// 查询支付状态
const checkPaymentStatus = async () => {
  if (!orderInfo.value.id) {
    uni.showToast({
      title: '订单ID不存在',
      icon: 'none'
    })
    return
  }
  
  try {
    loading.value = true
    
    // 首先检查本地存储中是否有支付成功的标记
    const localPaymentStatus = uni.getStorageSync(`bank_card_payment_${orderInfo.value.id}`)
    if (localPaymentStatus === 'paid') {
      console.log('本地存储中已标记为支付成功')
      // 如果本地已标记为已支付，则更新订单状态
      orderInfo.value.status = 'completed'
      orderInfo.value.status_text = '支付成功'
      orderInfo.value.payment_status = 'paid'
      orderInfo.value.payment_status_text = '已支付'
    }
    
    // 调用API查询订单状态
    const res = await getBankCardOpenOrderStatusAPI(orderInfo.value.id)
    
    if (res.status === 'success' && res.data) {
      const responseData = res.data
      
      // 特殊处理：如果通过其他渠道确认支付已成功但API返回待支付状态
      if (localPaymentStatus === 'paid' && 
          (responseData.status === 'pending' || responseData.payment_status === 'pending')) {
        console.log('本地标记已支付，但服务器状态仍为待支付，尝试主动验证支付状态')
        
        // 主动验证支付状态
        if (orderInfo.value.out_trade_no) {
          try {
            const verifyResult = await verifyBankCardPaymentAPI(orderInfo.value.out_trade_no)
            
            if (verifyResult.status === 'success' && verifyResult.data.verified) {
              console.log('支付验证成功，状态为:', verifyResult.data.payment_status)
              
              // 更新本地状态
              if (verifyResult.data.payment_status === 'paid') {
                // 使用验证后的状态
                responseData.status = 'completed'
                responseData.status_text = '支付成功'
                responseData.payment_status = 'paid'
                responseData.payment_status_text = '已支付'
                
                // 保存到本地
                uni.setStorageSync(`bank_card_payment_${orderInfo.value.id}`, 'paid')
              }
            } else {
              console.log('支付验证未通过:', verifyResult.message)
            }
          } catch (verifyError) {
            console.error('验证支付状态失败:', verifyError)
          }
        }
        
        // 如果验证后状态仍然是待支付，显示提示
        if (responseData.status === 'pending' || responseData.payment_status === 'pending') {
          uni.showToast({
            title: '支付已成功，系统处理中',
            icon: 'none',
            duration: 2000
          })
          
          // 使用本地成功状态覆盖服务器返回的待支付状态
          responseData.status = 'completed'
          responseData.status_text = '支付成功，处理中'
          responseData.payment_status = 'paid'
          responseData.payment_status_text = '已支付'
          
          // 继续检查，直到服务器状态同步
          setTimeout(() => {
            checkPaymentStatus()
          }, 3000)
        }
      }
      
      // 设置订单信息
      orderInfo.value = {
        ...responseData,
        // 如果后端没有提供total_amount，则使用deposit_amount
        total_amount: responseData.deposit_amount
      }
      
      // 如果支付成功，保存本地状态
      if (responseData.status === 'completed' || responseData.payment_status === 'paid') {
        uni.setStorageSync(`bank_card_payment_${orderInfo.value.id}`, 'paid')
      }
      
      // 如果支付成功，停止自动查询
      if (isPaid.value) {
        stopAutoCheck()
        
        // 刷新用户信息
        await userStore.fetchUserInfo()
        
        // 通知用户
        uni.showToast({
          title: '支付成功',
          icon: 'success'
        })
      }
    }
  } catch (error) {
    console.error('查询支付状态失败:', error)
  } finally {
    loading.value = false
  }
}

// 启动自动查询
const startAutoCheck = () => {
  stopAutoCheck() // 先清除可能存在的定时器
  
  checkTimer.value = setInterval(() => {
    checkPaymentStatus()
  }, 5000) // 每5秒查询一次
}

// 停止自动查询
const stopAutoCheck = () => {
  if (checkTimer.value) {
    clearInterval(checkTimer.value)
    checkTimer.value = null
  }
}

// 重新支付
const handleRepay = () => {
  // 如果有原支付链接，可以重新打开
  if (pageParams.value.pay_info) {
    try {
      const payInfo = JSON.parse(decodeURIComponent(pageParams.value.pay_info))
      
      if (payInfo.pay_url) {
        // #ifdef H5
        window.location.href = payInfo.pay_url
        // #endif
        
        // #ifdef APP-PLUS
        plus.runtime.openURL(payInfo.pay_url)
        // #endif
        
        // #ifdef MP
        uni.setClipboardData({
          data: payInfo.pay_url,
          success: () => {
            uni.showModal({
              title: '重新支付',
              content: '支付链接已复制，请在浏览器中打开完成支付',
              showCancel: false
            })
          }
        })
        // #endif
      }
    } catch (error) {
      console.error('解析支付信息失败:', error)
      uni.showToast({
        title: '支付信息无效，请返回重新创建订单',
        icon: 'none'
      })
    }
  } else {
    // 没有支付信息，返回上一页重新创建订单
    uni.showModal({
      title: '提示',
      content: '支付信息已失效，是否返回重新创建订单？',
      success: (res) => {
        if (res.confirm) {
          uni.navigateBack()
        }
      }
    })
  }
}

// 返回上一页
const goBack = () => {
  // 停止自动查询
  stopAutoCheck()
  
  // 如果已支付成功，跳转到我的页面
  if (isPaid.value) {
    uni.switchTab({
      url: '/pages/my/index'
    })
  } else {
    // 否则返回上一页
    uni.navigateBack()
  }
}

// 页面卸载时清理定时器
onUnmounted(() => {
  stopAutoCheck()
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
  
  .status-text {
    &.status-success {
      color: #52c41a;
    }
    
    &.status-error {
      color: #ff4d4f;
    }
    
    &.status-pending {
      color: #faad14;
    }
  }
}

.status-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 50rpx 30rpx;
  margin-bottom: 30rpx;
  background-color: white;
  border-radius: 20rpx;
  text-align: center;
}

.status-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120rpx;
  height: 120rpx;
  margin-bottom: 30rpx;
  border-radius: 50%;
  
  &.success-icon {
    background-color: #f6ffed;
    color: #52c41a;
  }
  
  &.pending-icon {
    background-color: #fff7e6;
    color: #faad14;
  }
  
  .iconfont {
    font-size: 60rpx;
  }
}

.status-title {
  margin-bottom: 20rpx;
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

.status-desc {
  margin-bottom: 40rpx;
  font-size: 28rpx;
  color: #666;
}

.action-buttons {
  display: flex;
  flex-direction: column;
  width: 100%;
  
  .btn-check {
    height: 80rpx;
    margin-bottom: 20rpx;
    font-size: 28rpx;
    color: white;
    line-height: 80rpx;
    background-color: #1890ff;
    border-radius: 40rpx;
  }
  
  .btn-repay {
    height: 80rpx;
    margin-bottom: 20rpx;
    font-size: 28rpx;
    color: white;
    line-height: 80rpx;
    background-color: #ff4d4f;
    border-radius: 40rpx;
  }
  
  .btn-back {
    height: 80rpx;
    font-size: 28rpx;
    color: #666;
    line-height: 80rpx;
    background-color: #f0f0f0;
    border-radius: 40rpx;
  }
}
</style> 