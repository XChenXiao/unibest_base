<route lang="json5" type="page">
{
  style: {
    navigationBarTitleText: '修改提现密码',
    navigationBarBackgroundColor: '#f5f5f5',
    navigationBarTextStyle: 'black',
    'app-plus': {
      titleNView: {
        titleSize: '16px',
        titleWeight: 'bold',
        titleAlign: 'center'
      }
    }
  },
}
</route>

<template>
  <view class="container">
    <!-- 表单 -->
    <view class="reset-form">
      <!-- 当前提现密码 -->
      <view class="form-item">
        <text class="form-label">当前提现密码</text>
        <input 
          class="form-input" 
          type="text" 
          password 
          :maxlength="6"
          v-model="formData.currentPassword" 
          placeholder="请输入当前提现密码"
        />
      </view>
      
      <!-- 新提现密码 -->
      <view class="form-item">
        <text class="form-label">新提现密码</text>
        <input 
          class="form-input" 
          type="text" 
          password 
          :maxlength="6"
          v-model="formData.newPassword" 
          placeholder="请输入6位数字密码"
        />
      </view>
      
      <!-- 确认新提现密码 -->
      <view class="form-item">
        <text class="form-label">确认新提现密码</text>
        <input 
          class="form-input" 
          type="text" 
          password 
          :maxlength="6"
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
import { reactive } from 'vue';
import { resetWithdrawPassword } from '@/service/app/user';

// 表单数据
const formData = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 提交表单
const submitForm = async () => {
  // 表单验证
  if (!formData.currentPassword) {
    uni.showToast({
      title: '请输入当前提现密码',
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
  
  try {
    // 调用API进行密码修改
    const result = await resetWithdrawPassword({
      data: {
        current_password: formData.currentPassword,
        new_password: formData.newPassword
      }
    });
    
    uni.hideLoading();
    
    if (result.status === 'success') {
      uni.showToast({
        title: result.message || '提现密码修改成功',
        icon: 'success',
        duration: 2000,
        success: () => {
          // 成功后返回上一页
          setTimeout(() => {
            uni.navigateBack();
          }, 2000);
        }
      });
    } else {
      uni.showToast({
        title: result.message || '修改失败，请稍后重试',
        icon: 'none'
      });
    }
  } catch (error: any) {
    uni.hideLoading();
    uni.showToast({
      title: error.message || '网络错误，请稍后重试',
      icon: 'none'
    });
  }
};
</script>

<style lang="scss">
/* 全局重置 */
page {
  background-color: #f5f5f5;
  height: 100%;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

.container {
  padding: 30rpx;
}

/* 表单 */
.reset-form {
  background-color: white;
  border-radius: 20rpx;
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