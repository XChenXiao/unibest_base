<template>
  <!-- 充值弹窗 -->
  <wd-popup v-model="showPopup" round position="center">
    <view class="popup-content">
      <view class="popup-header">
        <text class="popup-title">账户充值</text>
        <text class="popup-close" @click="handleClose">×</text>
      </view>
      <view class="popup-body">
        <view class="amount-input-container">
          <text class="amount-label">充值金额</text>
          <view class="amount-input-wrapper">
            <text class="amount-prefix">¥</text>
            <input 
              class="amount-input" 
              type="digit" 
              v-model="amount" 
              placeholder="请输入充值金额"
            />
          </view>
        </view>
        <view class="amount-buttons">
          <view 
            v-for="(quickAmount, index) in quickAmounts" 
            :key="index" 
            class="amount-btn" 
            :class="{ 'amount-btn-active': amount === quickAmount }"
            @click="selectAmount(quickAmount)"
          >
            <text>¥{{ quickAmount }}</text>
          </view>
        </view>
        <button class="confirm-recharge-btn" @click="handleConfirm">确认充值</button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { ref } from 'vue';

// 快捷金额选项
const quickAmounts = ['100', '500', '1000', '5000', '10000', '20000'];

// 定义事件
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', amount: number): void;
}>();

// 弹窗显示状态
const showPopup = ref(false);

// 充值金额
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

// 选择快捷金额
const selectAmount = (quickAmount: string) => {
  amount.value = quickAmount;
};

// 确认充值
const handleConfirm = () => {
  // 输入验证在父组件进行
  emit('confirm', parseFloat(amount.value));
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

/* 金额输入 */
.amount-input-container {
  margin-bottom: 30rpx;
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

/* 快捷金额选择 */
.amount-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 40rpx;
}

.amount-btn {
  width: 170rpx;
  height: 80rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
  font-size: 28rpx;
  color: #666;
}

.amount-btn-active {
  background-color: rgba(243, 156, 18, 0.2);
  color: #f39c12;
  font-weight: 500;
}

/* 确认按钮 */
.confirm-recharge-btn {
  width: 100%;
  height: 90rpx;
  border: none;
  border-radius: 45rpx;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  color: white;
  font-size: 32rpx;
  font-weight: 500;
}
</style> 