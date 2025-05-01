<template>
  <!-- 余额卡片 -->
  <view class="balance-card">
    <view class="balance-header">
      <text class="balance-title">账户余额</text>
    </view>
    <view class="balance-amount">
      <text class="amount-symbol">¥</text>
      <text class="amount-value">{{ formatBalance(balance) }}</text>
    </view>
    
    <!-- 操作按钮 -->
    <view class="action-buttons">
      <view class="action-button withdraw-btn" @click="handleWithdraw">
        <text class="uni-icons uniui-download-filled"></text>
        <text class="button-text">提现</text>
      </view>
      <view class="action-button recharge-btn" @click="handleRecharge">
        <text class="uni-icons uniui-upload-filled"></text>
        <text class="button-text">充值</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
// 定义props
const props = defineProps<{
  balance: number | string
}>();

// 定义事件
const emit = defineEmits<{
  (e: 'withdraw'): void
  (e: 'recharge'): void
}>();

// 格式化余额显示
const formatBalance = (balance: number | string) => {
  // 确保余额是数字类型
  const numBalance = typeof balance === 'string' ? parseFloat(balance) : balance;
  
  // 如果是有效数字，则格式化为两位小数
  if (!isNaN(numBalance)) {
    return numBalance.toFixed(2);
  }
  
  // 如果转换失败，返回0.00
  return '0.00';
};

// 处理提现
const handleWithdraw = () => {
  emit('withdraw');
};

// 处理充值
const handleRecharge = () => {
  emit('recharge');
};
</script>

<style lang="scss" scoped>
/* 余额卡片 */
.balance-card {
  background-color: white;
  border-radius: 20rpx;
  margin: 0 30rpx 30rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.balance-header {
  margin-bottom: 20rpx;
}

.balance-title {
  color: #333;
  font-size: 30rpx;
  font-weight: 500;
}

.balance-amount {
  display: flex;
  align-items: baseline;
  margin-bottom: 30rpx;
}

.amount-symbol {
  font-size: 36rpx;
  color: #333;
  margin-right: 8rpx;
}

.amount-value {
  font-size: 60rpx;
  font-weight: 600;
  color: #333;
}

/* 操作按钮 */
.action-buttons {
  display: flex;
  justify-content: space-around;
  border-top: 1px solid #f0f0f0;
  padding-top: 30rpx;
}

.action-button {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0;
  width: 40%;
}

.action-button .uni-icons {
  font-size: 40rpx;
  margin-bottom: 10rpx;
}

.withdraw-btn {
  color: #e74c3c;
}

.recharge-btn {
  color: #3498db;
}

.button-text {
  font-size: 28rpx;
}
</style> 