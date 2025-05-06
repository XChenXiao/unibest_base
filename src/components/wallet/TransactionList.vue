<template>
  <!-- 交易记录区域 -->
  <view class="transaction-section">
    <!-- 区域标题 -->
    <view class="section-header">
      <text class="section-title">收支记录</text>
    </view>

    <!-- 交易类型选择器 -->
    <view class="type-selector">
      <view
        v-for="(item, index) in transactionTypes"
        :key="index"
        class="type-item"
        :class="{ 'type-active': activeType === item.value }"
        @click="changeType(item.value)"
      >
        {{ item.label }}
      </view>
    </view>

    <!-- 交易记录列表 -->
    <view class="transaction-list">
      <!-- 加载中状态 -->
      <view v-if="loading" class="empty-state">
        <text class="empty-text">加载中...</text>
      </view>

      <!-- 空记录状态 -->
      <view v-else-if="filteredTransactions.length === 0" class="empty-state">
        <text class="empty-text">暂无收支记录</text>
      </view>

      <!-- 交易记录 -->
      <view v-else v-for="item in filteredTransactions" :key="item.id" class="transaction-item">
        <!-- 交易图标 -->
        <view
          class="transaction-icon"
          :class="{
            'icon-income': item.is_income,
            'icon-expense': !item.is_income && item.type !== 'withdraw',
            'icon-withdraw': item.type === 'withdraw',
          }"
        >
          <text
            class="uni-icons"
            :class="{
              'uniui-arrow-down': item.is_income,
              'uniui-arrow-up': !item.is_income && item.type !== 'withdraw',
              'uniui-wallet-filled': item.type === 'withdraw',
            }"
          ></text>
        </view>

        <!-- 交易信息 -->
        <view class="transaction-info">
          <text class="transaction-title">{{ item.title }}</text>
          <text class="transaction-time">{{ item.time }}</text>
        </view>

        <!-- 交易金额 -->
        <view class="transaction-amount" :class="{ 'amount-income': item.is_income }">
          <text>{{ item.is_income ? '+' : '-' }}{{ item.amount }}</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { getBalanceTransactions } from '@/service/app/wallet'

// 定义交易记录类型
interface Transaction {
  id: number
  title: string // 用于显示的标题，从description获取
  original_type: string // 原始类型
  type: string // 前端使用的类型分类
  is_income: boolean // 是否收入
  amount: string
  time: string
}

// 定义props
const props = defineProps({
  transactionData: {
    type: Array as () => Transaction[],
    default: () => [],
  },
  useLocalData: {
    type: Boolean,
    default: false,
  },
})

// 定义事件
const emit = defineEmits(['viewAll'])

// 交易类型
const transactionTypes = [
  { label: '全部', value: 'all' },
  { label: '收入', value: 'income' },
  { label: '支出', value: 'expense' },
  { label: '提现', value: 'withdraw' },
]

// 当前选中的交易类型
const activeType = ref('all')

// 交易记录数据
const transactions = ref<Transaction[]>([])

// 数据加载状态
const loading = ref(false)

// 获取交易记录数据
const fetchTransactions = async () => {
  loading.value = true
  try {
    const response = await getBalanceTransactions(1, 10)

    if (response?.status === 'success' && response.data?.data) {
      const recordsData = response.data.data

      // 格式化交易记录数据
      const formattedRecords: Transaction[] = []

      // 确保recordsData是数组
      if (Array.isArray(recordsData)) {
        for (const record of recordsData) {
          // 根据记录类型映射为前端所需的类型
          let frontendType = record.is_income ? 'income' : 'expense'
          if (record.type === 'withdraw') {
            frontendType = 'withdraw'
          }

          // 优先使用description作为标题
          const title = record.description || record.type_text || '交易记录'

          formattedRecords.push({
            id: record.id,
            title: title,
            original_type: record.type,
            type: frontendType,
            is_income: record.is_income || false,
            amount: record.amount || '0',
            time: record.created_at || '',
          })
        }
      }

      transactions.value = formattedRecords
    } else {
      transactions.value = []
    }
  } catch (error) {
    console.error('获取余额变动记录失败:', error)
    uni.showToast({
      title: '获取余额变动记录失败',
      icon: 'none',
    })
    transactions.value = []
  } finally {
    loading.value = false
  }
}

// 切换交易类型
const changeType = (type: string) => {
  activeType.value = type
}

// 查看全部记录
const viewAllRecords = () => {
  emit('viewAll')
}

// 刷新交易记录
const refreshTransactions = () => {
  fetchTransactions()
}

// 根据类型筛选交易记录
const filteredTransactions = computed(() => {
  // 使用本地数据还是API数据
  const dataSource = props.useLocalData ? props.transactionData : transactions.value

  if (activeType.value === 'all') {
    return dataSource
  } else {
    return dataSource.filter((transaction) => transaction.type === activeType.value)
  }
})

// 组件挂载后执行
onMounted(() => {
  if (!props.useLocalData) {
    fetchTransactions()
  }
})

defineExpose({
  refreshTransactions,
})
</script>

<style lang="scss" scoped>
/* 交易记录区域 */
.transaction-section {
  background-color: white;
  border-radius: 20rpx;
  margin: 0 30rpx 30rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
}

.view-all {
  font-size: 26rpx;
  color: #3498db;
}

/* 类型选择器 */
.type-selector {
  display: flex;
  margin-bottom: 20rpx;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 15rpx;
}

.type-item {
  padding: 10rpx 20rpx;
  margin-right: 15rpx;
  font-size: 26rpx;
  color: #666;
  border-radius: 30rpx;
}

.type-active {
  background-color: rgba(243, 156, 18, 0.1);
  color: #f39c12;
  font-weight: 500;
}

/* 交易记录列表 */
.transaction-list {
  max-height: 700rpx;
  overflow-y: auto;
}

.transaction-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1px solid #f0f0f0;
}

.transaction-item:last-child {
  border-bottom: none;
}

.transaction-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.icon-income {
  background-color: rgba(46, 204, 113, 0.15);
}

.icon-income .uni-icons {
  color: #2ecc71;
}

.icon-expense {
  background-color: rgba(231, 76, 60, 0.15);
}

.icon-expense .uni-icons {
  color: #e74c3c;
}

.icon-withdraw {
  background-color: rgba(155, 89, 182, 0.15);
}

.icon-withdraw .uni-icons {
  color: #9b59b6;
}

.transaction-info {
  flex: 1;
  min-width: 0; /* 确保内容可以正确截断 */
}

.transaction-title {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 6rpx;
  display: block;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

.transaction-time {
  font-size: 24rpx;
  color: #999;
}

.transaction-amount {
  font-size: 30rpx;
  font-weight: 500;
  color: #e74c3c;
  margin-left: 10rpx;
  flex-shrink: 0;
}

.amount-income {
  color: #2ecc71;
}

/* 空状态 */
.empty-state {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 300rpx;
}

.empty-text {
  color: #999;
  font-size: 28rpx;
}
</style>
