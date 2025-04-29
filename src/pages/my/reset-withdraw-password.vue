<template>
  <view class="reset-withdraw-password-container">
    <!-- 顶部波浪装饰 -->
    <view class="wave-decoration"></view>
    
    <!-- 返回按钮 -->
    <view class="back-button" @click="goBack">
      <text class="uni-icons uniui-arrow-left"></text>
    </view>
    
    <!-- 页面标题 -->
    <view class="page-title">
      <text class="title-text">修改提现密码</text>
    </view>
    
    <!-- 表单 -->
    <view class="reset-form">
      <!-- 手机号 -->
      <view class="form-item">
        <text class="form-label">手机号</text>
        <input 
          class="form-input" 
          type="number" 
          v-model="formData.phone" 
          placeholder="请输入手机号码"
          disabled
        />
      </view>
      
      <!-- 验证码 -->
      <view class="form-item code-form-item">
        <text class="form-label">验证码</text>
        <view class="code-input-wrapper">
          <input 
            class="form-input code-input" 
            type="number" 
            v-model="formData.verificationCode" 
            placeholder="请输入验证码"
          />
          <button class="get-code-btn" @click="getVerificationCode" :disabled="isCounting">
            {{ countDown > 0 ? `${countDown}秒后重发` : '获取验证码' }}
          </button>
        </view>
      </view>
      
      <!-- 新提现密码 -->
      <view class="form-item">
        <text class="form-label">新提现密码</text>
        <input 
          class="form-input" 
          type="password" 
          password 
          maxlength="6"
          v-model="formData.newPassword" 
          placeholder="请输入6位数字密码"
        />
      </view>
      
      <!-- 确认新提现密码 -->
      <view class="form-item">
        <text class="form-label">确认新提现密码</text>
        <input 
          class="form-input" 
          type="password" 
          password 
          maxlength="6"
          v-model="formData.confirmPassword" 
          placeholder="请再次输入新提现密码"
        />
      </view>
      
      <!-- 提交按钮 -->
      <button class="submit-btn" @click="submitForm">确认修改</button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { reactive, ref, onMounted } from 'vue';
import { useUserStore } from '@/store/user';

// 获取用户数据存储
const userStore = useUserStore();

// 表单数据
const formData = reactive({
  phone: '',
  verificationCode: '',
  newPassword: '',
  confirmPassword: ''
});

// 倒计时
const countDown = ref(0);
const isCounting = ref(false);
let timer: number | null = null;

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 获取验证码
const getVerificationCode = () => {
  if (isCounting.value) return;
  
  if (!formData.phone) {
    uni.showToast({
      title: '请输入手机号码',
      icon: 'none'
    });
    return;
  }
  
  // 显示加载状态
  uni.showLoading({
    title: '发送中...'
  });
  
  // 这里替换为实际的API调用
  setTimeout(() => {
    uni.hideLoading();
    
    // 模拟发送成功
    uni.showToast({
      title: '验证码已发送',
      icon: 'success'
    });
    
    // 开始倒计时
    startCountDown();
  }, 1000);
};

// 开始倒计时
const startCountDown = () => {
  countDown.value = 60;
  isCounting.value = true;
  
  timer = setInterval(() => {
    if (countDown.value > 0) {
      countDown.value--;
    } else {
      clearInterval(timer as number);
      isCounting.value = false;
    }
  }, 1000) as unknown as number;
};

// 提交表单
const submitForm = () => {
  // 表单验证
  if (!formData.verificationCode) {
    uni.showToast({
      title: '请输入验证码',
      icon: 'none'
    });
    return;
  }
  
  if (!formData.newPassword) {
    uni.showToast({
      title: '请输入新提现密码',
      icon: 'none'
    });
    return;
  }
  
  if (formData.newPassword.length !== 6) {
    uni.showToast({
      title: '提现密码必须为6位数字',
      icon: 'none'
    });
    return;
  }
  
  if (formData.newPassword !== formData.confirmPassword) {
    uni.showToast({
      title: '两次输入的密码不一致',
      icon: 'none'
    });
    return;
  }
  
  // 显示加载状态
  uni.showLoading({
    title: '提交中...'
  });
  
  // 这里替换为实际的API调用
  setTimeout(() => {
    uni.hideLoading();
    
    // 模拟修改成功
    uni.showToast({
      title: '提现密码修改成功',
      icon: 'success',
      duration: 2000,
      success: () => {
        // 成功后返回上一页
        setTimeout(() => {
          uni.navigateBack();
        }, 2000);
      }
    });
  }, 1500);
};

// 页面加载
onMounted(() => {
  // 填充手机号
  if (userStore.userInfo && userStore.userInfo.phone) {
    formData.phone = userStore.userInfo.phone;
  }
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
.reset-withdraw-password-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
}

/* 顶部波浪装饰 */
.wave-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 16rpx;
  background: linear-gradient(to right, #f39c12, #e74c3c);
}

/* 返回按钮 */
.back-button {
  position: absolute;
  top: 60rpx;
  left: 20rpx;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: #333;
  z-index: 10;
}

/* 页面标题 */
.page-title {
  text-align: center;
  margin-top: 130rpx;
  margin-bottom: 40rpx;
}

.title-text {
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
}

/* 表单 */
.reset-form {
  background-color: white;
  border-radius: 20rpx;
  margin: 0 30rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 15rpx;
  display: block;
}

.form-input {
  width: 100%;
  height: 90rpx;
  background-color: #f9f9f9;
  border-radius: 45rpx;
  padding: 0 30rpx;
  font-size: 28rpx;
  color: #333;
  box-sizing: border-box;
}

.code-form-item {
  position: relative;
}

.code-input-wrapper {
  display: flex;
  align-items: center;
}

.code-input {
  flex: 1;
  margin-right: 20rpx;
}

.get-code-btn {
  min-width: 220rpx;
  height: 90rpx;
  border: none;
  border-radius: 45rpx;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  color: white;
  font-size: 28rpx;
  padding: 0 20rpx;
}

.get-code-btn[disabled] {
  background: #cccccc;
  color: #ffffff;
}

.submit-btn {
  width: 100%;
  height: 90rpx;
  border: none;
  border-radius: 45rpx;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  color: white;
  font-size: 32rpx;
  font-weight: 500;
  margin-top: 40rpx;
}
</style> 