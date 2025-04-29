<template>
  <view class="currency-list">
    <view 
      class="currency-item"
      v-for="(currency, index) in currencyList"
      :key="index"
      @click="gotoTrading(currency)"
    >
      <view class="currency-icon" :style="{ backgroundColor: currency.bgColor }">
        <text class="currency-icon-text">{{ currency.symbol.charAt(0) }}</text>
      </view>
      <view class="currency-info">
        <text class="currency-name">{{ currency.name }}</text>
        <text class="currency-symbol">{{ currency.symbol }}</text>
      </view>
      <view class="currency-details">
        <text class="currency-price">¥{{ formatAmount(currency.price) }}</text>
        <text class="currency-amount">持有: {{ formatAmount(currency.holdAmount) }}</text>
      </view>
      <text class="uni-icons uniui-arrow-right currency-arrow"></text>
    </view>
    
    <!-- 空状态 -->
    <view v-if="currencyList.length === 0" class="empty-state">
      <text class="empty-text">您暂无持有货币资产</text>
      <button class="go-trading-btn" @click="gotoTrading()">前往交易所</button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  currencyList: {
    type: Array,
    default: () => []
  }
});

const emit = defineEmits(['goto-trading']);

// 前往交易所
const gotoTrading = (currency?: any) => {
  emit('goto-trading', currency);
};

// 格式化金额显示
const formatAmount = (amount: number) => {
  return amount.toFixed(2);
};
</script>

<style lang="scss" scoped>
.currency-list {
  min-height: 400rpx;
}

.currency-item {
  display: flex;
  align-items: center;
  padding: 30rpx 0;
  border-bottom: 1px solid #f0f0f0;
}

.currency-item:last-child {
  border-bottom: none;
}

.currency-icon {
  width: 90rpx;
  height: 90rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
  font-weight: bold;
}

.currency-icon-text {
  font-size: 40rpx;
  color: #333;
}

.currency-info {
  flex: 1;
}

.currency-name {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 6rpx;
  display: block;
}

.currency-symbol {
  font-size: 24rpx;
  color: #999;
}

.currency-details {
  display: flex;
  flex-direction: column;
  align-items: flex-end;
  margin-right: 20rpx;
}

.currency-price {
  font-size: 30rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 6rpx;
}

.currency-amount {
  font-size: 24rpx;
  color: #999;
}

.currency-arrow {
  color: #ccc;
  font-size: 28rpx;
}

/* 空状态 */
.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
}

.empty-text {
  color: #999;
  font-size: 28rpx;
  margin-bottom: 30rpx;
}

.go-trading-btn {
  background: linear-gradient(to right, #f39c12, #e74c3c);
  color: white;
  font-size: 28rpx;
  padding: 15rpx 40rpx;
  border-radius: 40rpx;
  border: none;
}
</style> 