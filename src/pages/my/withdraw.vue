<route lang="json5" type="page">
{
  style: {
    navigationBarTitleText: '提现',
    navigationStyle: 'custom',
  },
}
</route>

<template>
  <view class="withdraw-container">
    <!-- 顶部波浪装饰 -->
    <view class="wave-decoration"></view>
    
    <!-- 返回按钮 -->
    <view class="back-button" @click="goBack">
      <wd-icon name="arrow-left" size="36rpx" />
    </view>
    
    <!-- 页面标题 -->
    <view class="page-title">
      <text class="title-text">账户提现</text>
    </view>
    
    <!-- 余额信息 -->
    <view class="balance-info">
      <text class="balance-label">可用余额</text>
      <view class="balance-value">
        <text class="amount-symbol">¥</text>
        <text class="amount-value">{{ formatBalance(userStore.userInfo.balance) }}</text>
      </view>
    </view>
    
    <!-- 提现表单 -->
    <view class="withdraw-form">
      <!-- 提现金额 -->
      <view class="form-item">
        <view class="form-label">提现金额</view>
        <view class="form-input-container">
          <text class="input-prefix">¥</text>
          <input 
            class="form-input" 
            type="digit" 
            v-model="withdrawAmount" 
            placeholder="请输入提现金额"
          />
        </view>
        <view class="withdraw-all" @click="setMaxAmount">全部提现</view>
      </view>
      
      <!-- 银行卡信息 -->
      <view class="form-item bank-info">
        <view class="form-label">提现至</view>
        <view class="bank-card-info" v-if="bankInfo.cardNumber">
          <view class="bank-name">{{ bankInfo.bankName }}</view>
          <view class="card-number">{{ formatCardNumber(bankInfo.cardNumber) }}</view>
        </view>
        <view class="no-bank-card" v-else @click="navigateTo('/pages/my/bank-cards')">
          <text>请先添加银行卡</text>
          <wd-icon name="arrow-right" size="32rpx" />
        </view>
      </view>
      
      <!-- 提现密码 -->
      <view class="form-item">
        <view class="form-label">提现密码</view>
        <view class="form-input-container">
          <input 
            class="form-input" 
            type="text" 
            :password="true"
            v-model="withdrawPassword" 
            placeholder="请输入提现密码"
          />
        </view>
        <view class="forgot-password" @click="navigateTo('/pages/my/reset-withdraw-password')">忘记密码?</view>
      </view>
      
      <!-- 提示信息 -->
      <view class="withdraw-tips">
        <text>1. 提现金额最低100元，每日限额50000元</text>
        <text>2. 提现到账时间为1-2个工作日</text>
        <text>3. 提现手续费为提现金额的0.5%</text>
      </view>
      
      <!-- 提交按钮 -->
      <button class="submit-btn" @click="submitWithdraw" :disabled="!isFormValid">确认提现</button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted } from 'vue';
import { useUserStore } from '@/store/user';
import { withdraw, getUserBankCards } from '@/service/app';

// 获取用户数据存储
const userStore = useUserStore();

// 提现表单数据
const withdrawAmount = ref('');
const withdrawPassword = ref('');

// 银行卡信息
const bankInfo = reactive({
  bankName: '',
  cardNumber: '',
  id: 0
});

// 计算表单是否有效
const isFormValid = computed(() => {
  const amount = Number(withdrawAmount.value);
  return (
    amount >= 100 && 
    amount <= 50000 && 
    amount <= Number(userStore.userInfo.balance) && 
    withdrawPassword.value.length > 0 &&
    bankInfo.cardNumber
  );
});

// 格式化余额显示
const formatBalance = (balance: string | number) => {
  if (!balance) return '0.00';
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  return num.toFixed(2);
};

// 格式化银行卡号显示
const formatCardNumber = (cardNumber: string) => {
  if (!cardNumber) return '';
  // 只显示后四位
  return `**** **** **** ${cardNumber.slice(-4)}`;
};

// 设置最大金额（全部提现）
const setMaxAmount = () => {
  withdrawAmount.value = formatBalance(userStore.userInfo.balance);
};

// 获取银行卡信息
const getBankCardInfo = async () => {
  try {
    const res = await getUserBankCards();
    if (res.status === 'success' && res.data) {
      // 确保data是数组且非空
      if (Array.isArray(res.data) && res.data.length > 0) {
        const defaultCard = res.data[0];
        bankInfo.bankName = defaultCard.bank_name;
        bankInfo.cardNumber = defaultCard.card_number;
        bankInfo.id = defaultCard.id;
      }
    }
  } catch (error) {
    console.error('获取银行卡信息失败:', error);
    uni.showToast({
      title: '获取银行卡信息失败',
      icon: 'none'
    });
  }
};

// 提交提现申请
const submitWithdraw = async () => {
  if (!isFormValid.value) {
    let message = '';
    
    if (!bankInfo.cardNumber) {
      message = '请先添加银行卡';
    } else if (Number(withdrawAmount.value) < 100) {
      message = '提现金额不能低于100元';
    } else if (Number(withdrawAmount.value) > 50000) {
      message = '单笔提现不能超过50000元';
    } else if (Number(withdrawAmount.value) > Number(userStore.userInfo.balance)) {
      message = '余额不足';
    } else if (!withdrawPassword.value) {
      message = '请输入提现密码';
    }
    
    uni.showToast({
      title: message || '表单信息有误',
      icon: 'none'
    });
    return;
  }
  
  // 显示确认对话框
  uni.showModal({
    title: '提现确认',
    content: `确认提现 ¥${withdrawAmount.value} 到 ${bankInfo.bankName}?`,
    success: async (res) => {
      if (res.confirm) {
        try {
          uni.showLoading({
            title: '处理中...'
          });
          
          const response = await withdraw({
            amount: Number(withdrawAmount.value),
            bank_card_id: bankInfo.id,
            withdraw_password: withdrawPassword.value
          });
          
          uni.hideLoading();
          
          if (response.status === 'success') {
            uni.showToast({
              title: '提现申请已提交',
              icon: 'success'
            });
            
            // 刷新用户信息（余额）
            await userStore.fetchUserInfo();
            
            // 返回上一页
            setTimeout(() => {
              goBack();
            }, 1500);
          } else {
            uni.showToast({
              title: response.message || '提现失败',
              icon: 'none'
            });
          }
        } catch (error) {
          uni.hideLoading();
          console.error('提现请求失败:', error);
          uni.showToast({
            title: '提现失败，请重试',
            icon: 'none'
          });
        }
      }
    }
  });
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 页面跳转
const navigateTo = (url: string) => {
  uni.navigateTo({ url });
};

// 页面加载时获取银行卡信息
onMounted(() => {
  getBankCardInfo();
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
.withdraw-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
  padding-bottom: 40rpx;
}

/* 顶部波浪装饰 */
.wave-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 16rpx;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  z-index: 2;
}

/* 返回按钮 */
.back-button {
  position: fixed;
  top: 80rpx;
  left: 30rpx;
  z-index: 100;
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  background-color: rgba(255, 255, 255, 0.8);
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}

/* 页面标题 */
.page-title {
  text-align: center;
  margin: 120rpx 0 40rpx;
}

.title-text {
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
}

/* 余额信息 */
.balance-info {
  padding: 40rpx;
  margin: 0 30rpx 40rpx;
  background-color: white;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
  text-align: center;
}

.balance-label {
  font-size: 28rpx;
  color: #999;
  margin-bottom: 16rpx;
  display: block;
}

.balance-value {
  display: flex;
  justify-content: center;
  align-items: baseline;
}

.amount-symbol {
  font-size: 32rpx;
  color: #333;
  margin-right: 8rpx;
}

.amount-value {
  font-size: 56rpx;
  font-weight: 600;
  color: #333;
}

/* 提现表单 */
.withdraw-form {
  padding: 40rpx 30rpx;
  margin: 0 30rpx;
  background-color: white;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.06);
}

.form-item {
  margin-bottom: 40rpx;
  position: relative;
}

.form-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.form-input-container {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #eee;
  padding-bottom: 16rpx;
}

.input-prefix {
  font-size: 40rpx;
  color: #333;
  margin-right: 16rpx;
}

.form-input {
  flex: 1;
  height: 60rpx;
  line-height: 60rpx;
  font-size: 40rpx;
}

.withdraw-all {
  position: absolute;
  right: 0;
  top: 64rpx;
  font-size: 28rpx;
  color: #3498db;
}

.forgot-password {
  position: absolute;
  right: 0;
  top: 64rpx;
  font-size: 28rpx;
  color: #3498db;
}

/* 银行卡信息 */
.bank-info {
  margin-bottom: 60rpx;
}

.bank-card-info {
  background-color: #f9f9f9;
  padding: 20rpx;
  border-radius: 10rpx;
}

.bank-name {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 10rpx;
}

.card-number {
  font-size: 28rpx;
  color: #666;
}

.no-bank-card {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx;
  background-color: #f9f9f9;
  border-radius: 10rpx;
}

.no-bank-card text {
  font-size: 28rpx;
  color: #666;
}

/* 提示信息 */
.withdraw-tips {
  background-color: #f9f9f9;
  padding: 20rpx;
  border-radius: 10rpx;
  margin-bottom: 50rpx;
}

.withdraw-tips text {
  display: block;
  font-size: 24rpx;
  color: #999;
  line-height: 1.8;
}

/* 提交按钮 */
.submit-btn {
  background: linear-gradient(to right, #3498db, #2980b9);
  color: white;
  font-size: 32rpx;
  font-weight: 500;
  height: 90rpx;
  line-height: 90rpx;
  border-radius: 45rpx;
}

.submit-btn[disabled] {
  background: linear-gradient(to right, #bdc3c7, #95a5a6);
  opacity: 0.8;
}
</style> 