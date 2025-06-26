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
          <text>{{ showBalance ? formatBalance(bankCardStore.bankCardBalance) : '******' }}</text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons">
        <button class="action-btn withdraw" @click="handleWithdraw">转入</button>
        <button class="action-btn transfer-out" @click="handleTransferOut">转出</button>
      </view>
    </view>

    <!-- 充值弹窗 -->
    <wd-popup v-model="showRechargePopup" round position="center">
      <view class="popup-content">
        <view class="popup-header">
          <text class="popup-title">转入预存金</text>
          <text class="popup-close" @click="closeRechargePopup">×</text>
        </view>
        <view class="popup-body">
          <view class="amount-input-container">
            <text class="amount-label">预存金额</text>
            <view class="amount-input-wrapper">
              <text class="amount-prefix">¥</text>
              <input
                class="amount-input"
                type="digit"
                v-model="rechargeAmount"
                placeholder="请输入预存金额"
              />
            </view>
          </view>

          <!-- 银行卡开户预存金提示 -->
          <view class="open-fee-tip">
            <text class="tip-title">温馨提示</text>
            <view
              class="deposit-tips-list"
              v-if="depositTipsStore.getActiveDepositTips().length > 0"
            >
              <view
                class="deposit-tip-item"
                v-for="(tip, index) in depositTipsStore.getActiveDepositTips()"
                :key="index"
              >
                <text class="tip-dot">•</text>
                <text class="tip-desc">{{ tip.description }}</text>
              </view>
            </view>
          </view>

          <view class="amount-buttons">
            <view
              v-for="(amount, index) in quickAmounts"
              :key="index"
              class="amount-btn"
              :class="{ 'amount-btn-active': rechargeAmount === amount }"
              @click="selectAmount(amount)"
            >
              <text>¥{{ amount }}</text>
            </view>
          </view>
          <button class="confirm-recharge-btn" @click="confirmRecharge">确认转入</button>
        </view>
      </view>
    </wd-popup>

    <!-- 底部版权信息 -->
    <view class="bank-footer">
      <text></text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { useUserStore, useVerificationStore, useBankCardStore } from '@/store'
import { usePlatformStore } from '@/store/platform'
import { useAppStore } from '@/store/app'
import { useDepositTipsStore } from '@/store'
import { getDepositTipsAPI } from '@/service/index/bankcard'
import { onShow } from '@dcloudio/uni-app'

// 定义接口类型
interface DepositTip {
  id: number
  description: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// 获取用户状态
const userStore = useUserStore()
// 获取验证状态
const verificationStore = useVerificationStore()
// 获取平台设置状态
const platformStore = usePlatformStore()
// 获取银行卡状态
const bankCardStore = useBankCardStore()
// 获取App数据存储
const appStore = useAppStore()
// 获取预存服务提示
const depositTipsStore = useDepositTipsStore()

// 余额显示控制
const showBalance = ref(true)

// 充值相关
const rechargeAmount = ref('')
const showRechargePopup = ref(false)
const quickAmounts = ['100', '500', '1000', '5000', '10000', '20000']
// 预存服务提示列表
const depositTips = ref<DepositTip[]>([])

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 页面加载时
onMounted(() => {
  // 获取银行卡余额
  bankCardStore.fetchBankCardBalance()
})

// 页面显示时更新银行卡余额
onShow(() => {
  console.log('中国银行页面显示，更新银行卡余额')
  // 获取银行卡余额
  bankCardStore.fetchBankCardBalance()
})

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

// 处理提现 - 实际为预存金功能
const handleWithdraw = () => {
  // 显示转入功能对接中的提示
  uni.showToast({
    title: '敬请期待',
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

// 关闭充值弹窗
const closeRechargePopup = () => {
  showRechargePopup.value = false
}

// 选择快捷金额
const selectAmount = (amount) => {
  rechargeAmount.value = amount
}

// 确认充值
const confirmRecharge = async () => {
  if (!rechargeAmount.value || parseFloat(rechargeAmount.value) <= 0) {
    uni.showToast({
      title: '请输入有效的充值金额',
      icon: 'none',
    })
    return
  }

  try {
    // 关闭充值弹窗
    closeRechargePopup()
    
    // 直接跳转到支付结算页面，让用户选择支付方式
    uni.navigateTo({
      url: `/pages/payment/checkout?amount=${rechargeAmount.value}&type=recharge`,
      success: () => {
        console.log('成功跳转到支付结算页面')
      },
      fail: (err) => {
        console.error('跳转支付结算页面失败:', err)
        uni.showToast({
          title: '跳转失败，请重试',
          icon: 'none'
        })
      }
    })
  } catch (error) {
    console.error('跳转失败:', error)
    uni.showToast({
      title: '操作失败，请重试',
      icon: 'none',
      duration: 2000,
    })
  }
}

// 获取预存服务提示
const fetchDepositTips = async () => {
  try {
    const res = await getDepositTipsAPI()
    console.log('预存服务提示响应:', res)

    // 使用安全的方式访问数据
    if (res && typeof res === 'object' && 'status' in res && res.status === 'success') {
      // 安全地访问data字段
      const data = res.data
      if (data && typeof data === 'object' && 'deposit_tips' in data) {
        depositTips.value = (data.deposit_tips as DepositTip[]) || []
        console.log('获取预存服务提示成功:', depositTips.value)
      }
    }
  } catch (error) {
    console.error('获取预存服务提示失败:', error)
    depositTips.value = [] // 确保始终有一个有效数组
  }
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

/* 充值弹窗 */
.popup-content {
  width: 600rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
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

.amount-input-container {
  margin-bottom: 30rpx;
}

.amount-label {
  display: block;
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 10rpx;
}

.amount-prefix {
  font-size: 40rpx;
  color: #333;
  margin-right: 10rpx;
}

.amount-input {
  flex: 1;
  height: 80rpx;
  font-size: 36rpx;
}

.amount-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 40rpx;
}

.amount-btn {
  width: 170rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  margin-bottom: 20rpx;
  font-size: 28rpx;
  color: #666;
}

.amount-btn-active {
  background-color: rgba(243, 156, 18, 0.2);
  color: #f39c12;
  font-weight: 500;
}

/* 开户预存金提示 */
.open-fee-tip {
  background-color: rgba(243, 156, 18, 0.1);
  border-radius: 8rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
}

.tip-title {
  display: block;
  font-size: 28rpx;
  font-weight: 500;
  color: #f39c12;
  margin-bottom: 10rpx;
}

.deposit-tips-list {
  margin-top: 16rpx;
}

.deposit-tip-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8rpx;
}

.tip-dot {
  color: #ff9800;
  margin-right: 8rpx;
  font-size: 28rpx;
  line-height: 1.3;
}

.tip-desc {
  flex: 1;
  font-size: 24rpx;
  line-height: 1.5;
  color: #666;
}

.confirm-recharge-btn {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  color: white;
  font-size: 32rpx;
  font-weight: 500;
  border: none;
  border-radius: 45rpx;
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