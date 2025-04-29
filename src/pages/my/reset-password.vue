<template>
  <view class="reset-password-container">
    <!-- 顶部波浪装饰 -->
    <view class="wave-decoration"></view>
    
    <!-- 返回按钮 -->
    <view class="back-button" @click="goBack">
      <text class="uni-icons uniui-arrow-left"></text>
    </view>
    
    <!-- 页面标题 -->
    <view class="page-title">
      <text class="title-text">修改登录密码</text>
    </view>
    
    <!-- 表单 -->
    <view class="reset-form">
      <!-- 原密码 -->
      <view class="form-item">
        <text class="form-label">原密码</text>
        <input 
          class="form-input" 
          type="password" 
          v-model="formData.oldPassword" 
          placeholder="请输入原密码"
        />
      </view>
      
      <!-- 新密码 -->
      <view class="form-item">
        <text class="form-label">新密码</text>
        <input 
          class="form-input" 
          type="password" 
          v-model="formData.newPassword" 
          placeholder="请输入新密码"
        />
      </view>
      
      <!-- 确认新密码 -->
      <view class="form-item">
        <text class="form-label">确认新密码</text>
        <input 
          class="form-input" 
          type="password" 
          v-model="formData.confirmPassword" 
          placeholder="请再次输入新密码"
        />
      </view>
      
      <!-- 提交按钮 -->
      <button class="submit-btn" @click="submitForm">确认修改</button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { reactive } from 'vue';

// 表单数据
const formData = reactive({
  oldPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 提交表单
const submitForm = () => {
  // 表单验证
  if (!formData.oldPassword) {
    uni.showToast({
      title: '请输入原密码',
      icon: 'none'
    });
    return;
  }
  
  if (!formData.newPassword) {
    uni.showToast({
      title: '请输入新密码',
      icon: 'none'
    });
    return;
  }
  
  if (formData.newPassword.length < 6) {
    uni.showToast({
      title: '新密码长度不能少于6位',
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
      title: '密码修改成功',
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
</script>

<style lang="scss">
/* 全局重置 */
page {
  background-color: #f5f5f5;
  height: 100%;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

/* 容器样式 */
.reset-password-container {
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