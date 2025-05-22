<route lang="json5" type="page">
{
  style: {
    navigationBarTitleText: '银行卡开户申请',
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
    <!-- 顶部银行卡图片 -->
    <view class="card-image-container">
      <image class="card-image" src="/static/images/bg/card.png" mode="widthFix"></image>
    </view>

    <!-- 申请表单 -->
    <view class="form-container" v-if="currentStep === 'form'">
      <view class="form-header">
        <view class="form-title">开户申请</view>
        <view class="form-subtitle">请填写以下信息完成开户申请</view>
      </view>

      <view class="fee-info">
        <view class="fee-label">开户预存金<text class="required-mark">*</text></view>
        <view class="amount-input-container">
          <text class="amount-label">预存金额</text>
          <view class="amount-input-wrapper">
            <text class="amount-prefix">¥</text>
            <view class="amount-display">{{ formData.amount || '请选择预存金额' }}</view>
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

          <!-- 开户费用提示 -->
          <view class="open-fee-tip-item" v-if="openFee > 0">
            <text class="tip-desc">开通银行卡需要支付预存金 ¥{{ openFee.toFixed(2) }}</text>
          </view>
        </view>

        <view class="amount-buttons">
          <view
            v-for="(amount, index) in quickAmounts"
            :key="index"
            class="amount-btn"
            :class="{ 'amount-btn-active': formData.amount === amount }"
            @click="selectAmount(amount)"
          >
            <text>¥{{ amount }}</text>
          </view>
        </view>

        <!-- <view class="balance-info" :class="{ insufficient: !canApply }">
          当前网商银行余额: {{ userStore.userInfo.balance || 0 }} 人民币
          <text v-if="!canApply" class="balance-warning">网商银行余额不足，请先转入</text>
        </view> -->
      </view>

      <view class="form-group">
        <text class="form-label">真实姓名</text>
        <input
          type="text"
          class="form-input"
          v-model="formData.name"
          placeholder="请输入真实姓名"
          placeholder-class="input-placeholder"
        />
      </view>

      <view class="form-group">
        <text class="form-label">身份证号码</text>
        <input
          type="idcard"
          class="form-input"
          v-model="formData.id_card"
          placeholder="请输入身份证号码"
          placeholder-class="input-placeholder"
        />
      </view>

      <view class="form-group">
        <text class="form-label">联系地址</text>
        <input
          type="text"
          class="form-input"
          v-model="formData.address"
          placeholder="请输入详细联系地址"
          placeholder-class="input-placeholder"
        />
      </view>

      <view class="form-group">
        <text class="form-label">手机号码</text>
        <input
          type="number"
          class="form-input"
          v-model="formData.phone"
          placeholder="请输入手机号码"
          placeholder-class="input-placeholder"
        />
      </view>

      <button class="confirm-recharge-btn" @click="processSubmit" :disabled="loading || !formData.amount">
        {{ loading ? '提交中...' : '确认开户' }}
      </button>
      <view class="submit-hint">提交申请后将进入开户审核流程</view>
    </view>

    <!-- 审核中状态 -->
    <view class="review-container" v-if="currentStep === 'review'">
      <view class="review-icon">
        <text class="iconfont icon-time"></text>
      </view>
      <view class="review-title">申请审核中</view>
      <view class="review-desc">
        您的银行卡开户申请已提交，正在审核中。
        <text class="review-time">预计审核时间：1-3个工作日</text>
      </view>
      <view class="review-tips">
        <view class="tip-item">
          <text class="tip-dot"></text>
          <text class="tip-text">审核通过后，您将收到短信通知</text>
        </view>
        <view class="tip-item">
          <text class="tip-dot"></text>
          <text class="tip-text">审核通过后，您可以将网商银行余额提现到您的银行卡账户中</text>
        </view>
      </view>
      <button class="btn-back" @click="backToCards">返回银行卡管理</button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, watch } from 'vue'
import {
  getBankCardOpenFeeAPI,
  openBankCardAPI,
  getBankCardOpenRecordsAPI,
  getDepositTipsAPI,
  IBankCardOpenRecord,
  IDepositTip,
} from '@/service/index/bankcard'
import { useUserStore } from '@/store/user'

// 用户数据
const userStore = useUserStore()

// 申请步骤：form-表单填写，review-审核中
const currentStep = ref('form')

// 加载状态
const loading = ref(false)

// 快捷金额选项
const quickAmounts = ['300', '500', '1000', '5000', '10000', '20000']

// 开户费用
const openFee = ref(0)

// 开户说明信息
const openFeeMessage = ref('开通银行卡需要缴纳预存金，将从您的账户余额中扣除')

// 预存服务提示列表
const depositTips = ref<IDepositTip[]>([])

// 是否有足够余额支付开户费用
const canApply = ref(false)

// 表单数据
const formData = reactive({
  name: '',
  id_card: '',
  address: '',
  phone: '',
  amount: '', // 预存金额
})

// 选择快捷金额
const selectAmount = (amount: string) => {
  formData.amount = amount
}

// 在页面加载时获取开户费用和检查是否有申请记录
onMounted(async () => {
  // 获取开户费用
  await fetchOpenFee()

  // 获取预存服务提示
  await fetchDepositTips()

  // 其他初始化逻辑...
})

// 更新是否可申请状态
const updateCanApply = () => {
  // 不再检查余额是否足够，直接设置为true
  canApply.value = true
}

// 监听金额变化
watch(
  () => formData.amount,
  () => {
    updateCanApply()
  },
)

// 获取开户费用
const fetchOpenFee = async () => {
  loading.value = true
  try {
    const res = await getBankCardOpenFeeAPI()

    // 通过安全的方式访问返回数据
    const data = res as any

    if (data && data.open_fee) {
      // 正确获取开户费用，注意返回的是字符串，需要转换为数字
      openFee.value = parseFloat(data.open_fee) || 0

      // 获取开户说明信息
      if (data.message) {
        openFeeMessage.value = data.message
      }

      // 如果后端有返回额外的表单字段要求，可以在这里处理
      if (data.required_fields) {
        // 处理字段要求
      }

      updateCanApply()
    } else if (data && data.status === 'success' && data.data) {
      // 旧格式响应处理（带有status和data的嵌套结构）
      const responseData = data.data
      if (responseData.open_fee) {
        openFee.value = parseFloat(responseData.open_fee) || 0

        if (responseData.message) {
          openFeeMessage.value = responseData.message
        }

        updateCanApply()
      }
    }
  } catch (error) {
    // 静默处理错误，不显示任何错误信息
    console.error('获取开户费用失败，但不显示错误:', error)
    // 使用默认值
    openFee.value = 0
  } finally {
    loading.value = false
  }
}

// 获取预存服务提示
const fetchDepositTips = async () => {
  try {
    const res = await getDepositTipsAPI()
    // 使用安全的方式访问数据
    if (res && typeof res === 'object' && 'status' in res && res.status === 'success') {
      // 安全地访问data字段
      const data = res.data
      if (data && typeof data === 'object' && 'deposit_tips' in data) {
        depositTips.value = Array.isArray(data.deposit_tips) ? data.deposit_tips : []
      }
    }
  } catch (error) {
    // 静默处理错误，不显示任何错误信息
    console.error('获取预存服务提示失败，但不显示错误')
    // 使用空数组作为默认值
    depositTips.value = []
  }
}

// 检查用户是否有正在处理的申请
const checkApplicationStatus = async () => {
  loading.value = true
  try {
    const res = await getBankCardOpenRecordsAPI()
    if (res.status === 'success' && res.data) {
      const openRecords = res.data.open_records as IBankCardOpenRecord[]

      // 检查是否有正在审核中的申请
      const pendingRecord = openRecords.find((record) => record.status === 'pending')
      if (pendingRecord) {
        // 如果有正在审核的申请，直接跳到审核中状态
        currentStep.value = 'review'
      }
    }
  } catch (error) {
    console.error('获取开户记录失败:', error)
  } finally {
    loading.value = false
  }
}

// 直接提交申请并扣款
const processSubmit = async () => {
  // 表单验证
  if (!formData.amount) {
    uni.showToast({ title: '请选择预存金额', icon: 'none' })
    return
  }
  if (!formData.name) {
    uni.showToast({ title: '请输入真实姓名', icon: 'none' })
    return
  }
  if (!formData.id_card) {
    uni.showToast({ title: '请输入身份证号码', icon: 'none' })
    return
  }
  if (!formData.address) {
    uni.showToast({ title: '请输入联系地址', icon: 'none' })
    return
  }
  if (!formData.phone) {
    uni.showToast({ title: '请输入手机号码', icon: 'none' })
    return
  }

  // 验证身份证号码格式
  const idCardReg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  if (!idCardReg.test(formData.id_card)) {
    uni.showToast({ title: '身份证号码格式不正确', icon: 'none' })
    return
  }

  // 验证手机号码格式
  const phoneReg = /^1\d{10}$/
  if (!phoneReg.test(formData.phone)) {
    uni.showToast({ title: '手机号码格式不正确', icon: 'none' })
    return
  }

  // 不再检查余额是否足够

  // 二次确认
  uni.showModal({
    title: '确认提交申请',
    content: `您选择的开户预存金金额为 ${formData.amount} 人民币，是否确认提交申请？`,
    success: async (res) => {
      if (res.confirm) {
        await submitBankCardOpen()
      }
    },
  })
}

// 处理提交
const submitBankCardOpen = async () => {
  loading.value = true
  try {
    // 准备提交数据
    const submitData = {
      name: formData.name,
      phone: formData.phone,
      id_card: formData.id_card,
      address: formData.address,
      deposit_amount: formData.amount, // 添加预存金额字段
    }

    // 提交开户申请
    const res = await openBankCardAPI(submitData)

    if (res && res.status === 'success') {
      // 更新用户余额 - 余额已在后端扣除
      userStore.fetchUserInfo() // 刷新用户信息以获取更新的余额

      uni.showToast({
        title: res.message || '申请提交成功',
        icon: 'success',
      })

      // 触发刷新事件
      uni.$emit('refresh-bank-cards')
      uni.$emit('refresh-bank-status')

      // 延迟返回，让用户看到成功提示
      setTimeout(() => {
        // 返回上一页
        uni.navigateBack()
      }, 1500)
    } else {
      // 提交失败但不显示详细错误
      uni.showToast({
        title: '申请提交失败，请稍后再试',
        icon: 'none',
      })
    }
  } catch (error: any) {
    console.error('提交开户申请失败:', error)

    // 不显示详细错误信息，使用通用错误提示
    uni.showToast({
      title: '申请提交失败，请稍后再试',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

// 返回银行卡管理页面并触发刷新
const backToCards = () => {
  try {
    // 触发刷新事件
    uni.$emit('refresh-bank-cards')
    uni.$emit('refresh-bank-status')

    // 刷新用户信息
    userStore.fetchUserInfo()

    // 返回上一页
    uni.navigateBack()
  } catch (error) {
    console.error('返回处理失败:', error)
    uni.navigateBack()
  }
}
</script>

<style lang="scss" scoped>
.container {
  padding: 30rpx;
  background-color: #f5f5f5;
  min-height: 100vh;
  box-sizing: border-box;
}

/* 银行卡图片样式 */
.card-image-container {
  margin: -30rpx -30rpx 20rpx -30rpx;
  width: 100vw;
  overflow: hidden;
}

.card-image {
  width: 100%;
  height: auto;
  display: block;
}

.form-container {
  width: 100%;
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-sizing: border-box;
}

.form-header {
  margin-bottom: 30rpx;
}

.form-title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.form-subtitle {
  font-size: 26rpx;
  color: #6b7280;
}

.fee-info {
  margin-bottom: 30rpx;
  padding: 20rpx;
  background-color: #f9fafb;
  border-radius: 12rpx;
}

.fee-label {
  font-size: 26rpx;
  color: #6b7280;
}

.required-mark {
  color: #e74c3c;
  margin-left: 5rpx;
}

/* 预存金金额选择样式 */
.amount-input-container {
  margin-bottom: 30rpx;
}

.amount-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
  display: block;
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 10rpx;
  margin: 10rpx 0;
}

.amount-prefix {
  font-size: 40rpx;
  color: #333;
  margin-right: 10rpx;
}

.amount-display {
  flex: 1;
  height: 80rpx;
  font-size: 36rpx;
  color: #333;
  line-height: 80rpx;
  padding-left: 10rpx;
}

.amount-display:empty::before {
  content: '请选择预存金额';
  color: #9ca3af;
}

/* 开户预存金提示 */
.open-fee-tip {
  margin-top: 16rpx;
  padding: 16rpx;
  background-color: #fff9f0;
  border-radius: 8rpx;
}

.tip-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #ff9800;
  margin-bottom: 8rpx;
  display: block;
}

.tip-content {
  font-size: 26rpx;
  color: #333;
  line-height: 1.5;
  display: block;
}

.deposit-tips-list {
  margin-top: 16rpx;
}

.deposit-tip-item {
  display: flex;
  margin-bottom: 8rpx;
  align-items: flex-start;
}

.tip-dot {
  font-size: 28rpx;
  color: #ff9800;
  margin-right: 8rpx;
  line-height: 1.3;
}

.tip-desc {
  font-size: 24rpx;
  color: #666;
  flex: 1;
  line-height: 1.5;
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
  background-color: #f5f5f5;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
  font-size: 28rpx;
  color: #666;
}

.amount-btn-active {
  background-color: rgba(243, 156, 18, 0.2);
  color: #f39c12;
  font-weight: 500;
}

.balance-info {
  margin-top: 20rpx;
  padding: 20rpx;
  background-color: #f9fafb;
  border-radius: 8rpx;
  font-size: 26rpx;
  color: #666;
}

.balance-warning {
  display: block;
  color: #ef4444;
  margin-top: 10rpx;
}

.insufficient {
  background-color: #fef2f2;
  border: 1px solid #fee2e2;
}

.form-group {
  margin-bottom: 25rpx;
}

.form-label {
  display: block;
  color: #374151;
  margin-bottom: 10rpx;
  font-size: 26rpx;
}

.form-input {
  width: 100%;
  border: 1rpx solid #e5e7eb;
  border-radius: 8rpx;
  padding: 20rpx 16rpx;
  background-color: #ffffff;
  font-size: 28rpx;
  box-sizing: border-box;
  height: 90rpx;
  color: #333333;
}

.input-placeholder {
  color: #9ca3af;
  font-size: 28rpx;
}

.confirm-recharge-btn {
  width: 100%;
  height: 90rpx;
  border: none;
  border-radius: 45rpx;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  color: white;
  font-size: 32rpx;
  font-weight: 500;
  margin-top: 30rpx;
}

.confirm-recharge-btn:disabled {
  opacity: 0.6;
  background: linear-gradient(to right, #d4d4d4, #a0a0a0);
}

.submit-hint {
  font-size: 24rpx;
  color: #6b7280;
  margin-top: 15rpx;
  text-align: center;
}

/* 审核中状态样式 */
.review-container {
  width: 100%;
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  box-sizing: border-box;
  text-align: center;
}

.review-icon {
  font-size: 80rpx;
  color: #f59e0b;
  margin-bottom: 20rpx;
}

.review-title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
  color: #111827;
}

.review-desc {
  font-size: 28rpx;
  color: #4b5563;
  margin-bottom: 30rpx;
  line-height: 1.6;
}

.review-time {
  display: block;
  color: #f59e0b;
  margin-top: 10rpx;
}

.review-tips {
  margin-bottom: 40rpx;
  background-color: #f9fafb;
  padding: 20rpx;
  border-radius: 12rpx;
  text-align: left;
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
  background-color: #3b82f6;
  border-radius: 50%;
  margin-right: 15rpx;
  margin-top: 12rpx;
}

.tip-text {
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.5;
}

.btn-back {
  width: 100%;
  background-color: #3b82f6;
  color: white;
  padding: 24rpx 0;
  border: none;
  border-radius: 12rpx;
  font-size: 30rpx;
  box-shadow: 0 4rpx 6rpx rgba(59, 130, 246, 0.3);
}

/* 图标字体，需要在项目中引入相应的图标库 */
.iconfont {
  font-family: 'iconfont' !important;
}
.icon-wallet:before {
  content: '\e6b1';
}
.icon-time:before {
  content: '\e65f';
}
</style>
