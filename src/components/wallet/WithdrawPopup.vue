<template>
  <!-- 提现弹窗 -->
  <wd-popup v-model="showPopup" round position="center">
    <view class="popup-content">
      <view class="popup-header">
        <text class="popup-title">账户提现</text>
        <text class="popup-close" @click="handleClose">×</text>
      </view>
      <view class="popup-body">
        <view class="bank-info">
          <text class="bank-name">{{ bankName }}</text>
          <text class="bank-number">{{ maskedBankNumber }}</text>
        </view>
        
        <view class="amount-input-container">
          <text class="amount-label">提现金额</text>
          <view class="amount-input-wrapper">
            <text class="amount-prefix">¥</text>
            <input 
              class="amount-input" 
              type="digit" 
              v-model="amount" 
              placeholder="请输入提现金额"
            />
          </view>
          <text class="amount-available">可用余额: ¥{{ formatBalance(balance) }}</text>
        </view>
        
        <view class="password-input-container">
          <text class="password-label">提现密码</text>
          <view class="password-input-wrapper">
            <input 
              class="password-input" 
              type="password" 
              maxlength="6" 
              password 
              v-model="password" 
              placeholder="请输入6位提现密码"
            />
          </view>
        </view>
        
        <button class="confirm-withdraw-btn" @click="handleConfirm">确认提现</button>
        <text class="withdraw-note">提现申请将在1-3个工作日内处理完成</text>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

// 定义props
const props = defineProps<{
  balance: number;
  bankName: string;
  bankNumber: string;
}>();

// 定义事件
const emit = defineEmits<{
  (e: 'close'): void;
  (e: 'confirm', amount: number, password: string): void;
}>();

// 弹窗显示状态
const showPopup = ref(false);

// 提现金额和密码
const amount = ref('');
const password = ref('');

// 格式化余额显示
const formatBalance = (balance: number) => {
  return balance.toFixed(2);
};

// 银行卡号脱敏
const maskedBankNumber = computed(() => {
  if (!props.bankNumber) return '';
  return props.bankNumber.replace(/^(\d{4})\d+(\d{4})$/, '$1 **** **** $2');
});

// 打开弹窗
const open = () => {
  amount.value = '';
  password.value = '';
  showPopup.value = true;
};

// 关闭弹窗
const handleClose = () => {
  showPopup.value = false;
  emit('close');
};

// 确认提现
const handleConfirm = () => {
  // 输入验证在父组件进行
  emit('confirm', parseFloat(amount.value), password.value);
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

/* 银行卡信息 */
.bank-info {
  background-color: #f8f8f8;
  border-radius: 10rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
}

.bank-name {
  font-size: 28rpx;
  color: #333;
  margin-bottom: 10rpx;
  display: block;
}

.bank-number {
  font-size: 30rpx;
  color: #666;
  font-family: monospace;
}

/* 金额输入 */
.amount-input-container {
  margin-bottom: 30rpx;
}

.amount-label, .password-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
  display: block;
}

.amount-input-wrapper, .password-input-wrapper {
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

.amount-input, .password-input {
  flex: 1;
  height: 80rpx;
  font-size: 36rpx;
}

.amount-available {
  font-size: 24rpx;
  color: #999;
  margin-top: 10rpx;
  text-align: right;
}

/* 密码输入 */
.password-input-container {
  margin-bottom: 40rpx;
}

/* 确认按钮 */
.confirm-withdraw-btn {
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

.withdraw-note {
  font-size: 24rpx;
  color: #999;
  text-align: center;
}
</style> 