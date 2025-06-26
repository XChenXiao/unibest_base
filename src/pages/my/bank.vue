<route lang="json5">
{
  style: {
    navigationBarTitleText: '中国银行',
  },
}
</route>

<template>
  <view class="bank-container">
    <!-- 顶部波浪装饰 -->
    <view class="wave-decoration"></view>

    <!-- 返回按钮 -->
    <view class="back-button" @click="goBack">
      <text class="uni-icons uniui-back"></text>
    </view>

    <!-- 余额卡片 -->
    <view class="balance-card">
      <!-- 银行卡顶部 -->
      <view class="card-header">
        <view class="bank-logo">
          <image src="/static/images/bank-icon.png" mode="aspectFit"></image>
          <text>中国银行</text>
        </view>
      </view>

      <!-- 余额部分 -->
      <view class="balance-section">
        <view class="balance-label">
          <text>可用余额(元)</text>
          <image
            class="eye-icon"
            :src="`/static/images/${showBalance ? 'show-icon' : 'hidden-icon'}.png`"
            mode="widthFix"
            @click.stop="toggleBalanceVisibility"
          ></image>
        </view>
        <view class="balance-amount">
          <text>{{ showBalance ? formatBalance(userStore.userInfo.balance) : '******' }}</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons">
        <button class="action-btn withdraw" @click="handleWithdraw">提现</button>
        <button class="action-btn transfer-out" @click="handleTransferOut">转出</button>
      </view>
    </view>



    <!-- 底部版权信息 -->
    <view class="bank-footer">
      <text></text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore, useVerificationStore } from '@/store'
import { usePlatformStore } from '@/store/platform'

// 获取用户状态
const userStore = useUserStore()
// 获取验证状态
const verificationStore = useVerificationStore()
// 获取平台设置状态
const platformStore = usePlatformStore()

// 余额显示控制
const showBalance = ref(true)

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}



// 格式化余额显示
const formatBalance = (balance) => {
  // 处理undefined、null或空字符串的情况
  if (balance === undefined || balance === null || balance === '') {
    return '0.00'
  }

  // 确保balance是数字类型
  let numBalance = 0
  try {
    numBalance = typeof balance === 'string' ? parseFloat(balance) : Number(balance)
    // 处理NaN的情况
    if (isNaN(numBalance)) {
      numBalance = 0
    }
  } catch (error) {
    console.error('余额格式化错误:', error)
    numBalance = 0
  }

  return numBalance.toFixed(2)
}

// 切换余额可见性
const toggleBalanceVisibility = () => {
  showBalance.value = !showBalance.value
}

// 处理提现
const handleWithdraw = () => {
  // 检查是否已开通银行卡
  if (!userStore.userInfo.has_bank_card) {
    uni.showModal({
      title: '提示',
      content: '您需要先开通银行卡账户，才能使用提现功能。是否前往开户？',
      confirmText: '去开户',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 检查银行卡功能是否开放
          if (!platformStore.enableBankAccount) {
            uni.showToast({
              title: '银行卡开户功能对接中',
              icon: 'none',
              duration: 2000
            })
            return
          }
          
          // 跳转到银行卡开户申请页面
          uni.navigateTo({
            url: '/pages/my/bank-account-apply',
          })
        }
      }
    })
    return
  }

  // 已开通银行卡，显示提示信息
  uni.showToast({
    title: '提现功能即将上线',
    icon: 'none',
    duration: 2000
  })
}

// 处理转出
const handleTransferOut = async () => {
  // 直接跳转到转出页面
  uni.navigateTo({
    url: '/pages/transfer/index',
  })
}

// 检查银行卡状态 - 仅做检查，不弹出提示
const checkBankCardStatus = () => {
  // 检查银行卡功能是否开放
  if (!platformStore.enableBankAccount) {
    return false
  }

  // 检查用户是否开通银行卡
  return userStore.userInfo.has_bank_card
}

// 页面加载时
onMounted(() => {
  // 不再主动请求用户信息，仅依赖store中已有的数据
  console.log('中国银行页面加载，当前store中的余额:', userStore.userInfo.balance)

  // 监听余额更新事件
  uni.$on('user_balance_updated', (data) => {
    console.log('中国银行页面收到余额更新:', data)
    if (data && data.balance !== undefined) {
      userStore.updateUserBalance(data.balance)
    }
  })
})

// 在页面卸载时移除事件监听
onUnmounted(() => {
  uni.$off('user_balance_updated')
})
</script>

<style lang="scss" scoped>
/* 全局重置 */
page {
  background-color: #f5f5f5;
  height: 100%;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

/* 容器样式 */
.bank-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
}

/* 顶部波浪装饰 */
.wave-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 16rpx;
  background: linear-gradient(to right, #ff9c00, #fa2c19);
}

/* 返回按钮 */
.back-button {
  position: absolute;
  top: 60rpx;
  left: 20rpx;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: #333;
  z-index: 10;
}

/* 余额卡片 */
.balance-card {
  position: relative;
  z-index: 1;
  padding: 30rpx;
  margin: 120rpx 30rpx 30rpx;
  color: #ffffff;
  background: linear-gradient(to bottom right, #35c8e6, #17b8e0);
  border-radius: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30rpx;
}

.bank-logo {
  display: flex;
  align-items: center;
}

.bank-logo image {
  width: 40rpx;
  height: 40rpx;
  margin-right: 10rpx;
}

.bank-logo text {
  font-size: 32rpx;
  font-weight: bold;
}

.balance-section {
  margin-bottom: 30rpx;
}

.balance-label {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}

.balance-label text {
  font-size: 28rpx;
}

.eye-icon {
  width: 40rpx;
  height: 40rpx;
  margin-left: 10rpx;
}

.balance-amount {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.balance-amount text:first-child {
  font-size: 60rpx;
  font-weight: bold;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.action-btn {
  flex: 1;
  padding: 20rpx 0;
  margin-right: 20rpx;
  font-size: 32rpx;
  line-height: 1.5;
  text-align: center;
  border-radius: 10rpx;
}

.withdraw {
  color: #17b8e0;
  background-color: #ffffff;
  border: none;
}

.transfer-out {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.3);
  border: none;
}

/* 底部版权信息 */
.bank-footer {
  text-align: center;
  padding: 30rpx 0;
  color: #999;
  font-size: 24rpx;
  margin-top: auto;
}
</style> 