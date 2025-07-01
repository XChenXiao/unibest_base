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
        <image class="card-image" src="/static/images/bg/re-card.png" mode="widthFix"></image>
      </view>
  
      <!-- 申请表单 -->
      <view class="form-container" v-if="currentStep === 'form'">
        <view class="form-header">
          <view class="form-title">开户申请</view>
          <view class="form-subtitle">请填写以下信息完成开户申请</view>
        </view>
  
        <view class="fee-info">
          <view class="fee-label">
            开户预存金
            <text class="required-mark">*</text>
          </view>
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
            <view class="deposit-tips-list" v-if="depositTipsStore.getActiveDepositTips().length > 0">
              <view
                class="deposit-tip-item"
                v-for="(tip, index) in depositTipsStore.getActiveDepositTips()"
                :key="index"
              >
                <text class="tip-dot">•</text>
                <text class="tip-desc">{{ tip.description }}</text>
              </view>
            </view>
  
            <!-- 固定提示项，保持与其他提示一致的样式 -->
            <view class="deposit-tip-item">
              <text class="tip-dot">•</text>
              <text class="tip-desc">注意：预存金是预存回自己的银行账户，无任何费用，开通后即可转出使用。</text>
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
  
        <button
          class="confirm-recharge-btn"
          @click="processSubmit"
          :disabled="loading || !formData.amount"
        >
          {{ loading ? '处理中...' : '立即开户' }}
        </button>
        <!-- <view class="submit-hint">确认后将跳转到支付方式选择页面</view> -->
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
  import { onShow } from '@dcloudio/uni-app'
  import {
    createBankCardOpenOrderAPI,
    getBankCardConfigAPI,
    checkBankCardStatusAPI,
    IBankCardOpenOrder,
    IBankCardConfig,
  } from '@/service/index/bankcard'
  import { useUserStore, useDepositTipsStore } from '@/store'
  
  // 用户数据
  const userStore = useUserStore()
  
  // 预存服务提示store
  const depositTipsStore = useDepositTipsStore()
  
  // 申请步骤：form-表单填写，review-审核中
  const currentStep = ref('form')
  
  // 加载状态
  const loading = ref(false)
  
  // 快捷金额选项
  const quickAmounts = ['300', '500', '1000', '5000', '10000', '20000']
  
  // 开户费用
  const openFee = ref(0)
  
  // 开户说明信息
  const openFeeMessage = ref('开通银行卡需要支付预存金，支付的金额将存入您的账户余额')
  
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
    await depositTipsStore.fetchDepositTips()
  })
  
  // 每次页面显示时检查状态
  onShow(async () => {
    // 判断是否是首次进入页面
    const isFirstLoad = uni.getStorageSync('bank_account_first_load') !== 'false'
  
    if (isFirstLoad) {
      // 首次进入页面，设置标记并跳过检查
      uni.setStorageSync('bank_account_first_load', 'false')
      return
    }
  
    // 非首次进入，刷新用户信息并检查状态
    await userStore.fetchUserInfo()
  
    // 检查用户是否已经开通银行卡
    if (userStore.userInfo && userStore.userInfo.has_bank_card) {
      // 如果已经开通银行卡，返回上一页
      uni.showToast({
        title: '您已成功开通银行卡',
        icon: 'success',
        duration: 2000,
      })
  
      setTimeout(() => {
        uni.navigateBack()
      }, 2000)
    }
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
    try {
      // 使用新的API获取银行卡开户配置
      const res = await getBankCardConfigAPI()
      if (res.status === 'success') {
        // 使用类型断言解决类型问题
        const configData = res.data as any
        openFee.value = configData.open_fee
        // 如果有最小预存金额，设置为第一个快捷金额选项
        if (configData.min_deposit_amount) {
          // 如果没有选择金额，默认选择最小预存金额
          if (!formData.amount) {
            formData.amount = String(configData.min_deposit_amount)
          }
        }
      }
    } catch (error) {
      console.error('获取开户费用失败:', error)
      uni.showToast({
        title: '获取开户费用失败',
        icon: 'none',
      })
    }
  }
  
  // 提交申请前的验证
  const processSubmit = () => {
    // 验证表单数据
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
  
    if (!formData.amount) {
      uni.showToast({ title: '请选择预存金额', icon: 'none' })
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
  
    // 二次确认
    uni.showModal({
      title: '确认开户',
      content: `您选择的开户预存金金额为 ¥${formData.amount} 元`,
      success: async (res) => {
        if (res.confirm) {
          await jumpToPayment()
        }
      },
    })
  }
  
  // 跳转到支付页面
  const jumpToPayment = async () => {
    try {
      loading.value = true
      
      // 将用户信息和表单数据序列化为JSON字符串
      const userInfo = {
        name: formData.name,
        phone: formData.phone,
        id_card: formData.id_card,
        address: formData.address
      }
      
      // 跳转到支付选择页面
      uni.navigateTo({
        url: `/pages/payment/index?userInfo=${encodeURIComponent(JSON.stringify(userInfo))}&depositAmount=${formData.amount}&type=bankcard`,
        success: () => {
          console.log('成功跳转到支付选择页面')
        },
        fail: (err) => {
          console.error('跳转支付选择页面失败:', err)
          uni.showToast({
            title: '跳转失败，请重试',
            icon: 'none'
          })
        },
        complete: () => {
          loading.value = false
        }
      })
    } catch (error) {
      console.error('跳转支付页面失败:', error)
      uni.showToast({
        title: '跳转失败，请重试',
        icon: 'none',
      })
      loading.value = false
    }
  }
  
  // 检查支付状态
  const checkPaymentStatus = async (recordId: number) => {
    try {
      // 这里应该实现检查支付状态的逻辑
      // 如果支付成功，更新页面状态
      currentStep.value = 'review'
    } catch (error) {
      console.error('检查支付状态失败:', error)
    }
  }
  
  // 返回银行卡管理页面并触发刷新
  const backToCards = () => {
    try {
      // 使用页面参数传递刷新标记，不再使用事件总线
      // 刷新用户信息
      userStore.fetchUserInfo()
  
      // 返回上一页并传递参数
      uni.navigateBack({
        delta: 1,
        success: () => {
          // 获取当前页面栈
          const pages = getCurrentPages()
          // 获取上一页
          const prevPage = pages[pages.length - 2]
          if (prevPage) {
            // 直接调用上一页的方法进行刷新
            if (prevPage.$vm.refreshBankCards) {
              prevPage.$vm.refreshBankCards()
            }
            if (prevPage.$vm.refreshBankStatus) {
              prevPage.$vm.refreshBankStatus()
            }
          }
        },
      })
    } catch (error) {
      console.error('返回处理失败:', error)
      uni.navigateBack()
    }
  }
  </script>
  
  <style lang="scss" scoped>
  .container {
    box-sizing: border-box;
    min-height: 100vh;
    padding: 30rpx;
    background-color: #f5f5f5;
  }
  /* 银行卡图片样式 */
  .card-image-container {
    width: 100vw;
    margin: -30rpx -30rpx 20rpx -30rpx;
    padding: 0%;
    overflow: hidden;
  }
  
  .card-image {
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
  /* 预存金金额选择样式 */
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
  
  .amount-display:empty::before {
    color: #9ca3af;
    content: '请选择预存金额';
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
    color: #f39c12;
    background-color: rgba(243, 156, 18, 0.2);
  }
  
  .balance-info {
    padding: 20rpx;
    margin-top: 20rpx;
    font-size: 26rpx;
    color: #666;
    background-color: #f9fafb;
    border-radius: 8rpx;
  }
  
  .balance-warning {
    display: block;
    margin-top: 10rpx;
    color: #ef4444;
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
    margin-bottom: 10rpx;
    font-size: 26rpx;
    color: #374151;
  }
  
  .form-input {
    box-sizing: border-box;
    width: 100%;
    height: 90rpx;
    padding: 20rpx 16rpx;
    font-size: 28rpx;
    color: #333333;
    background-color: #ffffff;
    border: 1rpx solid #e5e7eb;
    border-radius: 8rpx;
  }
  
  .input-placeholder {
    font-size: 28rpx;
    color: #9ca3af;
  }
  
  .confirm-recharge-btn {
    width: 100%;
    height: 90rpx;
    margin-top: 30rpx;
    font-size: 32rpx;
    font-weight: 500;
    color: white;
    background: linear-gradient(to right, #f39c12, #e74c3c);
    border: none;
    border-radius: 45rpx;
  }
  
  .confirm-recharge-btn:disabled {
    background: linear-gradient(to right, #d4d4d4, #a0a0a0);
    opacity: 0.6;
  }
  
  .submit-hint {
    margin-top: 15rpx;
    font-size: 24rpx;
    color: #6b7280;
    text-align: center;
  }
  /* 审核中状态样式 */
  .review-container {
    box-sizing: border-box;
    width: 100%;
    padding: 40rpx 30rpx;
    text-align: center;
    background-color: #ffffff;
    border-radius: 20rpx;
  }
  
  .review-icon {
    margin-bottom: 20rpx;
    font-size: 80rpx;
    color: #f59e0b;
  }
  
  .review-title {
    margin-bottom: 20rpx;
    font-size: 36rpx;
    font-weight: bold;
    color: #111827;
  }
  
  .review-desc {
    margin-bottom: 30rpx;
    font-size: 28rpx;
    line-height: 1.6;
    color: #4b5563;
  }
  
  .review-time {
    display: block;
    margin-top: 10rpx;
    color: #f59e0b;
  }
  
  .review-tips {
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
  