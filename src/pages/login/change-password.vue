<route lang="json5">
{
  style: {
    navigationBarTitleText: '修改密码',
  },
}
</route>
<template>
  <view class="change-container">
    <!-- 顶部波浪装饰 -->
    <view class="wave-decoration"></view>
    
    <!-- 返回按钮 -->
    <view class="back-button" @click="goBack">
      <text class="uni-icons uniui-arrow-left"></text>
    </view>
    
    <!-- 页面标题 -->
    <view class="page-title">
      <text class="title-text">修改密码</text>
      <text class="subtitle-text">设置新的安全密码</text>
    </view>
    
    <!-- 修改密码表单 -->
    <view class="change-form">
      <!-- 当前密码 -->
      <view class="form-group">
        <text class="form-label">当前密码</text>
        <view class="input-container">
          <text class="uni-icons uniui-locked-filled"></text>
          <input 
            class="form-control" 
            type="safe-password"
            placeholder="请输入当前密码"
            v-model="formData.currentPassword"
          />
          <text 
            class="uni-icons password-toggle" 
            :class="[showCurrentPassword ? 'uniui-eye-filled' : 'uniui-eye-slash-filled']"
            @click="toggleCurrentPasswordVisibility"
          ></text>
        </view>
      </view>
      
      <!-- 新密码 -->
      <view class="form-group">
        <text class="form-label">新密码</text>
        <view class="input-container">
          <text class="uni-icons uniui-locked-filled"></text>
          <input 
            class="form-control" 
            type="safe-password"
            placeholder="请设置新密码"
            v-model="formData.newPassword"
          />
          <text 
            class="uni-icons password-toggle" 
            :class="[showNewPassword ? 'uniui-eye-filled' : 'uniui-eye-slash-filled']"
            @click="toggleNewPasswordVisibility"
          ></text>
        </view>
      </view>
      
      <!-- 确认新密码 -->
      <view class="form-group">
        <text class="form-label">确认新密码</text>
        <view class="input-container">
          <text class="uni-icons uniui-locked-filled"></text>
          <input 
            class="form-control" 
            type="safe-password"
            placeholder="请再次输入新密码"
            v-model="formData.confirmPassword"
          />
          <text 
            class="uni-icons password-toggle" 
            :class="[showConfirmPassword ? 'uniui-eye-filled' : 'uniui-eye-slash-filled']"
            @click="toggleConfirmPasswordVisibility"
          ></text>
        </view>
      </view>
      
      <!-- 提交按钮 -->
      <button class="submit-btn" @click="handleSubmit">确认修改</button>
    </view>
    
    <!-- 底部版权信息 -->
    <view class="change-footer">
      <text></text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { resetPasswordAPI } from '@/service/index/auth';

// 表单数据
const formData = reactive({
  currentPassword: '',
  newPassword: '',
  confirmPassword: ''
});

// 控制密码可见性
const showCurrentPassword = ref(false);
const showNewPassword = ref(false);
const showConfirmPassword = ref(false);

// 切换密码可见性
const toggleCurrentPasswordVisibility = () => {
  showCurrentPassword.value = !showCurrentPassword.value;
};

const toggleNewPasswordVisibility = () => {
  showNewPassword.value = !showNewPassword.value;
};

const toggleConfirmPasswordVisibility = () => {
  showConfirmPassword.value = !showConfirmPassword.value;
};

// 修改密码处理
const handleSubmit = async () => {
  // 表单验证
  if (!formData.currentPassword.trim()) {
    uni.showToast({
      title: '请输入当前密码',
      icon: 'none'
    });
    return;
  }
  
  if (!formData.newPassword.trim()) {
    uni.showToast({
      title: '请设置新密码',
      icon: 'none'
    });
    return;
  }
  
  if (formData.newPassword.length < 6) {
    uni.showToast({
      title: '密码长度不能少于6位',
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
  
  // 执行密码修改
  try {
    // 显示加载状态
    uni.showLoading({
      title: '提交中...'
    });
    
    // 调用重置密码API
    const res = await resetPasswordAPI({
      current_password: formData.currentPassword,
      new_password: formData.newPassword,
      new_password_confirmation: formData.confirmPassword
    });
    
    uni.hideLoading();
    
    if (res.status === 'success') {
      // 修改成功
      uni.showToast({
        title: '密码修改成功',
        icon: 'success',
        duration: 2000,
        success: () => {
          setTimeout(() => {
            uni.navigateBack();
          }, 2000);
        }
      });
    } else {
      uni.showToast({
        title: res.message || '修改失败，请重试',
        icon: 'none'
      });
    }
  } catch (error: any) {
    uni.hideLoading();
    // 检查错误对象中是否包含后端返回的信息
    if (error.response && error.response.data) {
      uni.showToast({
        title: error.response.data.message || '修改失败，请重试',
        icon: 'none'
      });
    } else {
      uni.showToast({
        title: error?.message || '修改失败，请重试',
        icon: 'none'
      });
    }
  }
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};
</script>

<style lang="scss">
/* 全局重置 */
page {
  background: linear-gradient(135deg, #3498db, #1a5276);
  height: 100%;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

/* 容器样式 */
.change-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 0 30rpx;
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
  color: white;
  z-index: 10;
}

/* 页面标题 */
.page-title {
  text-align: center;
  margin-top: 130rpx;
  margin-bottom: 40rpx;
}

.title-text {
  font-size: 48rpx;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 10rpx;
  display: block;
}

.subtitle-text {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 修改密码表单 */
.change-form {
  background-color: white;
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.15);
}

/* 表单组 */
.form-group {
  margin-bottom: 25rpx;
}

/* 表单标签 */
.form-label {
  display: block;
  color: #555;
  margin-bottom: 14rpx;
  font-size: 28rpx;
  font-weight: 500;
}

/* 输入框容器 */
.input-container {
  position: relative;
  display: flex;
  align-items: center;
}

/* 输入框图标 */
.uni-icons {
  position: absolute;
  left: 20rpx;
  color: #aaa;
  font-size: 36rpx;
}

/* 输入框 */
.form-control {
  width: 100%;
  height: 90rpx;
  border: 1px solid #e0e0e0;
  border-radius: 45rpx;
  padding: 0 30rpx 0 80rpx;
  font-size: 30rpx;
  color: #333;
  background-color: #f8f8f8;
}

/* 密码显示切换按钮 */
.password-toggle {
  position: absolute;
  right: 20rpx;
  color: #aaa;
  font-size: 36rpx;
}

/* 提交按钮 */
.submit-btn {
  width: 100%;
  height: 90rpx;
  border: none;
  border-radius: 45rpx;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  color: white;
  font-size: 32rpx;
  font-weight: 500;
  margin-top: 20rpx;
  box-shadow: 0 10rpx 20rpx rgba(243, 156, 18, 0.3);
}

/* 底部版权信息 */
.change-footer {
  text-align: center;
  padding: 30rpx 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 24rpx;
  margin-top: auto;
}
</style> 