<route lang="json5">
{
  style: {
    navigationBarTitleText: '转账',
  },
}
</route>

<template>
  <view class="container">
    <!-- 顶部蓝色背景和标题 -->
    <view class="header">
      <text class="header-title">转账 安全免费·到账快</text>
    </view>

    <!-- 主要转账选项 -->
    <view class="main-options-card">
      <view class="main-options">
        <view class="option-item" @click="navigateTo('/pages/transfer/bank')">
          <view class="option-icon">
            <image class="icon-image" src="@/static/images/tran1-1.png" mode="aspectFit"></image>
          </view>
          <text class="option-text">转到银行账户</text>
        </view>

        <view class="option-item" @click="navigateTo('/pages/transfer/alipay')">
          <view class="option-icon">
            <image class="icon-image" src="@/static/images/tran1-2.png" mode="aspectFit"></image>
          </view>
          <text class="option-text">转到支付宝</text>
        </view>

        <view class="option-item" @click="navigateTo('/pages/transfer/wechat')">
          <view class="option-icon">
            <image class="icon-image" src="@/static/images/tran1-3.png" mode="aspectFit"></image>
          </view>
          <text class="option-text">转到微信</text>
        </view>
      </view>
    </view>

    <!-- 底部其他选项 -->
    <view class="bottom-card">
      <view class="bottom-options">
        <view class="option-small" @click="showComingSoon">
          <view class="option-small-icon">
            <image
              class="small-icon-image"
              src="@/static/images/tran2-1.png"
              mode="aspectFit"
            ></image>
          </view>
          <text class="option-small-text">还信用卡</text>
        </view>

        <view class="option-small" @click="handleRecharge">
          <view class="option-small-icon">
            <image
              class="small-icon-image"
              src="@/static/images/tran2-2.png"
              mode="aspectFit"
            ></image>
          </view>
          <text class="option-small-text">转入资金</text>
        </view>

        <view class="option-small" @click="showComingSoon">
          <view class="option-small-icon">
            <image
              class="small-icon-image"
              src="@/static/images/tran2-3.png"
              mode="aspectFit"
            ></image>
          </view>
          <text class="option-small-text">手机号收款</text>
        </view>
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

            <!-- 预存服务提示列表 -->
            <view class="deposit-tips-list" v-if="depositTips.length > 0">
              <view class="deposit-tip-item" v-for="(tip, index) in depositTips" :key="index">
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
  </view>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { useAppStore } from '@/store/app'
import { checkBankCardStatusAPI, getDepositTipsAPI, IDepositTip } from '@/service/index/bankcard'

const userStore = useUserStore()
const appStore = useAppStore()

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 充值相关
const rechargeAmount = ref('')
const showRechargePopup = ref(false)
const quickAmounts = ['100', '500', '1000', '5000', '10000', '20000']

// 预存服务提示列表
const depositTips = ref<IDepositTip[]>([])

// 处理充值/转入
const handleRecharge = () => {
  rechargeAmount.value = ''
  showRechargePopup.value = true

  // 如果用户没有开通银行卡且没有获取预存金金额，则获取预存金金额
  if (!userStore.userInfo.has_bank_card && !appStore.hasFetchedBankCardOpenFee) {
    appStore.fetchBankCardOpenFee()
  }
}

// 关闭充值弹窗
const closeRechargePopup = () => {
  showRechargePopup.value = false
}

// 选择快捷金额
const selectAmount = (amount: string) => {
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
    // 显示加载状态
    uni.showLoading({
      title: '处理中...',
    })

    // 这里替换为实际的充值API调用
    // const res = await api.recharge({ amount: parseFloat(rechargeAmount.value) });

    // 模拟第三方支付跳转
    setTimeout(() => {
      uni.hideLoading()
      closeRechargePopup()

      // 模拟跳转到第三方支付
      uni.navigateTo({
        url: `/pages/payment/third-party?amount=${rechargeAmount.value}`,
      })
    }, 1000)
  } catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: '充值失败，请重试',
      icon: 'none',
    })
  }
}

// 页面跳转
const navigateTo = async (url: string) => {
  // 直接跳转到目标页面
  uni.navigateTo({ url })
}

// 显示"敬请期待"提示
const showComingSoon = () => {
  uni.showToast({
    title: '敬请期待',
    icon: 'none',
    duration: 2000,
  })
}

// 初始化
onMounted(async () => {
  // 获取预存金额提示
  await fetchDepositTips()

  // 获取银行卡开户费用
  await appStore.fetchBankCardOpenFee()
})

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
        depositTips.value = data.deposit_tips
        console.log('获取预存服务提示成功:', depositTips.value)
      }
    }
  } catch (error) {
    console.error('获取预存服务提示失败:', error)
  }
}
</script>

<style lang="scss">
page {
  width: 100%;
  min-height: 100%;
  overflow-x: hidden;
  background-color: #f5f5f5;
}

.container {
  box-sizing: border-box;
  width: 100%;
  min-height: 100vh;
  padding: 40rpx;
  background: linear-gradient(to bottom, #1296db 0%, #1296db 50%, #ffffff 100%);
}

.header {
  padding: 60rpx 0 40rpx;
}

.header-title {
  font-size: 42rpx;
  font-weight: bold;
  color: #ffffff;
}

.main-options-card {
  box-sizing: border-box;
  width: 100%;
  padding: 20rpx;
  margin-bottom: 40rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
}

.main-options {
  display: flex;
  justify-content: space-around;
  width: 100%;
}

.option-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 45%;
  padding: 20rpx 0;
}

.option-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120rpx;
  height: 120rpx;
  margin-bottom: 30rpx;
  overflow: hidden;
  background-color: #ffffff;
  border-radius: 50%;
}

.icon-image {
  width: 100%;
  height: 100%;
}

.option-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #333333;
}

.bottom-card {
  box-sizing: border-box;
  width: 100%;
  padding: 30rpx 20rpx;
  background: #ffffff;
  border-radius: 16rpx;
}

.bottom-options {
  display: flex;
  justify-content: space-around;
  width: 100%;
}

.option-small {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 30%;
}

.option-small-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80rpx;
  height: 80rpx;
  margin-bottom: 20rpx;
  overflow: hidden;
  background-color: #ffffff;
  border-radius: 10rpx;
}

.small-icon-image {
  width: 100%;
  height: 100%;
}

.option-small-text {
  font-size: 28rpx;
  color: #333333;
}
/* 充值弹窗样式 */
.popup-content {
  width: 600rpx;
  overflow: hidden;
  background-color: #ffffff;
  border-radius: 20rpx;
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
  line-height: 1;
  color: #999;
}

.popup-body {
  padding: 30rpx;
}
/* 金额输入 */
.amount-input-container {
  margin-bottom: 30rpx;
}

.amount-label {
  display: block;
  margin-bottom: 20rpx;
  font-size: 28rpx;
  color: #666;
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  padding-bottom: 10rpx;
  border-bottom: 1px solid #e0e0e0;
}

.amount-prefix {
  margin-right: 10rpx;
  font-size: 40rpx;
  color: #333;
}

.amount-input {
  flex: 1;
  height: 80rpx;
  font-size: 36rpx;
}
/* 快捷金额选择 */
.amount-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 40rpx;
}

.amount-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 170rpx;
  height: 80rpx;
  margin-bottom: 20rpx;
  font-size: 28rpx;
  color: #666;
  background-color: #f5f5f5;
  border-radius: 8rpx;
}

.amount-btn-active {
  font-weight: 500;
  color: #1296db;
  background-color: rgba(18, 150, 219, 0.2);
}
/* 开户预存金提示 */
.open-fee-tip {
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

.tip-content {
  display: block;
  font-size: 26rpx;
  line-height: 1.5;
  color: #333;
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
/* 确认按钮 */
.confirm-recharge-btn {
  width: 100%;
  height: 90rpx;
  font-size: 32rpx;
  font-weight: 500;
  color: white;
  background: linear-gradient(to right, #1296db, #0e85c3);
  border: none;
  border-radius: 45rpx;
}
</style>
