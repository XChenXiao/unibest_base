<route lang="json5">
{
  style: {
    navigationBarTitleText: '货币记录',
  },
}
</route>

<template>
  <view class="records-container">
    <!-- 筛选选项 -->
    <view class="filter-container">
      <view 
        class="filter-item" 
        :class="{ 'active': currentType === 'all' }"
        @click="changeType('all')"
      >
        全部
      </view>
      <view 
        class="filter-item" 
        :class="{ 'active': currentType === 'reward' }"
        @click="changeType('reward')"
      >
        奖励
      </view>
      <view 
        class="filter-item" 
        :class="{ 'active': currentType === 'buy' }"
        @click="changeType('buy')"
      >
        买入
      </view>
      <view 
        class="filter-item" 
        :class="{ 'active': currentType === 'sell' }"
        @click="changeType('sell')"
      >
        卖出
      </view>
    </view>

    <!-- 记录列表 -->
    <view class="records-list">
      <view v-if="loading" class="loading-box">
        <text>加载中...</text>
      </view>
      <template v-else-if="records.length > 0">
        <view 
          class="record-item" 
          v-for="record in records" 
          :key="record.id"
        >
          <view class="record-left">
            <text class="record-desc">{{ record.description ? formatDescription(record.description) : getTypeText(record.type) }}</text>
            <view class="asset-info">
              <text class="asset-name">{{ record.asset_name }}</text>
              <text class="asset-symbol">({{ record.asset_symbol }})</text>
            </view>
            <view class="record-footer">
              <view class="record-tag" :class="`tag-${record.type}`">{{ getTypeText(record.type) }}</view>
              <text class="record-time">{{ formatDate(record.created_at) }}</text>
            </view>
          </view>
          <view class="record-right">
            <text class="record-amount" :class="record.symbol === '+' ? 'amount-green' : 'amount-red'">
              {{ record.symbol }}{{ formatAmount(record.amount) }} {{ record.asset_symbol }}
            </text>
            <text v-if="record.price" class="record-price">单价: ¥{{ formatAmount(record.price) }}</text>
            <text v-if="record.total && record.type !== 'reward'" class="record-total">总额: ¥{{ formatAmount(record.total) }}</text>
          </view>
        </view>
      </template>
      <view v-else class="empty-box">
        <text>暂无记录</text>
      </view>
    </view>

    <!-- 分页加载 -->
    <view class="pagination" v-if="totalPages > 1">
      <view class="load-more" @click="loadMore" v-if="currentPage < totalPages">
        加载更多
      </view>
      <view class="no-more" v-else>
        没有更多数据了
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { getCurrencyTransactions } from '@/service/app/wallet';

// 定义通用的交易记录类型
interface TransactionRecord {
  id: number;
  transaction_no: string;
  type: string;
  type_text: string;
  amount: string;
  asset_name: string;
  asset_symbol: string;
  price?: string;
  fee?: string;
  total?: string;
  status: string;
  status_text: string;
  description: string;
  created_at: string;
  completed_at?: string;
  is_income?: boolean;
  symbol: string; // 标记正负的符号
}

// 当前类型
const currentType = ref<'all' | 'reward' | 'buy' | 'sell'>('all');
// 当前页码
const currentPage = ref(1);
// 每页数量
const perPage = ref(10);
// 总页数
const totalPages = ref(1);
// 加载状态
const loading = ref(false);
// 记录列表
const records = ref<TransactionRecord[]>([]);

// 切换类型
const changeType = (type: 'all' | 'reward' | 'buy' | 'sell') => {
  if (currentType.value === type) return; // 如果点击的是当前类型，不做任何操作
  
  currentType.value = type;
  currentPage.value = 1;
  records.value = [];
  loadRecords();
};

// 加载更多
const loadMore = () => {
  if (currentPage.value < totalPages.value) {
    currentPage.value++;
    loadRecords(true);
  }
};

// 加载记录
const loadRecords = async (append = false) => {
  loading.value = true;
  try {
    const type = currentType.value === 'all' ? undefined : currentType.value;
    const response = await getCurrencyTransactions(
      currentPage.value,
      perPage.value,
      type
    );
    
    if (response.status === 'success' && response.data) {
      // 使用类型断言访问数据
      const responseData = response.data as any;
      
      if (append && Array.isArray(responseData.data)) {
        records.value = [...records.value, ...responseData.data];
      } else if (Array.isArray(responseData.data)) {
        records.value = responseData.data;
      }
      
      // 设置总页数
      if (responseData.pagination && typeof responseData.pagination.total === 'number') {
        totalPages.value = Math.ceil(responseData.pagination.total / perPage.value);
      }
    } else {
      uni.showToast({
        title: response.message || '获取记录失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('获取货币记录失败', error);
    uni.showToast({
      title: '获取记录失败',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

// 获取类型文本
const getTypeText = (type: string) => {
  const typeMap: Record<string, string> = {
    'buy': '买入',
    'sell': '卖出',
    'reward': '奖励',
    'transfer': '转账',
    'recharge': '充值',
    'withdraw': '提现'
  };
  return typeMap[type] || '未知';
};

// 格式化日期
const formatDate = (dateStr: string) => {
  const date = new Date(dateStr);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hours = String(date.getHours()).padStart(2, '0');
  const minutes = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hours}:${minutes}`;
};

// 格式化数量，保留两位小数
const formatAmount = (amount: string | number) => {
  return Number(amount).toFixed(2);
};

// 格式化描述，移除括号字段
const formatDescription = (description: string) => {
  if (!description) return '';
  // 使用正则表达式移除所有括号及其内容
  // 匹配包括中文括号（）、英文括号()、方括号[]、尖括号<>等
  return description.replace(/[\(\[\（\【\<].*?[\)\]\）\】\>]/g, '').trim();
};

// 页面加载时获取数据
onMounted(() => {
  loadRecords();
});
</script>

<style lang="scss" scoped>
.records-container {
  padding: 30rpx;
  min-height: 100vh;
  background-color: #f5f5f5;
}

.filter-container {
  display: flex;
  background-color: #fff;
  border-radius: 16rpx;
  overflow: hidden;
  margin-bottom: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.filter-item {
  flex: 1;
  text-align: center;
  padding: 20rpx 0;
  font-size: 28rpx;
  color: #666;
  position: relative;
}

.filter-item.active {
  color: #3498db;
  font-weight: 500;
}

.filter-item.active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 20%;
  width: 60%;
  height: 4rpx;
  background: linear-gradient(to right, #3498db, #2980b9);
}

.records-list {
  background-color: #fff;
  border-radius: 16rpx;
  padding: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
  min-height: 300rpx;
}

.record-item {
  display: flex;
  justify-content: space-between;
  padding: 30rpx 20rpx;
  border-bottom: 1px solid #f0f0f0;
}

.record-item:last-child {
  border-bottom: none;
}

.record-left {
  flex: 1;
  display: flex;
  flex-direction: column;
  justify-content: center;
}

.record-desc {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 8rpx;
}

.asset-info {
  display: flex;
  align-items: center;
  margin-bottom: 8rpx;
}

.asset-name {
  font-size: 26rpx;
  color: #666;
  margin-right: 6rpx;
}

.asset-symbol {
  font-size: 24rpx;
  color: #999;
}

.record-footer {
  display: flex;
  align-items: center;
}

.record-tag {
  font-size: 22rpx;
  color: #fff;
  padding: 4rpx 12rpx;
  border-radius: 8rpx;
  margin-right: 12rpx;
}

.record-time {
  font-size: 22rpx;
  color: #999;
}

.record-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: center;
  min-width: 200rpx;
}

.record-amount {
  font-size: 32rpx;
  font-weight: 500;
  margin-bottom: 8rpx;
}

.amount-green {
  color: #2ecc71;
}

.amount-red {
  color: #e74c3c;
}

.record-price {
  font-size: 24rpx;
  color: #666;
  margin-bottom: 4rpx;
}

.record-total {
  font-size: 24rpx;
  color: #666;
}

.loading-box, .empty-box {
  padding: 60rpx 0;
  text-align: center;
  color: #999;
  font-size: 28rpx;
}

.pagination {
  margin-top: 30rpx;
  text-align: center;
}

.load-more, .no-more {
  display: inline-block;
  padding: 20rpx 40rpx;
  font-size: 28rpx;
  color: #666;
  background-color: #fff;
  border-radius: 10rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.load-more {
  color: #3498db;
}

.no-more {
  color: #999;
}

// 恢复标签样式
.tag-buy {
  background-color: #2ecc71;
}

.tag-sell {
  background-color: #e74c3c;
}

.tag-reward {
  background-color: #f39c12;
}

.tag-transfer {
  background-color: #3498db;
}

.tag-recharge {
  background-color: #9b59b6;
}

.tag-withdraw {
  background-color: #34495e;
}
</style> 