<route lang="json5">
{
  style: {
    navigationBarTitleText: '密码登录',
  },
}
</route>
<template>
  <view class="login-container">
    <!-- 顶部波浪装饰 -->
    <view class="wave-decoration"></view>
    
    <!-- Logo区域 -->
    <view class="logo-area">
      <view class="logo">
        <text class="logo-text">财</text>
      </view>
      <text class="app-name">理财管理平台</text>
      <text class="app-slogan">专业的财富管理伙伴</text>
    </view>
    
    <!-- 登录表单 -->
    <view class="login-form">
      <view class="form-group">
        <text class="form-label">手机号</text>
        <view class="input-container">
          <text class="uni-icons" :class="['uniui-phone-filled']"></text>
          <input 
            class="form-control" 
            type="text"
            inputmode="numeric"
            maxlength="11"
            placeholder="请输入手机号码"
            v-model="formData.login_id"
          />
        </view>
      </view>
      
      <view class="form-group">
        <text class="form-label">密码</text>
        <view class="input-container">
          <text class="uni-icons" :class="['uniui-locked-filled']"></text>
          <input 
            class="form-control" 
            type="text"
            :password="!formData.showPassword"
            placeholder="请输入密码"
            v-model="formData.password"
          />
          <text 
            class="uni-icons password-toggle" 
            :class="[formData.showPassword ? 'uniui-eye-filled' : 'uniui-eye-slash-filled']"
            @click="togglePasswordVisibility"
          ></text>
        </view>
      </view>
      
      <text class="forgot-password" @click="goToResetPassword">忘记密码？</text>
      
      <button class="login-btn" @click="handleLogin">登 录</button>
      
      <view class="login-options">
        <text class="option-link" @click="goToSmsLogin">验证码登录</text>
        <text class="option-link" @click="goToResetPassword">忘记密码</text>
      </view>

      <view class="register-link">
        <text>没有账号？</text>
        <text class="register-text" @click="goToSmsRegister">短信验证码注册</text>
        <text> | </text>
        <text class="register-text" @click="goToCaptchaRegister">图形验证码注册</text>
      </view>
    </view>
    
    <!-- 底部版权信息 -->
    <view class="login-footer">
      <text>版权所有 © 2023-2024 金融交易平台</text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue';
import { useUserStore } from '@/store';
import { loginAPI } from '@/service/index/auth';

// 表单数据
const formData = reactive({
  login_id: '',
  password: '',
  showPassword: false
});

// 用户状态
const userStore = useUserStore();

// 切换密码显示
const togglePasswordVisibility = () => {
  formData.showPassword = !formData.showPassword;
};

// 检查表单是否填写完整
const isFormValid = computed(() => {
  return formData.login_id.trim() !== '' && formData.password.trim() !== '';
});

// 处理登录
const handleLogin = async () => {
  if (!isFormValid.value) {
    uni.showToast({
      title: '请填写完整信息',
      icon: 'none'
    });
    return;
  }

  try {
    uni.showLoading({
      title: '登录中...'
    });

    const res = await loginAPI({
      login_id: formData.login_id,
      password: formData.password
    });

    uni.hideLoading();

    if (res && res.user) {
      // 保存用户信息和token
      userStore.setUserInfo({
        ...res.user,
        token: res.access_token
      });
      
      uni.showToast({
        title: '登录成功',
        icon: 'success'
      });

      // 延迟跳转到首页
      setTimeout(() => {
        uni.switchTab({
          url: '/pages/index/index'
        });
      }, 1500);
    }
  } catch (error: any) {
    uni.hideLoading();
    uni.showToast({
      title: error?.data?.message || error?.message || '登录失败，请重试',
      icon: 'none'
    });
  }
};

// 前往验证码登录页面
const goToSmsLogin = () => {
  uni.navigateTo({
    url: '/pages/login/index'
  });
};

// 前往密码重置页面
const goToResetPassword = () => {
  uni.navigateTo({
    url: '/pages/login/reset-password'
  });
};

// 前往短信验证码注册页面
const goToSmsRegister = () => {
  uni.navigateTo({
    url: '/pages/register/index'
  });
};

// 前往图形验证码注册页面
const goToCaptchaRegister = () => {
  uni.navigateTo({
    url: '/pages/register/captcha'
  });
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
.login-container {
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

/* LOGO区域 */
.logo-area {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-top: 100rpx;
  margin-bottom: 60rpx;
}

.logo {
  width: 140rpx;
  height: 140rpx;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
  box-shadow: 0 10rpx 30rpx rgba(243, 156, 18, 0.3);
}

.logo-text {
  color: white;
  font-size: 80rpx;
  font-weight: bold;
}

.app-name {
  font-size: 44rpx;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 10rpx;
}

.app-slogan {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}

/* 登录表单 */
.login-form {
  background-color: white;
  border-radius: 20rpx;
  padding: 40rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.15);
}

/* 表单组 */
.form-group {
  margin-bottom: 30rpx;
}

/* 表单标签 */
.form-label {
  display: block;
  color: #555;
  margin-bottom: 16rpx;
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

/* 忘记密码链接 */
.forgot-password {
  display: block;
  text-align: right;
  color: #3498db;
  font-size: 28rpx;
  margin: -10rpx 0 40rpx;
}

/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 90rpx;
  border: none;
  border-radius: 45rpx;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  color: white;
  font-size: 32rpx;
  font-weight: 500;
  margin-bottom: 30rpx;
  box-shadow: 0 10rpx 20rpx rgba(243, 156, 18, 0.3);
}

/* 登录选项 */
.login-options {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.option-link {
  font-size: 26rpx;
  color: #3498db;
  padding: 10rpx;
}

/* 底部版权信息 */
.login-footer {
  text-align: center;
  padding: 30rpx 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 24rpx;
  margin-top: auto;
}

.register-link {
  text-align: center;
  margin-top: 20rpx;
  color: #333;
  font-size: 28rpx;
}

.register-text {
  color: #3498db;
  padding: 0 10rpx;
}
</style> 