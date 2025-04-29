<template>
  <!-- 出售股权弹窗 -->
  <wd-popup v-model="showPopup" round position="center">
    <view class="popup-content">
      <view class="popup-header">
        <text class="popup-title">出售股权</text>
        <text class="popup-close" @click="handleClose">×</text>
      </view>
      <view class="popup-body">
        <view class="equity-info-row">
          <text class="info-label">持有股权:</text>
          <text class="info-value">{{ formatAmount(equityInfo.holdAmount) }}股</text>
        </view>
        <view class="equity-info-row">
          <text class="info-label">股权单价:</text>
          <text class="info-value">¥{{ formatAmount(equityInfo.price) }}/股</text>
        </view>
        
        <view class="amount-input-container">
          <text class="amount-label">出售数量</text>
          <view class="amount-input-wrapper">
            <input 
              class="amount-input" 
              type="digit" 
              v-model="amount" 
              placeholder="请输入出售股权数量"
            />
            <text class="input-unit">股</text>
          </view>
        </view>
        
        <view class="sell-info">
          <text class="sell-price-label">预计获得金额:</text>
          <text class="sell-price-value">¥{{ calculateSellPrice() }}</text>
        </view>
        
        <button class="confirm-sell-btn" @click="handleConfirm">确认出售</button>
        <text class="sell-note">出售后资金将直接到账至您的余额</text>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

// 定义props
const props = defineProps<{
  equityInfo: {
    holdAmount: number;
    price: number;
  };
}>();

// 定义事件
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', amount: number): void;
  (e: 'update:model-value', value: boolean): void;
}>();

// 弹窗显示状态
const showPopup = ref(false);

// 出售数量
const amount = ref('');

// 打开弹窗
const open = () => {
  amount.value = '';
  showPopup.value = true;
};

// 关闭弹窗
const handleClose = () => {
  showPopup.value = false;
  emit('close');
};

// 确认出售
const handleConfirm = () => {
  // 输入验证
  if (!amount.value || parseFloat(amount.value) <= 0) {
    uni.showToast({
      title: '请输入有效的出售数量',
      icon: 'none'
    });
    return;
  }
  
  const sellQuantity = parseFloat(amount.value);
  
  // 验证持有数量是否充足
  if (sellQuantity > props.equityInfo.holdAmount) {
    uni.showToast({
      title: '持有股权不足',
      icon: 'none'
    });
    return;
  }
  
  emit('confirm', sellQuantity);
};

// 计算出售预计金额
const calculateSellPrice = () => {
  const sellQuantity = parseFloat(amount.value) || 0;
  return (sellQuantity * props.equityInfo.price).toFixed(2);
};

// 格式化金额显示
const formatAmount = (amount: number) => {
  return amount.toFixed(2);
};

// 向父组件暴露方法
defineExpose({
  open,
  handleClose
});
</script>

<style lang="scss" scoped>
/* 弹窗样式 */
.popup-content {
  width: 600rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1px solid #f0f0f0;
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

.equity-info-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.info-label {
  font-size: 28rpx;
  color: #666;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

.amount-input-container {
  margin: 30rpx 0;
}

.amount-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
  display: block;
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 10rpx;
}

.amount-input {
  flex: 1;
  height: 80rpx;
  font-size: 36rpx;
}

.input-unit {
  font-size: 28rpx;
  color: #666;
  margin-left: 10rpx;
}

.sell-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
  padding: 20rpx;
  background-color: #f8f8f8;
  border-radius: 10rpx;
}

.sell-price-label {
  font-size: 28rpx;
  color: #666;
}

.sell-price-value {
  font-size: 32rpx;
  color: #f39c12;
  font-weight: 500;
}

.confirm-sell-btn {
  width: 100%;
  height: 90rpx;
  border: none;
  border-radius: 45rpx;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  color: white;
  font-size: 32rpx;
  font-weight: 500;
  margin-bottom: 20rpx;
}

.sell-note {
  font-size: 24rpx;
  color: #999;
  text-align: center;
}
</style> 