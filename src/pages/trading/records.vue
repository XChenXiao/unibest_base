<route lang="json5">
{
  style: {
    navigationBarTitleText: '交易记录',
  },
}
</route>

<template>
  <view class="records-container">
    <!-- 筛选选项 -->
    <view class="filter-section">
      <view class="filter-tabs">
        <view 
          class="filter-tab-item" 
          :class="{ 'filter-tab-active': activeFilter === 'all' }"
          @click="switchFilter('all')"
        >
          <text>全部</text>
        </view>
        <view 
          class="filter-tab-item" 
          :class="{ 'filter-tab-active': activeFilter === 'buy' }"
          @click="switchFilter('buy')"
        >
          <text>买入</text>
        </view>
        <view 
          class="filter-tab-item" 
          :class="{ 'filter-tab-active': activeFilter === 'sell' }"
          @click="switchFilter('sell')"
        >
          <text>卖出</text>
        </view>
      </view>
      
    </view>
    
    <!-- 交易记录列表 -->
    <view class="records-list">
      <view 
        v-for="(item, index) in records" 
        :key="index"
        class="record-item"
      >
        <view class="record-left">
          <view class="record-icon" :class="getIconClass(item.type)">
            <text class="icon-text">{{ getIconText(item.type) }}</text>
          </view>
        </view>
        
        <view class="record-center">
          <text class="record-name">{{ item.asset_name }} ({{ item.asset_symbol }})</text>
          <text class="record-time">{{ item.created_at }}</text>
          <view class="record-details">
            <text class="detail-label">{{ getTypeText(item.type) }}价:</text>
            <text class="detail-value">¥{{ formatAmount(item.price) }}</text>
            <text class="detail-label">数量:</text>
            <text class="detail-value">{{ formatAmount(item.amount) }}{{ item.asset_symbol }}</text>
          </view>
        </view>
        
        <view class="record-right">
          <text class="record-total" :class="getAmountColorClass(item.type)">
            {{ getAmountPrefix(item.type) }}¥{{ formatAmount(item.total) }}
          </text>
          <text class="record-status" :class="getStatusClass(item.status)">{{ item.status_text }}</text>
        </view>
      </view>
      
      <!-- 加载更多 -->
      <view v-if="hasMore" class="load-more" @click="loadMore">
        <text class="load-more-text">加载更多</text>
      </view>
      
      <!-- 空状态 -->
      <view v-if="records.length === 0" class="empty-state">
        <text class="empty-text">暂无交易记录</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue';

// 筛选条件
const activeFilter = ref('all');
const startDate = ref('');
const endDate = ref('');
const currentPage = ref(1);
const perPage = ref(10);
const hasMore = ref(true);
const isLoading = ref(false);

// 交易记录数据
const records = ref([]);

// 获取交易记录
const fetchRecords = async (loadMore = false) => {
  if (isLoading.value) return;
  
  isLoading.value = true;
  
  try {
    const params = {
      page: loadMore ? currentPage.value + 1 : 1,
      per_page: perPage.value,
      type: activeFilter.value !== 'all' ? activeFilter.value : undefined,
      start_date: startDate.value || undefined,
      end_date: endDate.value || undefined
    };
    
    // API调用获取交易记录
    const response = await uni.request({
      url: '/api/user/records/currency',
      method: 'GET',
      data: params
    });
    
    if (response.statusCode === 200) {
      const responseData = response.data as any;
      
      if (loadMore) {
        records.value = [...records.value, ...responseData.data.data];
      } else {
        records.value = responseData.data.data;
      }
      
      // 更新分页信息
      currentPage.value = responseData.data.pagination.current_page;
      hasMore.value = currentPage.value < responseData.data.pagination.last_page;
    } else {
      uni.showToast({
        title: '获取交易记录失败',
        icon: 'none'
      });
    }
  } catch (error) {
    console.error('获取交易记录出错:', error);
    uni.showToast({
      title: '获取交易记录出错',
      icon: 'none'
    });
  } finally {
    isLoading.value = false;
  }
};

// 加载更多记录
const loadMore = () => {
  if (hasMore.value && !isLoading.value) {
    fetchRecords(true);
  }
};

// 切换筛选标签
const switchFilter = (filter) => {
  if (activeFilter.value === filter) return;
  
  activeFilter.value = filter;
  fetchRecords();
};

// 显示日期选择器
const showDatePicker = (type) => {
  uni.showToast({
    title: `选择${type === 'start' ? '开始' : '结束'}日期`,
    icon: 'none'
  });
  
  // 实际项目中需要替换为适合的日期选择器
  uni.showModal({
    title: '日期选择',
    content: `请选择${type === 'start' ? '开始' : '结束'}日期`,
    success: (res) => {
      if (res.confirm) {
        // 这里仅作演示，实际项目中应当使用日期选择器
        const currentDate = new Date();
        const formattedDate = `${currentDate.getFullYear()}-${(currentDate.getMonth() + 1).toString().padStart(2, '0')}-${currentDate.getDate().toString().padStart(2, '0')}`;
        
        if (type === 'start') {
          startDate.value = formattedDate;
        } else {
          endDate.value = formattedDate;
        }
        
        fetchRecords();
      }
    }
  });
};

// 格式化金额显示
const formatAmount = (amount) => {
  if (!amount) return '0.00';
  
  const num = typeof amount === 'string' ? parseFloat(amount) : amount;
  return num.toFixed(2);
};

// 获取交易类型图标样式
const getIconClass = (type) => {
  const classes = {
    buy: 'buy-icon',
    sell: 'sell-icon',
    transfer: 'transfer-icon',
    reward: 'reward-icon',
    recharge: 'recharge-icon',
    withdraw: 'withdraw-icon'
  };
  
  return classes[type] || 'buy-icon';
};

// 获取交易类型图标文本
const getIconText = (type) => {
  const texts = {
    buy: '买',
    sell: '卖',
    transfer: '转',
    reward: '奖',
    recharge: '充',
    withdraw: '提'
  };
  
  return texts[type] || '买';
};

// 获取交易类型文本
const getTypeText = (type) => {
  const texts = {
    buy: '买入',
    sell: '卖出',
    transfer: '转账',
    reward: '奖励',
    recharge: '充值',
    withdraw: '提现'
  };
  
  return texts[type] || '交易';
};

// 获取金额前缀
const getAmountPrefix = (type) => {
  return ['buy', 'withdraw'].includes(type) ? '-' : '+';
};

// 获取金额颜色样式
const getAmountColorClass = (type) => {
  return ['buy', 'withdraw'].includes(type) ? 'buy-color' : 'sell-color';
};

// 获取状态样式
const getStatusClass = (status) => {
  const classes = {
    completed: 'status-completed',
    pending: 'status-pending',
    failed: 'status-failed',
    cancelled: 'status-cancelled',
    claimable: 'status-claimable'
  };
  
  return classes[status] || 'status-completed';
};

// 初始化
onMounted(() => {
  fetchRecords();
});
</script>

<style lang="scss">
/* 全局重置 */
page {
  background-color: #f5f5f5;
  height: 100%;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

/* 容器样式 */
.records-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}

/* 筛选区域 */
.filter-section {
  background-color: #ffffff;
  padding: 20rpx 30rpx 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 20rpx;
}

/* 筛选标签 */
.filter-tabs {
  display: flex;
  background-color: #f0f0f0;
  border-radius: 10rpx;
  overflow: hidden;
  margin-bottom: 20rpx;
}

.filter-tab-item {
  flex: 1;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  color: #666;
}

.filter-tab-active {
  background: linear-gradient(135deg, #f39c12, #e74c3c);
  color: white;
  font-weight: 500;
}

/* 日期筛选 */
.date-filter {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 20rpx 0;
}

.date-picker {
  flex: 1;
  background-color: #f9f9f9;
  border-radius: 8rpx;
  padding: 16rpx 20rpx;
  display: flex;
  flex-direction: column;
}

.date-label {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 8rpx;
}

.date-value {
  font-size: 28rpx;
  color: #333;
}

.date-separator {
  padding: 0 20rpx;
  color: #999;
  font-size: 28rpx;
}

/* 记录列表 */
.records-list {
  flex: 1;
  padding: 0 30rpx;
}

.record-item {
  display: flex;
  background-color: white;
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.04);
}

.record-left {
  margin-right: 20rpx;
}

.record-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.buy-icon {
  background-color: rgba(243, 156, 18, 0.1);
}

.sell-icon {
  background-color: rgba(52, 152, 219, 0.1);
}

.transfer-icon {
  background-color: rgba(155, 89, 182, 0.1);
}

.reward-icon {
  background-color: rgba(46, 204, 113, 0.1);
}

.recharge-icon {
  background-color: rgba(52, 152, 219, 0.1);
}

.withdraw-icon {
  background-color: rgba(231, 76, 60, 0.1);
}

.icon-text {
  font-size: 30rpx;
  font-weight: bold;
}

.buy-icon .icon-text {
  color: #f39c12;
}

.sell-icon .icon-text {
  color: #3498db;
}

.transfer-icon .icon-text {
  color: #9b59b6;
}

.reward-icon .icon-text {
  color: #2ecc71;
}

.recharge-icon .icon-text {
  color: #3498db;
}

.withdraw-icon .icon-text {
  color: #e74c3c;
}

.record-center {
  flex: 1;
  display: flex;
  flex-direction: column;
}

.record-name {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 8rpx;
}

.record-time {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 16rpx;
}

.record-details {
  display: flex;
  flex-wrap: wrap;
  align-items: center;
}

.detail-label {
  font-size: 24rpx;
  color: #666;
  margin-right: 8rpx;
}

.detail-value {
  font-size: 24rpx;
  color: #333;
  margin-right: 20rpx;
}

.record-right {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  justify-content: space-between;
}

.record-total {
  font-size: 32rpx;
  font-weight: 600;
  margin-bottom: 10rpx;
}

.buy-color {
  color: #e74c3c;
}

.sell-color {
  color: #2ecc71;
}

.record-status {
  font-size: 24rpx;
  padding: 4rpx 12rpx;
  border-radius: 20rpx;
}

.status-completed {
  color: #27ae60;
  background-color: rgba(46, 204, 113, 0.1);
}

.status-pending {
  color: #f39c12;
  background-color: rgba(243, 156, 18, 0.1);
}

.status-failed {
  color: #e74c3c;
  background-color: rgba(231, 76, 60, 0.1);
}

.status-cancelled {
  color: #7f8c8d;
  background-color: rgba(127, 140, 141, 0.1);
}

.status-claimable {
  color: #3498db;
  background-color: rgba(52, 152, 219, 0.1);
}

/* 加载更多 */
.load-more {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 30rpx 0;
}

.load-more-text {
  font-size: 28rpx;
  color: #666;
}

/* 空状态 */
.empty-state {
  display: flex;
  justify-content: center;
  align-items: center;
  padding: 100rpx 0;
}

.empty-text {
  color: #999;
  font-size: 28rpx;
}
</style> 