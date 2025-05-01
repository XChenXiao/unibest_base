<template>
  <!-- 资产总览卡片 -->
  <view class="total-assets-card">
    <view class="card-header">
      <text class="card-title">总资产(元)</text>
      <view class="visibility-toggle" @click="toggleVisibility">
        <text class="uni-icons" :class="[showAssets ? 'uniui-eye-filled' : 'uniui-eye-slash-filled']"></text>
      </view>
    </view>
    <view class="assets-amount" v-if="showAssets">
      <text class="amount-value">{{ formatAmount(totalAssets) }}</text>
    </view>
    <view class="assets-amount" v-else>
      <text class="amount-hidden">******</text>
    </view>
    
    <!-- 资产明细 -->
    <view class="assets-breakdown">
      <view class="breakdown-item">
        <text class="breakdown-label">货币总资产</text>
        <text class="breakdown-value" v-if="showAssets">{{ formatAmount(currencyAssets) }}</text>
        <text class="breakdown-value" v-else>******</text>
      </view>
      <view class="breakdown-item">
        <text class="breakdown-label">股权总资产</text>
        <text class="breakdown-value" v-if="showAssets">{{ formatAmount(equityAssets) }}</text>
        <text class="breakdown-value" v-else>******</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  totalAssets: {
    type: Number,
    required: true
  },
  currencyAssets: {
    type: Number,
    required: true
  },
  equityAssets: {
    type: Number,
    required: true
  },
  showAssets: {
    type: Boolean,
    default: true
  }
});

const emit = defineEmits(['toggle-visibility']);

// 切换资产可见性
const toggleVisibility = () => {
  emit('toggle-visibility');
};

// 格式化金额
const formatAmount = (amount: number) => {
  return Number(amount).toFixed(2);
};
</script>

<style lang="scss" scoped>
/* 资产总览卡片 */
.total-assets-card {
  background: linear-gradient(135deg, #ffffff, #f8f9fa);
  border-radius: 20rpx;
  margin: 0 30rpx 30rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  border: 1px solid rgba(255, 255, 255, 0.8);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.card-title {
  color: #666;
  font-size: 28rpx;
}

.visibility-toggle {
  padding: 10rpx;
}

.visibility-toggle .uni-icons {
  font-size: 36rpx;
  color: #999;
}

.assets-amount {
  margin-bottom: 30rpx;
}

.amount-value {
  font-size: 60rpx;
  font-weight: 600;
  color: #333;
}

.amount-hidden {
  font-size: 60rpx;
  font-weight: 600;
  color: #333;
  letter-spacing: 5rpx;
}

/* 资产明细 */
.assets-breakdown {
  display: flex;
  justify-content: space-around;
  border-top: 1px solid #f0f0f0;
  padding-top: 20rpx;
}

.breakdown-item {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.breakdown-label {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.breakdown-value {
  font-size: 36rpx;
  font-weight: 500;
  color: #333;
}
</style> 