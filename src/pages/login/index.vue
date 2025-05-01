<route lang="json5">
{
  style: {
    navigationBarTitleText: '登录',
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
            type="number"
            :maxlength="11"
            placeholder="请输入手机号码"
            v-model="formData.mobile"
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
            :password="!showPassword"
            placeholder="请输入密码"
            v-model="formData.password"
            password-icon-style="right: 20rpx;"
          />
          <text 
            class="uni-icons password-toggle" 
            :class="[showPassword ? 'uniui-eye-filled' : 'uniui-eye-slash-filled']"
            @click="togglePasswordVisibility"
          ></text>
        </view>
      </view>
      
      <text class="forgot-password" @click="goToResetPassword">忘记密码？</text>
      
      <button class="login-btn" @click="handleLogin">登 录</button>
      
      <view class="register-link">
        <text>还没有账号？</text>
        <text class="register-text" @click="goToRegister">立即注册</text>
      </view>
    </view>
    
    <!-- 底部版权信息 -->
    <view class="login-footer">
      <text>© 2025 理财管理平台 版权所有</text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive } from 'vue';
import { useUserStore } from '@/store';
import { loginAPI } from '@/service/index/auth';

// 表单数据
const formData = reactive({
  mobile: '',
  password: ''
});

// 控制密码可见性
const showPassword = ref(false);

// 用户Store
const userStore = useUserStore();

// 切换密码可见性
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// 登录处理
const handleLogin = async () => {
  // 表单验证
  if (!formData.mobile.trim()) {
    uni.showToast({
      title: '请输入手机号',
      icon: 'none'
    });
    return;
  }
  
  if (!/^1\d{10}$/.test(formData.mobile)) {
    uni.showToast({
      title: '请输入正确的手机号',
      icon: 'none'
    });
    return;
  }
  
  if (!formData.password.trim()) {
    uni.showToast({
      title: '请输入密码',
      icon: 'none'
    });
    return;
  }
  
  // 执行登录
  try {
    // 显示登录中提示
    uni.showLoading({
      title: '登录中...'
    });
    
    // 调用实际登录API
    const res = await loginAPI({
      mobile: formData.mobile,
      password: formData.password
    });
    
    // 隐藏加载
    uni.hideLoading();
    
    if (res && res.data) {
      const { user, access_token, token_type } = res.data;
      
      // 保存用户信息和Token
      userStore.setUserInfo({
        ...user,
        token: access_token
      });
      
      // 登录成功后立即获取完整的用户信息和实名认证状态
      try {
        console.log('登录成功，正在获取最新用户信息...');
        // 一次性获取完整用户信息，包含认证状态
        const infoUpdated = await userStore.fetchUserInfo();
        if (infoUpdated) {
          console.log('用户信息和认证状态已更新:', userStore.verificationStatus);
        }
      } catch (error) {
        console.error('获取用户信息失败:', error);
        // 错误不影响登录流程
      }
      
      uni.showToast({
        title: '登录成功',
        icon: 'success'
      });
      
      // 跳转到首页
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

// 前往密码重置页面
const goToResetPassword = () => {
  uni.navigateTo({
    url: '/pages/login/reset-password'
  });
};

// 前往注册页面
const goToRegister = () => {
  uni.navigateTo({
    url: '/pages/register/index'
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

/* 注册链接 */
.register-link {
  text-align: center;
  font-size: 28rpx;
  color: #777;
}

.register-text {
  color: #3498db;
  margin-left: 10rpx;
}

/* 底部版权信息 */
.login-footer {
  text-align: center;
  padding: 30rpx 0;
  color: rgba(255, 255, 255, 0.6);
  font-size: 24rpx;
  margin-top: auto;
}
</style> 