<route lang="json5" type="page">
{
  style: {
    navigationBarTitleText: '提现',
    navigationStyle: 'default',
  },
}
</route>

<template>
  <view class="withdraw-container">
    <!-- 提现金额输入区域 -->
    <view class="amount-section">
      <view class="section-title">提现金额</view>
      <view class="amount-input-wrapper">
        <text class="amount-prefix">¥</text>
        <input
          class="amount-input"
          type="digit"
          v-model="withdrawAmount"
          placeholder="请输入提现金额"
          @input="validateAmount"
        />
      </view>
      <view class="balance-info">
        <text>可用余额: ¥{{ formatBalance(userStore.userInfo.balance) }}</text>
        <text class="all-withdraw" @click="setMaxAmount">全部提现</text>
      </view>
    </view>

    <!-- 提现到银行卡区域 -->
    <view class="bank-section">
      <view class="section-title">提现到</view>
      <view class="bank-card-option" @click="selectWithdrawType">
        <view class="bank-logo">
          <image src="/static/images/bank-icon.png" mode="aspectFit"></image>
          <text>{{ isBankBalance ? '中国银行' : (selectedBankCard ? selectedBankCard.bank_name : '银行卡') }}</text>
        </view>
        <view class="bank-type">
          <text>{{ withdrawTypeText }}</text>
          <wd-icon name="arrow-right" class="bank-arrow" />
        </view>
      </view>
    </view>
    
    <!-- 提现密码输入区域 -->
    <view class="password-section">
      <view class="section-title">提现密码</view>
      <view class="password-input-wrapper">
        <input
          class="password-input"
          type="text"
          password
          v-model="withdrawPassword"
          placeholder="请输入提现密码"
        />
      </view>
      <view class="forgot-password" @click="navigateTo('/pages/my/reset-withdraw-password')">
        忘记密码?
      </view>
    </view>

    <!-- 提现说明 -->
    <view class="withdraw-tips">
      <view class="tip-title">提现说明</view>
      <view class="tip-item">
        <text class="tip-dot">•</text>
        <text class="tip-text" v-if="isBankBalance">提现将立即到账到中国银行余额</text>
        <text class="tip-text" v-else>提现申请提交后，将在1-3个工作日内到账</text>
      </view>
      <view class="tip-item">
        <text class="tip-dot">•</text>
        <text class="tip-text">如有疑问，请联系客服</text>
      </view>
    </view>

    <!-- 提现按钮 -->
    <button 
      class="withdraw-btn" 
      :class="{ 'withdraw-btn-disabled': !isFormValid }"
      :disabled="!isFormValid"
      @click="submitWithdraw"
    >
      确认提现
    </button>
    
    <!-- 提现类型选择弹窗 -->
    <wd-popup v-model="showTypePopup" position="bottom" round>
      <view class="type-popup-content">
        <view class="type-popup-header">
          <text class="type-popup-title">选择提现方式</text>
          <text class="type-popup-close" @click="showTypePopup = false">×</text>
        </view>
        <view class="type-list">
          <view class="type-item" @click="selectType('bank_balance')">
            <view class="type-item-content">
              <view class="type-name">中国银行余额</view>
              <view class="type-desc">提现到中国银行余额</view>
            </view>
            <wd-icon v-if="isBankBalance" name="check" class="type-selected" />
          </view>
          <view class="type-item" @click="selectType('bank')">
            <view class="type-item-content">
              <view class="type-name">银行卡</view>
              <view class="type-desc">提现到绑定的银行卡</view>
            </view>
            <wd-icon v-if="!isBankBalance" name="check" class="type-selected" />
          </view>
        </view>
        <button class="type-confirm-btn" @click="confirmType">确认</button>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup name="withdraw">
import { ref, computed, onMounted, watch, onUnmounted } from 'vue'
import { useUserStore, useBankCardStore } from '@/store'
import { useAppStore } from '@/store/app'
import { applyWithdrawAPI } from '@/service/index/withdraw'
import { onLoad } from '@dcloudio/uni-app'

// 获取用户数据存储
const userStore = useUserStore()
// 获取银行卡数据存储
const bankCardStore = useBankCardStore()
// 获取应用数据存储
const appStore = useAppStore()

// 提现金额
const withdrawAmount = ref('')
// 提现密码
const withdrawPassword = ref('')
// 是否为有效金额
const isValidAmount = ref(false)
// 银行卡ID
const bankCardId = ref(0)
// 选中的银行卡信息
const selectedBankCard = ref<any>(null)
// 提现类型：bank(银行卡) 或 bank_balance(中国银行余额)
const withdrawType = ref<'bank' | 'bank_balance' | 'alipay' | 'wechat'>('bank')
// 是否提现到银行卡余额
const isBankBalance = ref(true)
// 提现类型弹窗显示控制
const showTypePopup = ref(false)

// 接收页面参数
onLoad((options) => {
  console.log('提现页面接收到参数:', options)
  
  // 检查是否有选中的银行卡ID
  if (options.selectedCardId) {
    const cardId = parseInt(options.selectedCardId)
    if (!isNaN(cardId) && cardId > 0) {
      console.log('从URL参数获取到银行卡ID:', cardId)
      
      // 立即设置银行卡ID
      bankCardId.value = cardId
      
      // 从URL参数中获取提现类型和是否银行余额
      if (options.withdrawType) {
        withdrawType.value = options.withdrawType as any
      } else {
        // 默认设置为银行卡提现
        withdrawType.value = 'bank'
      }
      
      // 设置是否银行余额
      if (options.isBankBalance) {
        isBankBalance.value = options.isBankBalance === 'true'
      } else {
        // 如果提现类型是bank，则设置为false
        isBankBalance.value = withdrawType.value !== 'bank'
      }
      
      console.log('从URL参数设置提现方式:', {
        withdrawType: withdrawType.value,
        isBankBalance: isBankBalance.value
      })
      
      // 从store中获取对应的银行卡信息
      // 先检查store中是否已有选中的银行卡
      if (bankCardStore.selectedBankCard && bankCardStore.selectedBankCardId === cardId) {
        selectedBankCard.value = bankCardStore.selectedBankCard
        console.log('从store中获取到选中的银行卡:', selectedBankCard.value)
      } else {
        // 如果store中没有，则从银行卡列表中查找
        fetchAndSetBankCard(cardId)
      }
      
      // 打印当前设置的提现方式，用于调试
      console.log('当前提现方式最终设置为:', {
        withdrawType: withdrawType.value,
        isBankBalance: isBankBalance.value,
        bankCardId: bankCardId.value,
        selectedBankCard: selectedBankCard.value
      })
    }
  }
})

// 获取并设置银行卡信息
const fetchAndSetBankCard = async (cardId: number) => {
  try {
    // 先尝试获取银行卡列表
    if (!bankCardStore.bankCards || bankCardStore.bankCards.length === 0) {
      await bankCardStore.fetchBankCards()
    }
    
    // 从列表中查找对应ID的银行卡
    if (bankCardStore.bankCards && bankCardStore.bankCards.length > 0) {
      const card = bankCardStore.bankCards.find(c => c.id === cardId)
      if (card) {
        selectedBankCard.value = card
        console.log('从银行卡列表中找到对应的银行卡:', card)
        
        // 同时更新store中的选中银行卡
        bankCardStore.setSelectedBankCard(card)
      } else {
        console.error('未找到ID为', cardId, '的银行卡')
      }
    } else {
      console.error('银行卡列表为空')
    }
  } catch (error) {
    console.error('获取银行卡信息失败:', error)
  }
}

// 提现类型显示文本
const withdrawTypeText = computed(() => {
  if (isBankBalance.value) {
    return '中国银行余额'
  } else if (selectedBankCard.value) {
    // 显示银行卡号后四位
    const cardNumber = selectedBankCard.value.masked_card_number || ''
    const lastFourDigits = cardNumber.length >= 4 ? cardNumber.slice(-4) : cardNumber
    return `${selectedBankCard.value.bank_name} (尾号${lastFourDigits})`
  } else {
    return '请选择银行卡'
  }
})

// 表单是否有效
const isFormValid = computed(() => {
  // 添加调试信息
  console.log('表单验证状态:', {
    isValidAmount: isValidAmount.value,
    hasPassword: withdrawPassword.value.length > 0,
    hasBankCard: bankCardId.value > 0,
    withdrawType: withdrawType.value,
    isBankBalance: isBankBalance.value,
    selectedBankCard: selectedBankCard.value !== null
  })
  
  // 验证条件：金额有效且有密码
  // 如果是银行卡提现，还需要选择了银行卡
  if (!isValidAmount.value || withdrawPassword.value.length === 0) {
    return false
  }
  
  // 如果是银行卡提现方式，必须选择了银行卡
  if (withdrawType.value === 'bank' && (!selectedBankCard.value || bankCardId.value <= 0)) {
    return false
  }
  
  return true
})

// 在页面加载时获取银行卡信息
onMounted(async () => {
  try {
    // 获取用户银行卡列表
    await bankCardStore.fetchBankCards()
    
    // 注意：onLoad会在onMounted之前执行，如果URL参数中有银行卡ID，
    // 则不需要在这里设置默认值，避免覆盖onLoad中的设置
    
    // 如果没有从URL参数设置银行卡（即用户不是从银行卡选择页面返回的）
    if (bankCardId.value === 0) {
      // 检查是否有从银行卡管理页面选择的银行卡
      if (bankCardStore.selectedBankCard) {
        // 使用选中的银行卡
        bankCardId.value = bankCardStore.selectedBankCardId!
        selectedBankCard.value = bankCardStore.selectedBankCard
        // 设置提现方式为银行卡
        withdrawType.value = 'bank'
        isBankBalance.value = false
        console.log('使用store中选中的银行卡:', bankCardStore.selectedBankCard)
      }
      // 如果没有选中的银行卡，但有银行卡列表，使用默认卡或第一张卡
      else if (bankCardStore.bankCards && bankCardStore.bankCards.length > 0) {
        // 查找默认银行卡
        const defaultCard = bankCardStore.bankCards.find(card => card.is_default)
        
        if (defaultCard) {
          bankCardId.value = defaultCard.id
          selectedBankCard.value = defaultCard
          console.log('使用默认银行卡:', defaultCard)
        } else {
          // 没有默认卡，使用第一张卡
          bankCardId.value = bankCardStore.bankCards[0].id
          selectedBankCard.value = bankCardStore.bankCards[0]
          console.log('使用第一张银行卡:', bankCardStore.bankCards[0])
        }
        
        // 注意：这里不设置提现方式，保持默认的中国银行余额
      }
      
      // 初始化时设置isValidAmount为false
      isValidAmount.value = false
      console.log('页面加载完成，初始化表单状态')
      
      // 默认选择提现到银行卡余额
      withdrawType.value = 'bank_balance'
      isBankBalance.value = true
    } else {
      console.log('onMounted: 使用从URL参数获取的银行卡ID:', bankCardId.value)
    }
  } catch (error) {
    console.error('获取银行卡信息失败:', error)
  }
})

// 在页面卸载时清除选中的银行卡
onUnmounted(() => {
  // 清除选中的银行卡，避免影响下次进入页面
  bankCardStore.clearSelectedBankCard()
})

// 格式化余额显示
const formatBalance = (balance: any) => {
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

// 验证提现金额
const validateAmount = () => {
  const amount = parseFloat(withdrawAmount.value)
  const balance = parseFloat(String(userStore.userInfo.balance) || '0')
  
  console.log('验证金额:', {
    inputAmount: withdrawAmount.value,
    parsedAmount: amount,
    userBalance: balance,
    isNaN: isNaN(amount),
    isZeroOrNegative: amount <= 0,
    isGreaterThanBalance: amount > balance
  })
  
  // 验证金额是否有效
  if (isNaN(amount) || amount <= 0) {
    isValidAmount.value = false
    console.log('金额无效: NaN或小于等于0')
    return
  }
  
  // 验证金额是否超过可用余额
  if (amount > balance) {
    isValidAmount.value = false
    uni.showToast({
      title: '提现金额不能超过可用余额',
      icon: 'none'
    })
    console.log('金额无效: 超过可用余额')
    return
  }
  
  isValidAmount.value = true
  console.log('金额有效!')
}

// 监听输入金额变化
watch(withdrawAmount, (newVal) => {
  validateAmount()
})

// 设置最大提现金额
const setMaxAmount = () => {
  const balance = parseFloat(String(userStore.userInfo.balance) || '0')
  withdrawAmount.value = String(balance)
  console.log('设置最大提现金额:', balance)
  // 手动触发验证
  validateAmount()
}

// 打开提现类型选择弹窗
const selectWithdrawType = () => {
  showTypePopup.value = true
}

// 选择提现类型
const selectType = (type: 'bank' | 'bank_balance') => {
  withdrawType.value = type
  isBankBalance.value = type === 'bank_balance'
  
  // 如果选择银行卡提现方式，跳转到银行卡管理页面
  if (type === 'bank') {
    // 先检查用户是否有银行卡
    if (bankCardStore.bankCards && bankCardStore.bankCards.length > 0) {
      uni.navigateTo({ 
        url: '/pages/my/bank-cards?from=withdraw',
        success: () => {
          // 关闭当前弹窗
          showTypePopup.value = false
          console.log('成功跳转到银行卡管理页面')
        },
        fail: (err) => {
          console.error('跳转银行卡管理页面失败:', err)
          uni.showToast({
            title: '跳转失败，请重试',
            icon: 'none'
          })
        }
      })
    } else {
      // 如果没有银行卡，提示用户先添加银行卡
      uni.showModal({
        title: '提示',
        content: '您还没有添加银行卡，是否前往添加？',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({ 
              url: '/pages/my/bank-cards?from=withdraw',
              success: () => {
                // 关闭当前弹窗
                showTypePopup.value = false
              }
            })
          } else {
            // 用户取消，恢复为银行余额提现方式
            withdrawType.value = 'bank_balance'
            isBankBalance.value = true
          }
        }
      })
    }
  }
}

// 确认提现类型选择
const confirmType = () => {
  // 如果选择了中国银行余额提现，检查用户是否已开户
  if (isBankBalance.value && !userStore.userInfo.has_bank_card) {
    // 显示开户引导弹窗
    uni.showModal({
      title: '开户提示',
      content: '银行卡未预存开通收款功能',
      confirmText: '立即开户',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          // 检查开户功能是否开放
          const isEnabled = await appStore.checkAccountOpenEnabled()
          
          if (!isEnabled) {
            // 如果开户功能未开放，提示用户
            uni.showToast({
              title: '开户功能对接中，请稍后再试',
              icon: 'none',
              duration: 2000
            })
            return
          }
          
          // 用户点击确认，跳转到银行卡开户页面
          showTypePopup.value = false
          uni.navigateTo({
            url: '/pages/my/bank-account-apply'
          })
        }
      }
    })
    return
  }
  
  showTypePopup.value = false
}

// 页面跳转
const navigateTo = (url: string) => {
  uni.navigateTo({ url })
}

// 检查银行卡是否需要风控
const isBankCardRestricted = (card: any): boolean => {
  // 所有银行卡都进行风控
  return true
}

// 提交提现申请
const submitWithdraw = async () => {
  console.log('尝试提交提现申请:', {
    isFormValid: isFormValid.value,
    amount: withdrawAmount.value,
    bankCardId: bankCardId.value,
    withdrawType: withdrawType.value,
    isBankBalance: isBankBalance.value,
    hasPassword: withdrawPassword.value.length > 0,
    selectedBankCard: selectedBankCard.value
  })

  if (!isValidAmount.value) {
    uni.showToast({
      title: '请输入有效的提现金额',
      icon: 'none'
    })
    return
  } 
  
  if (!withdrawPassword.value) {
    uni.showToast({
      title: '请输入提现密码',
      icon: 'none'
    })
    return
  }
  
  // 只有当选择中国银行余额提现时，才检查用户是否已开户
  if (isBankBalance.value && !userStore.userInfo.has_bank_card) {
    // 显示开户引导弹窗
    uni.showModal({
      title: '开户提示',
      content: '银行卡未预存开通收款功能',
      confirmText: '立即开户',
      cancelText: '取消',
      success: async (res) => {
        if (res.confirm) {
          // 检查开户功能是否开放
          const isEnabled = await appStore.checkAccountOpenEnabled()
          
          if (!isEnabled) {
            // 如果开户功能未开放，提示用户
            uni.showToast({
              title: '开户功能对接中，请稍后再试',
              icon: 'none',
              duration: 2000
            })
            return
          }
          
          // 用户点击确认，跳转到银行卡开户页面
          uni.navigateTo({
            url: '/pages/my/bank-account-apply'
          })
        }
      }
    })
    return
  }
  
  // 如果选择银行卡提现，但没有选择银行卡
  if (!isBankBalance.value && (!selectedBankCard.value || bankCardId.value <= 0)) {
    uni.showToast({
      title: '请选择提现银行卡',
      icon: 'none'
    })
    return
  }
  
  // 添加银行卡风控检查
  if (!isBankBalance.value && selectedBankCard.value && isBankCardRestricted(selectedBankCard.value)) {
    // 显示风控提示并阻止提现
    uni.showModal({
      title: '温馨提示',
      content: '该银行卡大额风控，请开通大额专属卡收款',
      showCancel: false
    })
    return
  }
  
  try {
    uni.showLoading({
      title: '提交中...',
    })
    
    // 构建API请求参数
    const apiParams: any = {
      amount: Number(withdrawAmount.value),
      withdraw_type: withdrawType.value,
      withdraw_password: withdrawPassword.value,
    }
    
    // 只有当提现类型为bank时，才需要银行卡ID
    if (withdrawType.value === 'bank' && bankCardId.value > 0) {
      apiParams.bank_card_id = bankCardId.value
    }
    
    // 打印API请求参数
    console.log('提现API请求参数:', apiParams)
    
    // 调用提现API
    const result = await applyWithdrawAPI(apiParams)
    
    console.log('提现API响应:', result)
    
    uni.hideLoading()
    
    if (result && result.status === 'success') {
      // 刷新用户信息以更新余额
      await userStore.fetchUserInfo()
      
      // 如果是提现到中国银行余额，同时更新中国银行余额
      if (withdrawType.value === 'bank_balance' && result.data.status === 'completed') {
        bankCardStore.syncBankCardBalance()
          .then(() => {
            console.log('提现成功后更新中国银行余额成功')
          })
          .catch(error => {
            console.error('提现成功后更新中国银行余额失败:', error)
          })
      }
      
      // 提现申请成功 - 使用模态框而不是Toast，显示后端返回的消息
      uni.showModal({
        title: result.data.status === 'completed' ? '提现已完成' : '提现申请已提交',
        content: result.message || (result.data.status === 'completed' ? 
          '您的提现已成功，资金已转入中国银行余额' : 
          '您的提现申请已成功提交，将在1-3个工作日内到账'),
        showCancel: false,
        success: () => {
          // 返回上一页
          uni.navigateBack()
        }
      })
    } else {
      // 提现申请失败，显示后端返回的错误信息
      uni.showModal({
        title: '提现申请失败',
        content: result?.message || '请稍后再试',
        showCancel: false
      })
    }
  } catch (error: any) {
    uni.hideLoading()
    console.error('提现失败:', error)
    
    // 直接使用后端返回的错误信息
    let errorMessage = ''
    
    if (error.data && error.data.message) {
      // 如果错误对象中直接包含data和message
      errorMessage = error.data.message
    } else if (error.response && error.response.data && error.response.data.message) {
      // 如果错误对象中包含response.data.message
      errorMessage = error.response.data.message
    } else if (error.message) {
      // 如果错误对象中包含message
      errorMessage = error.message
    } else {
      // 如果没有任何错误信息，使用空字符串
      errorMessage = '提现失败'
    }
    
    uni.showModal({
      title: '提现失败',
      content: errorMessage,
      showCancel: false
    })
  }
}
</script>

<style lang="scss" scoped>
.withdraw-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 30rpx;
  background-color: #f5f5f5;
}

.section-title {
  margin-bottom: 20rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

/* 金额输入区域 */
.amount-section {
  padding: 30rpx;
  margin-bottom: 30rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  padding-bottom: 20rpx;
  border-bottom: 1px solid #f0f0f0;
}

.amount-prefix {
  margin-right: 10rpx;
  font-size: 40rpx;
  font-weight: 500;
  color: #333;
}

.amount-input {
  flex: 1;
  height: 80rpx;
  font-size: 40rpx;
  font-weight: 500;
}

.balance-info {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: #999;
}

.all-withdraw {
  color: #3498db;
}

/* 银行卡选择区域 */
.bank-section {
  padding: 30rpx;
  margin-bottom: 30rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
}

.bank-card-option {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
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
  font-size: 28rpx;
  color: #333;
}

.bank-type {
  display: flex;
  align-items: center;
}

.bank-type text {
  font-size: 28rpx;
  color: #666;
  margin-right: 10rpx;
}

.bank-arrow {
  font-size: 28rpx;
  color: #ccc;
}

/* 密码输入区域 */
.password-section {
  padding: 30rpx;
  margin-bottom: 30rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
  position: relative;
}

.password-input-wrapper {
  display: flex;
  align-items: center;
  padding-bottom: 10rpx;
  border-bottom: 1px solid #f0f0f0;
}

.password-input {
  flex: 1;
  height: 80rpx;
  font-size: 32rpx;
}

.forgot-password {
  position: absolute;
  right: 30rpx;
  bottom: 30rpx;
  font-size: 24rpx;
  color: #3498db;
}

/* 提现说明 */
.withdraw-tips {
  padding: 30rpx;
  margin-bottom: 30rpx;
  background-color: #ffffff;
  border-radius: 16rpx;
}

.tip-title {
  margin-bottom: 20rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 10rpx;
}

.tip-dot {
  margin-right: 10rpx;
  color: #999;
}

.tip-text {
  flex: 1;
  font-size: 24rpx;
  line-height: 1.5;
  color: #666;
}

/* 提现按钮 */
.withdraw-btn {
  width: 100%;
  height: 90rpx;
  margin-top: 50rpx;
  font-size: 32rpx;
  font-weight: 500;
  color: #ffffff;
  background: linear-gradient(to right, #3498db, #2980b9);
  border: none;
  border-radius: 45rpx;
}

.withdraw-btn-disabled {
  background: #cccccc;
  opacity: 0.6;
}

/* 提现类型选择弹窗 */
.type-popup-content {
  padding: 30rpx;
}

.type-popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30rpx;
}

.type-popup-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
}

.type-popup-close {
  font-size: 40rpx;
  color: #999;
}

.type-list {
  margin-bottom: 30rpx;
}

.type-item {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx 0;
  border-bottom: 1px solid #f0f0f0;
}

.type-item:last-child {
  border-bottom: none;
}

.type-name {
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
  margin-bottom: 6rpx;
}

.type-desc {
  font-size: 24rpx;
  color: #999;
}

.type-selected {
  font-size: 40rpx;
  color: #3498db;
}

.type-confirm-btn {
  width: 100%;
  height: 90rpx;
  font-size: 32rpx;
  font-weight: 500;
  color: #ffffff;
  background: linear-gradient(to right, #3498db, #2980b9);
  border: none;
  border-radius: 45rpx;
}
</style> 