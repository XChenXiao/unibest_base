<route lang="json5">
{
  style: {
    navigationBarTitleText: '转到支付宝',
  },
}
</route>

<template>
  <view class="alipay-transfer-container">
    <!-- 返回按钮 -->
    <view class="back-button" @click="goBack">
      <wd-icon name="arrow-left" size="36rpx" />
    </view>
    
    <!-- 页面标题 -->
    <view class="page-title">
      <text class="title-text">转到支付宝</text>
    </view>
    
    <!-- 转账表单 -->
    <view class="form-card">
      <view class="form-item">
        <view class="form-label">支付宝账号</view>
        <view class="form-input-wrapper">
          <input
            class="form-input"
            type="text"
            v-model="alipayAccount"
            placeholder="请输入支付宝账号/手机号"
          />
          <wd-icon v-if="alipayAccount" name="close-circle" @click="clearAlipayAccount" size="36rpx" color="#999" />
        </view>
      </view>
      
      <view class="form-item">
        <view class="form-label">转账金额</view>
        <view class="amount-input-container">
          <text class="amount-prefix">¥</text>
          <input
            class="amount-input"
            type="digit"
            v-model="transferAmount"
            placeholder="请输入转账金额"
          />
        </view>
        <view class="amount-info">
          <text>可用余额: ¥{{ formatBalance(accountBalance) }}</text>
          <text class="amount-all" @click="setMaxAmount">全部转出</text>
        </view>
      </view>
      
      <!-- 提交按钮 -->
      <button class="submit-button" :disabled="!isFormValid" @click="handleSubmit">确定转出</button>
      
      <!-- 转账说明 -->
      <view class="transfer-notes">
        <view class="note-item">
          <text class="note-dot">•</text>
          <text class="note-text">免手续费，单笔最高2万元，单日最高5万元</text>
        </view>
        <view class="note-item">
          <text class="note-dot">•</text>
          <text class="note-text">转账成功后资金将实时到账至对方支付宝账户</text>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';
import { useUserStore } from '@/store/user';

// 用户store
const userStore = useUserStore();

// 账户余额
const accountBalance = ref(userStore.userInfo.balance || 0);

// 支付宝账号
const alipayAccount = ref('');

// 转账金额
const transferAmount = ref('');

// 判断表单是否有效
const isFormValid = computed(() => {
  const amount = Number(transferAmount.value);
  return (
    alipayAccount.value.length > 0 &&
    amount > 0 &&
    amount <= accountBalance.value
  );
});

// 格式化金额显示
const formatBalance = (balance: number | string) => {
  if (!balance) return '0.00';
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  return num.toFixed(2);
};

// 清除支付宝账号
const clearAlipayAccount = () => {
  alipayAccount.value = '';
};

// 设置最大金额
const setMaxAmount = () => {
  transferAmount.value = formatBalance(accountBalance.value);
};

// 处理提交
const handleSubmit = () => {
  if (!isFormValid.value) {
    uni.showToast({
      title: '请完善转账信息',
      icon: 'none'
    });
    return;
  }
  
  uni.showModal({
    title: '确认转账',
    content: `确定要向支付宝账号 ${alipayAccount.value} 转账¥${transferAmount.value}吗？`,
    success: (res) => {
      if (res.confirm) {
        // 在实际项目中这里应该调用转账API
        uni.showLoading({
          title: '处理中...'
        });
        
        // 模拟API调用
        setTimeout(() => {
          uni.hideLoading();
          uni.showToast({
            title: '转账成功',
            icon: 'success'
          });
          
          // 转账成功后返回上一页
          setTimeout(() => {
            uni.navigateBack();
          }, 1500);
        }, 1500);
      }
    }
  });
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};
</script>

<style lang="scss">
page {
  background-color: #f5f5f5;
  min-height: 100%;
}

.alipay-transfer-container {
  padding: 30rpx;
}

/* 返回按钮 */
.back-button {
  margin-bottom: 30rpx;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 页面标题 */
.page-title {
  margin-bottom: 40rpx;
}

.title-text {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
}

/* 表单卡片 */
.form-card {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.form-item {
  margin-bottom: 40rpx;
}

.form-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.form-input-wrapper {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 15rpx;
}

.form-input {
  flex: 1;
  height: 80rpx;
  font-size: 34rpx;
}

/* 金额输入 */
.amount-input-container {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 15rpx;
  margin-bottom: 10rpx;
}

.amount-prefix {
  font-size: 40rpx;
  color: #333;
  margin-right: 10rpx;
}

.amount-input {
  flex: 1;
  height: 80rpx;
  font-size: 34rpx;
}

.amount-info {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: #999;
}

.amount-all {
  color: #1890ff;
}

/* 提交按钮 */
.submit-button {
  width: 100%;
  height: 90rpx;
  border-radius: 45rpx;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 500;
  background: linear-gradient(to right, #108ee9, #1890ff);
  margin: 40rpx 0;
}

.submit-button[disabled] {
  background: #cccccc;
  color: #ffffff;
}

/* 转账说明 */
.transfer-notes {
  margin-top: 20rpx;
}

.note-item {
  display: flex;
  margin-bottom: 10rpx;
}

.note-dot {
  margin-right: 10rpx;
  color: #999;
}

.note-text {
  font-size: 24rpx;
  color: #999;
  flex: 1;
}
</style> 