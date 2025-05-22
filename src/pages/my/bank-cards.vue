<route lang="json5" type="page">
{
  style: {
    navigationBarTitleText: '银行卡管理',
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
    <!-- 顶部卡片 -->
    <!-- <view class="card-top">
      <view class="card-top-title">
        网商银行卡
        <text class="activation-status" :class="{'status-processing': isProcessing}">
          {{ isActivated ? '已激活' : isProcessing ? '审核中' : '未激活' }}
        </text>
      </view>
      
      <view class="card-balance">
        <view class="balance-label">当前余额</view>
        <view class="balance-amount">{{ balance }}</view>
        <view class="balance-card-info" v-if="defaultCard">{{ defaultCard.bank_name }} **** {{ defaultCard.masked_card_number.slice(-4) }}</view>
      </view>
    </view>
     -->
    <!-- 激活区域 - 未激活且未申请中 -->
    <view class="card-activation" v-if="!isActivated && !isProcessing">
      <view class="activation-title">激活银行卡</view>
      <view class="activation-fee">
        激活银行卡需要缴纳 {{ bankCardStatus.open_fee || 10 }} 人民币作为预存金
      </view>
      <button class="btn-activate" @click="goToApply">立即激活</button>
    </view>

    <!-- 审核中状态提示 -->
    <view class="review-status" v-if="isProcessing">
      <view class="review-icon">
        <text class="iconfont icon-time"></text>
      </view>
      <view class="review-title">申请审核中</view>
      <view class="review-desc">
        您的银行卡开户申请已提交，正在审核中
        <text class="review-time">预计审核时间：1-3个工作日</text>
      </view>
    </view>

    <!-- 卡片管理区域 -->
    <view class="card-container" v-if="isActivated">
      <!-- 添加卡片表单 -->
      <view class="card-form" v-if="showAddCardForm">
        <view class="form-title">添加银行卡</view>
        <view class="form-group">
          <text class="form-label">持卡人姓名</text>
          <input
            type="text"
            class="form-input"
            v-model="newCard.card_holder"
            placeholder="请输入持卡人姓名"
            placeholder-class="input-placeholder"
          />
        </view>
        <view class="form-group">
          <text class="form-label">银行名称</text>
          <input
            type="text"
            class="form-input"
            v-model="newCard.bank_name"
            placeholder="请输入银行名称"
            placeholder-class="input-placeholder"
          />
        </view>
        <view class="form-group">
          <text class="form-label">银行卡号</text>
          <input
            type="text"
            class="form-input"
            v-model="newCard.card_number"
            placeholder="请输入完整的银行卡号"
            placeholder-class="input-placeholder"
          />
        </view>
        <!-- <view class="form-group">
          <text class="form-label">支行名称(可选)</text>
          <input type="text" class="form-input" v-model="newCard.branch_name" placeholder="请输入支行名称" placeholder-class="input-placeholder" />
        </view> -->
        <view class="form-actions">
          <button class="btn-cancel" @click="cancelAddCard">取消</button>
          <button class="btn-save" @click="saveCard">保存</button>
        </view>
      </view>

      <!-- 添加卡片按钮 -->
      <button class="add-card-btn" @click="showAddCardForm = true" v-else>+ 添加银行卡</button>

      <!-- 卡片列表区域 -->
      <view class="card-list" v-if="cards.length > 0">
        <view class="bank-card" v-for="card in cards" :key="card.id">
          <view class="card-header">
            <view class="card-bank-name">{{ card.bank_name }}</view>
            <text class="card-default-tag" v-if="card.is_default">默认</text>
          </view>
          <view class="card-holder-name">{{ card.card_holder }}</view>
          <view class="card-number">{{ card.masked_card_number }}</view>
          <view class="card-actions">
            <button class="btn-default" @click="setAsDefault(card.id)" :disabled="card.is_default">
              设为默认
            </button>
            <button class="btn-delete" @click="confirmDeleteCard(card.id)">删除</button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, reactive, onUnmounted } from 'vue'
import { useUserStore } from '@/store'
import {
  checkBankCardStatusAPI as getBankCardStatusAPI,
  getBankCardsAPI,
  addBankCardAPI,
  deleteBankCardAPI,
  setDefaultBankCardAPI,
  IBankCard,
} from '@/service/index/bankcard'

// 用户数据
const userStore = useUserStore()

// 银行卡数据状态
const loading = ref(false)
const cards = ref<IBankCard[]>([])
const bankCardStatus = reactive({
  has_bank_card: false,
  bank_card_opened_at: null as string | null,
  latest_application: null as null | {
    id: number
    status: string
    status_text: string
    created_at: string
    reviewed_at: string | null
    remarks: string | null
  },
  open_fee: 0,
  can_apply: false,
})

// 计算属性
const isActivated = computed(() => bankCardStatus.has_bank_card)
const isProcessing = computed(() => {
  return (
    bankCardStatus.latest_application !== null &&
    bankCardStatus.latest_application.status === 'pending'
  )
})
const defaultCard = computed(() => {
  return cards.value.find((card) => card.is_default)
})

// 余额信息 - 实际项目中应从用户信息获取
const balance = computed(() => {
  if (!userStore.userInfo.balance) return '¥ 0.00'
  return `¥ ${userStore.userInfo.balance.toFixed(2)}`
})

// 新卡表单数据
const showAddCardForm = ref(false)
const newCard = ref({
  bank_name: '',
  card_number: '',
  card_holder: '',
  branch_name: '',
})

// 在页面加载时获取银行卡状态和卡片列表
onMounted(async () => {
  await fetchBankCardStatus()
  if (isActivated.value) {
    await fetchBankCards()
  }

  // 添加事件监听器，用于从申请页面返回时刷新数据
  uni.$on('refresh-bank-cards', refreshData)
})

// 在页面卸载时移除事件监听器
onUnmounted(() => {
  uni.$off('refresh-bank-cards', refreshData)
})

// 刷新数据函数
const refreshData = async () => {
  console.log('正在刷新银行卡数据...')
  await fetchBankCardStatus()
  if (isActivated.value) {
    await fetchBankCards()
  }
}

// 获取银行卡状态
const fetchBankCardStatus = async () => {
  loading.value = true
  try {
    const res = await getBankCardStatusAPI()
    if (res.status === 'success' && res.data) {
      // 获取响应中的data字段内容
      const statusData = res.data

      // 类型断言处理，因为实际返回的数据结构与接口定义不同
      const bankCardData = statusData as unknown as {
        has_bank_card: boolean
        bank_card_opened_at: string | null
        latest_application: null | {
          id: number
          status: string
          status_text: string
          created_at: string
          reviewed_at: string | null
          remarks: string | null
        }
        open_fee: string | number
        can_apply: boolean
      }

      // 确保从后端获取的open_fee是数字类型
      if (typeof bankCardData.open_fee === 'string') {
        bankCardData.open_fee = parseFloat(bankCardData.open_fee)
      }

      Object.assign(bankCardStatus, bankCardData)
      console.log('获取银行卡状态成功:', bankCardStatus)
    }
  } catch (error) {
    console.error('获取银行卡状态失败:', error)
    uni.showToast({
      title: '获取状态失败',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

// 获取银行卡列表
const fetchBankCards = async () => {
  loading.value = true
  try {
    const res = await getBankCardsAPI()
    if (res.status === 'success' && Array.isArray(res.data)) {
      cards.value = res.data
      console.log('获取银行卡列表成功:', cards.value)
    }
  } catch (error) {
    console.error('获取银行卡列表失败:', error)
    uni.showToast({
      title: '获取卡片失败',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

// 跳转到开户申请页面
const goToApply = () => {
  // 传递当前银行卡开户费用
  uni.navigateTo({
    url: `/pages/my/bank-account-apply?fee=${bankCardStatus.open_fee || 0}`,
  })
}

// 取消添加卡片
const cancelAddCard = () => {
  showAddCardForm.value = false
  // 清空表单
  newCard.value = {
    bank_name: '',
    card_number: '',
    card_holder: '',
    branch_name: '',
  }
}

// 保存卡片
const saveCard = async () => {
  // 表单验证
  if (!newCard.value.bank_name) {
    uni.showToast({
      title: '请输入银行名称',
      icon: 'none',
    })
    return
  }

  if (!newCard.value.card_holder) {
    uni.showToast({
      title: '请输入持卡人姓名',
      icon: 'none',
    })
    return
  }

  if (!newCard.value.card_number) {
    uni.showToast({
      title: '请输入银行卡号',
      icon: 'none',
    })
    return
  }

  if (newCard.value.card_number.length < 12) {
    uni.showToast({
      title: '银行卡号格式不正确',
      icon: 'none',
    })
    return
  }

  loading.value = true
  try {
    const res = await addBankCardAPI(newCard.value)
    console.log('添加银行卡响应:', res)

    // 添加成功
    uni.showToast({
      title: '添加成功',
      icon: 'success',
    })

    // 刷新卡片列表
    await fetchBankCards()

    // 清空表单并隐藏
    cancelAddCard()
  } catch (error: any) {
    console.error('添加银行卡失败:', error)

    // HTTP模块已经处理了错误提示，此处不需要额外显示错误信息
    // 在某些情况下，如果错误没有被拦截器处理，则显示默认错误信息
    if (error.hideErrorToast) {
      uni.showToast({
        title: '添加失败，请检查输入信息',
        icon: 'none',
      })
    }
  } finally {
    loading.value = false
  }
}

// 设置默认卡
const setAsDefault = async (id: number) => {
  loading.value = true
  try {
    const res = await setDefaultBankCardAPI(id)
    if (res.status === 'success') {
      uni.showToast({
        title: '已设为默认卡',
        icon: 'success',
      })

      // 刷新卡片列表
      await fetchBankCards()
    } else {
      uni.showToast({
        title: res.message || '设置失败',
        icon: 'none',
      })
    }
  } catch (error: any) {
    console.error('设置默认卡失败:', error)
    uni.showToast({
      title: error.message || '设置失败',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

// 确认删除卡片
const confirmDeleteCard = (id: number) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这张银行卡吗？',
    success: (res) => {
      if (res.confirm) {
        deleteCard(id)
      }
    },
  })
}

// 删除卡片
const deleteCard = async (id: number) => {
  loading.value = true
  try {
    const res = await deleteBankCardAPI(id)
    if (res.status === 'success') {
      uni.showToast({
        title: '删除成功',
        icon: 'success',
      })

      // 刷新卡片列表
      await fetchBankCards()
    } else {
      uni.showToast({
        title: res.message || '删除失败',
        icon: 'none',
      })
    }
  } catch (error: any) {
    console.error('删除银行卡失败:', error)
    uni.showToast({
      title: error.message || '删除失败',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}
</script>

<style lang="scss" scoped>
.container {
  width: 100%;
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 30rpx;
  box-sizing: border-box;
}

.card-top {
  width: 100%;
  border-radius: 20rpx;
  background-color: #6b7280;
  color: white;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-sizing: border-box;
}

.card-top-title {
  font-size: 32rpx;
  margin-bottom: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-balance {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 20rpx;
  border-radius: 12rpx;
}

.balance-label {
  font-size: 24rpx;
  opacity: 0.8;
}

.balance-amount {
  font-size: 48rpx;
  margin-top: 4rpx;
  font-weight: 500;
}

.balance-card-info {
  margin-top: 12rpx;
  font-size: 24rpx;
}

.card-activation {
  width: 100%;
  background-color: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-sizing: border-box;
}

.activation-title {
  text-align: center;
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
}

.activation-fee {
  background-color: #fffbeb;
  padding: 20rpx;
  margin-bottom: 20rpx;
  text-align: center;
  border-radius: 12rpx;
}

.btn-activate {
  width: 100%;
  background-color: #3b82f6;
  color: white;
  padding: 20rpx 0;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
  box-shadow: 0 4rpx 6rpx rgba(59, 130, 246, 0.3);
}

.card-container {
  width: 100%;
}

.bank-card {
  background-color: white;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.05);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12rpx;
}

.card-bank-name {
  font-weight: bold;
  font-size: 28rpx;
}

.card-default-tag {
  color: #10b981;
  font-size: 24rpx;
}

.card-holder-name {
  color: #6b7280;
  margin-bottom: 4rpx;
  font-size: 24rpx;
}

.card-number {
  color: #6b7280;
  margin-bottom: 16rpx;
  font-size: 24rpx;
}

.card-actions {
  display: flex;
  justify-content: space-between;
}

.btn-default {
  width: 48%;
  padding: 10rpx 0;
  border-radius: 8rpx;
  border: none;
  background-color: #eff6ff;
  color: #3b82f6;
  font-size: 24rpx;
  text-align: center;
}

.btn-default:disabled {
  background-color: #f3f4f6;
  color: #9ca3af;
}

.btn-delete {
  width: 48%;
  padding: 10rpx 0;
  border-radius: 8rpx;
  border: none;
  background-color: #fee2e2;
  color: #ef4444;
  font-size: 24rpx;
  text-align: center;
}

.add-card-btn {
  width: 100%;
  border: 2rpx dashed #d1d5db;
  padding: 24rpx 0;
  border-radius: 16rpx;
  text-align: center;
  color: #6b7280;
  background-color: #ffffff;
  margin-bottom: 20rpx;
  font-size: 28rpx;
}

.card-form {
  background-color: white;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.form-title {
  font-size: 32rpx;
  text-align: center;
  margin-bottom: 20rpx;
  font-weight: bold;
}

.form-group {
  margin-bottom: 20rpx;
}

.form-label {
  display: block;
  color: #4b5563;
  margin-bottom: 6rpx;
  font-size: 24rpx;
}

.form-input {
  width: 100%;
  border: 1rpx solid #e5e7eb;
  border-radius: 8rpx;
  padding: 12rpx 16rpx;
  background-color: #ffffff;
  font-size: 28rpx;
  box-sizing: border-box;
  height: 80rpx;
  color: #333333;
}

.input-placeholder {
  color: #9ca3af;
  font-size: 28rpx;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 30rpx;
}

.btn-cancel {
  width: 45%;
  padding: 12rpx 0;
  background-color: #e5e7eb;
  border: none;
  border-radius: 12rpx;
  color: #4b5563;
  font-size: 28rpx;
  text-align: center;
}

.btn-save {
  width: 45%;
  padding: 12rpx 0;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
  text-align: center;
}

.activation-status {
  font-size: 24rpx;
  opacity: 0.8;
}

.status-processing {
  color: #f59e0b;
}

/* 审核中状态提示样式 */
.review-status {
  width: 100%;
  background-color: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-sizing: border-box;
  text-align: center;
}

.review-icon {
  font-size: 60rpx;
  color: #f59e0b;
  margin-bottom: 16rpx;
}

.review-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.review-desc {
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.6;
}

.review-time {
  display: block;
  color: #f59e0b;
  margin-top: 8rpx;
}

/* 图标字体 */
.iconfont {
  font-family: 'iconfont' !important;
}
.icon-time:before {
  content: '\e65f';
}
</style>
