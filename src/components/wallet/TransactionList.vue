<template>
  <!-- 交易记录 -->
  <view class="transaction-section">
    <view class="section-header">
      <text class="section-title">收支记录</text>
      <text class="view-all" @click="$emit('viewAll')">查看全部</text>
    </view>
    
    <!-- 记录类型选择 -->
    <view class="type-selector">
      <view 
        v-for="(type, index) in transactionTypes" 
        :key="index"
        class="type-item"
        :class="{ 'type-active': activeType === type.value }"
        @click="switchType(type.value)"
      >
        <text>{{ type.label }}</text>
      </view>
    </view>
    
    <!-- 记录列表 -->
    <view class="transaction-list">
      <view 
        v-for="(item, index) in filteredTransactions" 
        :key="index"
        class="transaction-item"
      >
        <view class="transaction-icon" :class="getIconClass(item.type)">
          <text class="uni-icons" :class="getIconName(item.type)"></text>
        </view>
        <view class="transaction-info">
          <text class="transaction-title">{{ item.title }}</text>
          <text class="transaction-time">{{ item.time }}</text>
        </view>
        <view class="transaction-amount" :class="{ 'amount-income': item.isIncome }">
          <text>{{ item.isIncome ? '+' : '-' }}{{ item.amount }}</text>
        </view>
      </view>
      
      <!-- 空状态 -->
      <view v-if="filteredTransactions.length === 0" class="empty-state">
        <text class="empty-text">暂无相关记录</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

// 定义交易记录类型
interface Transaction {
  id: number;
  title: string;
  type: string;
  isIncome: boolean;
  amount: string;
  time: string;
}

// 定义props
const props = defineProps<{
  transactions: Transaction[]
}>();

// 定义事件
const emit = defineEmits<{
  (e: 'viewAll'): void
}>();

// 交易类型
const transactionTypes = [
  { label: '全部', value: 'all' },
  { label: '收入', value: 'income' },
  { label: '支出', value: 'expense' },
  { label: '提现', value: 'withdraw' }
];

// 当前选中的交易类型
const activeType = ref('all');

// 根据类型筛选交易记录
const filteredTransactions = computed(() => {
  if (activeType.value === 'all') {
    return props.transactions;
  } else {
    return props.transactions.filter(item => item.type === activeType.value);
  }
});

// 切换交易记录类型
const switchType = (type: string) => {
  activeType.value = type;
};

// 获取交易类型图标样式
const getIconClass = (type: string) => {
  switch (type) {
    case 'income':
      return 'icon-income';
    case 'expense':
      return 'icon-expense';
    case 'withdraw':
      return 'icon-withdraw';
    default:
      return '';
  }
};

// 获取交易类型图标名称
const getIconName = (type: string) => {
  switch (type) {
    case 'income':
      return 'uniui-arrow-down';
    case 'expense':
      return 'uniui-arrow-up';
    case 'withdraw':
      return 'uniui-download-filled';
    default:
      return '';
  }
};
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
}

.transaction-title {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 6rpx;
  display: block;
}

.transaction-time {
  font-size: 24rpx;
  color: #999;
}

.transaction-amount {
  font-size: 30rpx;
  font-weight: 500;
  color: #e74c3c;
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