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
      <view class="card-header-container">
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

    <!-- 银行卡列表 -->
    <view class="bank-card-list">
      <!-- 银行卡列表 -->
      <view class="card-list">
        <view class="empty-tip" v-if="bankCardStore.bankCards.length === 0">
          <text>暂无银行卡，请添加银行卡</text>
        </view>
        <view class="visa-card" v-for="card in bankCardStore.bankCards" :key="card.id" :style="{ background: getBankCardGradient(card.bank_name) }">
          <view class="card-watermark">
            <image 
            :src="getBankIconByName(card.bank_name) ? `/static/images/bank/${getBankIconByName(card.bank_name)}.png` : '/static/images/bank-icon.png'" mode="widthFix" 
            :style="getBankIconByName(card.bank_name)  !== 'default-card' ? 'width: 30%;position: absolute;top: 0;right: 300rpx;' : 'width: 20%;position: absolute;top: 70rpx;right: 340rpx;'">
          </image>
          </view>
          <view class="card-bank-name" style="height: 30rpx;align-items: center;">
            {{ card.bank_name }}
          </view>
          <view class="visa-number">
            <text>•••• •••• •••• {{ card.masked_card_number.slice(-4) }}</text>
          </view>
          <view class="card-icon" style="display: flex; align-items: center; justify-content: center;">
            <image :src="getBankIconByName(card.bank_name) ? `/static/images/bank/${getBankIconByName(card.bank_name)}.png` : '/static/images/bank-icon.png'" mode="widthFix" :style="getBankIconByName(card.bank_name) !== 'default-card' ? 'width: 80%;' : 'width: 60%;'"></image>
          </view>
        </view>
      </view>
      
      <!-- 添加银行卡按钮 -->
      <view class="add-card-btn" @click="showAddCardForm = true">
        <view class="add-icon">+</view>
        <view class="add-text">添加银行卡</view>
        <view class="promotion-text">绑新卡送立减金</view>
      </view>
    </view>

    <!-- 添加银行卡表单弹窗 -->
    <wd-popup v-model="showAddCardForm" round position="bottom">
      <view class="add-card-form">
        <view class="form-header">
          <text class="form-title">添加银行卡</text>
          <text class="form-close" @click="showAddCardForm = false">×</text>
        </view>
        <view class="form-body">
          <view class="form-item">
            <text class="form-label">持卡人</text>
            <input 
              class="form-input" 
              v-model="newCard.card_holder" 
              placeholder="请输入持卡人姓名" 
              placeholder-class="input-placeholder"
            />
          </view>
          <view class="form-item">
            <text class="form-label">银行名称</text>
            <view class="bank-selector">
              <view class="bank-search-input">
                <input
                  class="form-input"
                  v-model="bankSearchKeyword"
                  placeholder="请输入银行名称"
                  placeholder-class="input-placeholder"
                  @input="filterBanks"
                  @focus="showBankDropdown = true"
                  @blur="handleBankInputBlur"
                />
                <text class="search-icon uni-icons uniui-search"></text>
              </view>
              <view class="bank-dropdown" v-if="showBankDropdown">
                <scroll-view scroll-y style="max-height: 300rpx;">
                  <view 
                    class="bank-item" 
                    v-for="bank in filteredBanks" 
                    :key="bank.key"
                    @click="selectBank(bank)"
                  >
                    <image class="bank-icon" :src="bank.key ? `/static/images/bank/${bank.key}.png` : '/static/images/bank-icon.png'" mode="aspectFit"></image>
                    <text class="bank-name">{{ bank.value }}</text>
                  </view>
                  <view class="empty-tip" v-if="filteredBanks.length === 0">
                    <text>未找到匹配的银行</text>
                  </view>
                </scroll-view>
              </view>
            </view>
          </view>
          <view class="form-item">
            <text class="form-label">银行卡号</text>
            <input 
              class="form-input" 
              v-model="newCard.card_number" 
              type="text" 
              placeholder="请输入银行卡号" 
              placeholder-class="input-placeholder"
              :maxlength="19"
            />
          </view>
          <view class="form-tips">
            <text>* 请确保所填信息准确无误，银行卡需为储蓄卡</text>
          </view>
          <button class="submit-btn" @click="saveCard">确认添加</button>
        </view>
      </view>
    </wd-popup>

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
import { ref, onMounted, onUnmounted, reactive, computed } from 'vue'
import { useUserStore, useVerificationStore, useBankCardStore } from '@/store'
import { usePlatformStore } from '@/store/platform'
import { useAppStore } from '@/store/app'
import { useDepositTipsStore } from '@/store'
import { getDepositTipsAPI, addBankCardAPI, deleteBankCardAPI } from '@/service/index/bankcard'
import { onShow } from '@dcloudio/uni-app'
import { BankEnum } from '@/enums/BankEnum'

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

// 根据银行名称获取对应的BankEnum枚举键
const getBankEnumKeyByName = (bankName: string): keyof typeof BankEnum | null => {
  // 遍历BankEnum查找匹配的银行名称
  const entry = Object.entries(BankEnum).find(([_, value]) => value === bankName)
  return entry ? entry[0] as keyof typeof BankEnum : null
}

// 根据银行名称获取图标文件名
const getBankIconByName = (bankName: string): string => {
  const bankKey = getBankEnumKeyByName(bankName)
  // 如果找不到对应的银行枚举，直接返回空字符串，让@error事件触发
  return bankKey ? bankKey : 'default-card'
}

// 根据银行名称获取卡片渐变色
const getBankCardGradient = (bankName: string): string => {
  // 根据银行类型分类设置渐变色
  const bankKey = getBankEnumKeyByName(bankName)
  if (!bankKey) return 'linear-gradient(135deg, #467bec 0%, #214da5 100%)' // 默认蓝色渐变
  
  // 根据银行图标的主色调设置渐变色
  switch (bankKey) {
    // 国有银行
    case 'BANK_OF_CHINA': // 中国银行 - 红色
      return 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'
    case 'ICBC': // 工商银行 - 红色
      return 'linear-gradient(135deg, #e53935 0%, #c62828 100%)'
    case 'CCB': // 建设银行 - 蓝色
      return 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)'
    case 'ABC': // 农业银行 - 绿色
      return 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)'
    case 'BOCOM': // 交通银行 - 蓝色
      return 'linear-gradient(135deg, #0288d1 0%, #01579b 100%)'
    case 'PSBC': // 邮储银行 - 绿色
      return 'linear-gradient(135deg, #00897b 0%, #004d40 100%)'
    
    // 股份制商业银行
    case 'CMB': // 招商银行 - 红色
      return 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)'
    case 'CITIC': // 中信银行 - 红色
      return 'linear-gradient(135deg, #c62828 0%, #8e0000 100%)'
    case 'SPDB': // 浦发银行 - 蓝色
      return 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)'
    case 'CIB': // 兴业银行 - 蓝色
      return 'linear-gradient(135deg, #0277bd 0%, #01579b 100%)'
    case 'CMBC': // 民生银行 - 绿色
      return 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)'
    case 'CEB': // 光大银行 - 黄色
      return 'linear-gradient(135deg, #fdd835 0%, #f57f17 100%)'
    case 'PAB': // 平安银行 - 橙色
      return 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)'
    case 'GDB': // 广发银行 - 红色
      return 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)'
    case 'HXB': // 华夏银行 - 红色
      return 'linear-gradient(135deg, #c62828 0%, #8e0000 100%)'
    
    // 其他银行分类
    default:
      // 城市商业银行 - 多为绿色系
      if (bankKey.startsWith('BO') && !['BOCOM'].includes(bankKey)) {
        return 'linear-gradient(135deg, #388e3c 0%, #1b5e20 100%)'
      }
      
      // 农商行/农信社/农合行 - 多为橙色或绿色系
      if (bankKey.includes('RCB') || bankKey.endsWith('RCB')) {
        return 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)'
      }
      
      // 其他银行 - 默认蓝紫色系
      return 'linear-gradient(135deg, #5e35b1 0%, #4527a0 100%)'
  }
}

// 余额显示控制
const showBalance = ref(true)

// 充值相关
const rechargeAmount = ref<string>('')
const showRechargePopup = ref(false)
const quickAmounts = ['100', '500', '1000', '5000', '10000', '20000']
// 预存服务提示列表
const depositTips = ref<DepositTip[]>([])

// 银行卡表单相关
interface BankCardForm {
  card_holder: string;
  bank_name: string;
  card_number: string;
}

const showAddCardForm = ref(false)
const newCard = reactive<BankCardForm>({
  card_holder: '',
  bank_name: '',
  card_number: ''
})

// 银行搜索和选择相关
const bankSearchKeyword = ref('')
const showBankDropdown = ref(false)
const selectedBankKey = ref<keyof typeof BankEnum | null>(null)

// 银行列表
interface BankItem {
  key: keyof typeof BankEnum;
  value: string;
}

// 将BankEnum转换为数组以便于处理
const bankList = computed<BankItem[]>(() => {
  return Object.entries(BankEnum)
    .filter(([key]) => isNaN(Number(key))) // 过滤掉枚举的数字键
    .map(([key, value]) => ({
      key: key as keyof typeof BankEnum,
      value: value as string
    }))
})

// 根据搜索关键词过滤银行列表
const filteredBanks = ref<BankItem[]>([] as BankItem[])

// 初始化过滤后的银行列表
onMounted(() => {
  filteredBanks.value = bankList.value
})

// 过滤银行列表
const filterBanks = () => {
  if (!bankSearchKeyword.value) {
    filteredBanks.value = bankList.value
    return
  }
  
  filteredBanks.value = bankList.value.filter(bank => 
    bank.value.toLowerCase().includes(bankSearchKeyword.value.toLowerCase())
  )
}

// 选择银行
const selectBank = (bank: BankItem) => {
  bankSearchKeyword.value = bank.value
  newCard.bank_name = bank.value
  selectedBankKey.value = bank.key
  showBankDropdown.value = false
}

// 处理银行输入框失去焦点事件
const handleBankInputBlur = () => {
  // 使用setTimeout延迟关闭下拉框，以便点击事件能够先触发
  setTimeout(() => {
    showBankDropdown.value = false
  }, 200)
}

// 获取银行Logo
const getBankLogo = (bankName: string) => {
  // 根据银行名称返回对应的logo
  const bankLogos: Record<string, string> = {
    '中国银行': '/static/images/bank/bank-boc.png',
    '中国工商银行': '/static/images/bank/bank-icbc.png',
    '中国建设银行': '/static/images/bank/bank-ccb.png',
    '中国农业银行': '/static/images/bank/bank-abc.png',
    '中国民生银行': '/static/images/bank/bank-cmbc.png',
    '招商银行': '/static/images/bank/bank-cmb.png',
    '浦发银行': '/static/images/bank/bank-spdb.png',
    '兴业银行': '/static/images/bank/bank-cib.png'
  }
  
  return bankLogos[bankName] || '/static/images/bank-icon.png'
}

// 保存银行卡
const saveCard = async () => {
  // 表单验证
  if (!newCard.card_holder) {
    return uni.showToast({
      title: '请输入持卡人姓名',
      icon: 'none'
    })
  }
  
  if (!newCard.bank_name) {
    return uni.showToast({
      title: '请选择银行名称',
      icon: 'none'
    })
  }
  
  if (!newCard.card_number || newCard.card_number.length < 16) {
    return uni.showToast({
      title: '请输入正确的银行卡号',
      icon: 'none'
    })
  }
  
  // 显示加载中
  uni.showLoading({
    title: '添加中...'
  })
  
  try {
    // 调用API添加银行卡
    const response = await addBankCardAPI({
      bank_name: newCard.bank_name,
      card_number: newCard.card_number,
      card_holder: newCard.card_holder
    })
    
    uni.hideLoading()
    
    if (response && response.status === 'success') {
      uni.showToast({
        title: '添加成功',
        icon: 'success'
      })
      
      // 重置表单并关闭
      newCard.card_holder = ''
      newCard.bank_name = ''
      bankSearchKeyword.value = ''
      selectedBankKey.value = null
      newCard.card_number = ''
      showAddCardForm.value = false
      
      // 刷新银行卡列表
      bankCardStore.fetchBankCards()
    } else {
      // 直接显示后端返回的错误信息
      uni.showToast({
        title: response?.message || '添加失败',
        icon: 'none',
        duration: 3000
      })
    }
  } catch (error) {
    uni.hideLoading()
    // 显示错误对象中的信息（如果存在）
    const errorMsg = error?.data.message
    uni.showToast({
      title: errorMsg,
      icon: 'none',
      duration: 3000
    })
    console.error('添加银行卡失败', error)
  }
}

// 确认删除银行卡
const confirmDeleteCard = (cardId: number) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除该银行卡吗？',
    success: (res) => {
      if (res.confirm) {
        deleteBankCard(cardId)
      }
    }
  })
}

// 删除银行卡
const deleteBankCard = async (cardId: number) => {
  uni.showLoading({
    title: '删除中...'
  })
  
  try {
    // 调用API删除银行卡
    const response = await deleteBankCardAPI(cardId)
    
    uni.hideLoading()
    
    if (response && response.status === 'success') {
      uni.showToast({
        title: '删除成功',
        icon: 'success'
      })
      
      // 刷新银行卡列表
      bankCardStore.fetchBankCards()
    } else {
      uni.showToast({
        title: response?.message || '删除失败',
        icon: 'none'
      })
    }
  } catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: '删除失败，请重试',
      icon: 'none'
    })
    console.error('删除银行卡失败', error)
  }
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}


// 页面加载时
onMounted(() => {
  // 获取银行卡余额
  bankCardStore.fetchBankCardBalance()
  // 获取银行卡列表
  bankCardStore.fetchBankCards()
})

// 页面显示时更新银行卡余额和列表
onShow(() => {
  console.log('中国银行页面显示，更新银行卡余额和列表')
  // 获取银行卡余额
  bankCardStore.fetchBankCardBalance()
  // 获取银行卡列表
  bankCardStore.fetchBankCards()
})

// 格式化余额显示
const formatBalance = (balance: number | string | undefined | null) => {
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
const handleTransferOut = () => {
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
const confirmRecharge = () => {
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
const fetchDepositTips = () => {
  getDepositTipsAPI().then(res => {
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
  }).catch(error => {
    console.error('获取预存服务提示失败:', error)
    depositTips.value = [] // 确保始终有一个有效数组
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

.card-header-container {
  display: flex;
  align-items: center;
  margin-bottom: 20rpx;
  position: relative;
  z-index: 2;
  padding: 0 30rpx;
}

.bank-logo {
  display: flex;
  align-items: center;
  text-align: center;
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
  border-radius: 20rpx;
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
  border-bottom: 2rpx solid #f0f0f0;
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
  border-bottom: 2rpx solid #e0e0e0;
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

/* 银行卡列表样式 */
.bank-card-list {
  margin-top: 40rpx;
  padding: 0 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 500;
  margin-bottom: 20rpx;
  color: #333;
}

.card-list {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 20rpx 0;
  margin-bottom: 30rpx;
}

.empty-tip {
  padding: 60rpx 0;
  text-align: center;
  color: #999;
  font-size: 28rpx;
}

.visa-card {
  // background: linear-gradient(135deg, #467bec 0%, #214da5 100%);
  border-radius: 20rpx;
  padding: 40rpx;
  margin: 30rpx;
  color: #fff;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
  position: relative;
  height: 160rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}

.card-watermark {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  opacity: 0.07;
  overflow: hidden;
  border-radius: 20rpx;
  pointer-events: none;
  z-index: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.card-watermark image {
  width: 120%;
  height: auto;
  transform: scale(2.2);
  filter: brightness(0) invert(1);
  margin-right: -25%;
  margin-bottom: -15%;
}

.card-bank-name {
  padding-left: 60rpx;
  vertical-align: middle;
  height: 40rpx;
  line-height: 40rpx;
  font-size: 30rpx;
  color: #ffffff;
  font-weight: bold;
  position: relative;
  z-index: 2;
}

.visa-number {
  padding-left: 60rpx;
  font-size: 40rpx;
  letter-spacing: 1rpx;
  color: #ffffff;
  position: relative;
  z-index: 2;
}


.card-icon {
  position: absolute;
  top: 30rpx;
  left: 30rpx;
  width: 60rpx;
  height: 60rpx;
  background-color: rgb(255, 255, 255,0.5);
  border-radius: 50%;
  z-index: 2;
}

.add-card-btn {
  display: flex;
  align-items: center;
  background-color: #fff;
  padding: 30rpx;
  border-radius: 20rpx;
  position: relative;
  margin-top: 40rpx;
}

.add-icon {
  width: 80rpx;
  height: 80rpx;
  background-color: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 48rpx;
  margin-right: 30rpx;
  color: #666;
}

.add-text {
  font-size: 32rpx;
  font-weight: 500;
}

.promotion-text {
  position: absolute;
  right: 30rpx;
  color: #ff6b00;
  font-size: 28rpx;
}

/* 添加银行卡表单样式 */
.add-card-form {
  padding-bottom: 60rpx;
}

.form-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 2rpx solid #f0f0f0;
}

.form-title {
  font-size: 36rpx;
  font-weight: 500;
}

.form-close {
  font-size: 48rpx;
  color: #999;
}

.form-body {
  padding: 30rpx;
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  display: block;
  margin-bottom: 16rpx;
  font-size: 30rpx;
  color: #333;
}

.form-input, .form-picker {
  width: 100%;
  height: 88rpx;
  border: 2rpx solid #e0e0e0;
  border-radius: 8rpx;
  padding: 0 24rpx;
  font-size: 30rpx;
  box-sizing: border-box;
}

.form-picker {
  display: flex;
  align-items: center;
}

.picker-value {
  width: 100%;
  height: 100%;
  display: flex;
  align-items: center;
}

.input-placeholder {
  color: #999;
}

.form-tips {
  margin: 30rpx 0;
  font-size: 24rpx;
  color: #999;
}

.submit-btn {
  width: 100%;
  height: 88rpx;
  background: linear-gradient(90deg, #ff9500, #ff5e3a);
  color: #fff;
  border-radius: 44rpx;
  font-size: 32rpx;
  margin-top: 40rpx;
}

/* 银行选择器样式 */
.bank-selector {
  position: relative;
  width: 100%;
}

.bank-search-input {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  right: 20rpx;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 28rpx;
}

.bank-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: #fff;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  z-index: 999;
  margin-top: 8rpx;
  max-height: 300rpx;
  overflow-y: auto;
}

.bank-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  border-bottom: 2rpx solid #f5f5f5;
}

.bank-item:last-child {
  border-bottom: none;
}

.bank-item:active {
  background-color: #f9f9f9;
}

.bank-icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 16rpx;
}

.bank-name {
  font-size: 28rpx;
  color: #333;
}

.empty-tip {
  padding: 30rpx;
  text-align: center;
  color: #999;
  font-size: 28rpx;
}
</style>