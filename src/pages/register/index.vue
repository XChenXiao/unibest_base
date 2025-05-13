<route lang="json5">
{
  style: {
    navigationBarTitleText: '注册账号',
  },
}
</route>
<template>
  <view class="register-container">
    <!-- 顶部波浪装饰 -->
    <view class="wave-decoration"></view>
    
    <!-- 标题区域 -->
    <view class="title-area">
      <text class="main-title">注册账号</text>
      <text class="sub-title">加入我们的理财平台</text>
    </view>
    
    <!-- 注册表单 -->
    <view class="register-form">
      <!-- 用户名表单已注释
      <view class="form-group">
        <text class="form-label">用户名</text>
        <view class="input-container">
          <text class="uni-icons" :class="['uniui-person-filled']"></text>
          <input 
            class="form-control" 
            type="text"
            placeholder="请输入用户名"
            v-model="formData.name"
          />
        </view>
      </view>
      -->

      <view class="form-group">
        <text class="form-label">手机号</text>
        <view class="input-container">
          <text class="uni-icons" :class="['uniui-phone-filled']"></text>
          <input 
            class="form-control" 
            type="number"
            maxlength="11"
            placeholder="请输入手机号码"
            v-model="formData.phone"
          />
        </view>
      </view>
      
      <view class="form-group">
        <text class="form-label">密码</text>
        <view class="input-container">
          <text class="uni-icons" :class="['uniui-locked-filled']"></text>
          <input 
            class="form-control" 
            :type="showPassword ? 'text' : 'password'"
            placeholder="请输入密码（6-20位）"
            v-model="formData.password"
          />
          <text 
            class="uni-icons password-toggle" 
            :class="[showPassword ? 'uniui-eye-filled' : 'uniui-eye-slash-filled']"
            @click="togglePasswordVisibility"
          ></text>
        </view>
      </view>

      <view class="form-group">
        <text class="form-label">确认密码</text>
        <view class="input-container">
          <text class="uni-icons" :class="['uniui-locked-filled']"></text>
          <input 
            class="form-control" 
            :type="showPassword ? 'text' : 'password'"
            placeholder="请再次输入密码"
            v-model="formData.password_confirmation"
          />
        </view>
      </view>
      
      <view class="form-group">
        <text class="form-label">提现密码</text>
        <view class="input-container">
          <text class="uni-icons" :class="['uniui-safe-filled']"></text>
          <input 
            class="form-control" 
            :type="showPassword ? 'text' : 'password'"
            placeholder="请设置提现密码（6位数字）"
            v-model="formData.withdraw_password"
          />
        </view>
      </view>
      
      <view class="form-group">
        <text class="form-label">邀请码</text>
        <view class="input-container">
          <text class="uni-icons" :class="['uniui-flag-filled']"></text>
          <input 
            class="form-control" 
            type="text"
            placeholder="请输入邀请码"
            v-model="formData.referrer_invite_code"
          />
        </view>
      </view>
      
      <view class="agreement-container">
        <view class="checkbox-container" @click="toggleAgreement">
          <view class="checkbox" :class="{ checked: agreedToTerms }"></view>
        </view>
        <text class="agreement-text">我已阅读并同意<text class="agreement-link">《用户协议》</text>和<text class="agreement-link">《隐私政策》</text></text>
      </view>
      
      <button class="register-btn" :disabled="!isFormValid" @click="handleRegister">注 册</button>
      
      <view class="login-link">
        <text>已有账号？</text>
        <text class="login-text" @click="goToLogin">立即登录</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue';
import { registerAPI } from '@/service/index/auth';
import { onLoad } from '@dcloudio/uni-app';

// 表单数据
const formData = reactive({
  name: 'defaultUser', // 使用默认值替代用户输入
  phone: '',
  password: '',
  password_confirmation: '',
  withdraw_password: '',
  referrer_invite_code: ''
});

// 控制密码可见性
const showPassword = ref(false);

// 控制用户协议同意状态
const agreedToTerms = ref(false);

// 页面加载时获取参数
onLoad((options) => {
  console.log(Object.values(options),'options');
  if (Object.values(options).length > 0) {
    formData.referrer_invite_code = Object.values(options)[0];
    console.log(formData,'formData.referrer_invite_code');
  }
});

// 切换密码可见性
const togglePasswordVisibility = () => {
  showPassword.value = !showPassword.value;
};

// 切换协议同意状态
const toggleAgreement = () => {
  agreedToTerms.value = !agreedToTerms.value;
};

// 检查所有必填字段是否已填写
const isFormValid = computed(() => {
  return formData.phone.trim() !== '' && 
         formData.password.trim() !== '' && 
         formData.password_confirmation.trim() !== '' &&
         formData.withdraw_password.trim() !== '' &&
         agreedToTerms.value;
});

// 注册处理
const handleRegister = async () => {
  // 表单验证
  if (!formData.name.trim()) {
    uni.showToast({
      title: '请输入用户名',
      icon: 'none'
    });
    return;
  }
  
  if (!formData.phone.trim()) {
    uni.showToast({
      title: '请输入手机号',
      icon: 'none'
    });
    return;
  }
  
  if (!/^1\d{10}$/.test(formData.phone)) {
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
  
  if (formData.password.length < 6 || formData.password.length > 20) {
    uni.showToast({
      title: '密码长度应为6-20位',
      icon: 'none'
    });
    return;
  }
  
  if (formData.password !== formData.password_confirmation) {
    uni.showToast({
      title: '两次输入的密码不一致',
      icon: 'none'
    });
    return;
  }
  
  if (!formData.withdraw_password.trim()) {
    uni.showToast({
      title: '请输入提现密码',
      icon: 'none'
    });
    return;
  }
  
  if (formData.withdraw_password.length < 6) {
    uni.showToast({
      title: '提现密码长度至少为6位',
      icon: 'none'
    });
    return;
  }
  
  if (!agreedToTerms.value) {
    uni.showToast({
      title: '请阅读并同意用户协议',
      icon: 'none'
    });
    return;
  }
  
  // 执行注册
  try {
    // 显示注册中提示
    uni.showLoading({
      title: '注册中...'
    });
    
    // 调用实际注册API
    const res = await registerAPI({
      name: formData.name,
      phone: formData.phone,
      password: formData.password,
      password_confirmation: formData.password_confirmation,
      withdraw_password: formData.withdraw_password,
      referrer_invite_code: formData.referrer_invite_code || undefined
    });
    
    // 隐藏加载
    uni.hideLoading();
    
    if (res && res.status === 'success') {
      uni.showToast({
        title: '注册成功',
        icon: 'success'
      });
      
      // 注册成功后跳转到登录页
      setTimeout(() => {
        goToLogin();
      }, 1500);
    }
  } catch (error: any) {
    uni.hideLoading();
    
    // 显示详细错误信息
    if (error?.errors) {
      // 获取第一个具体错误信息
      const firstErrorKey = Object.keys(error.errors)[0];
      if (firstErrorKey && error.errors[firstErrorKey]?.length) {
        uni.showToast({
          title: error.errors[firstErrorKey][0],
          icon: 'none',
          duration: 3000
        });
        return;
      }
    }
    
    uni.showToast({
      title: error?.message || '注册失败，请重试',
      icon: 'none'
    });
  }
};

// 前往登录页面
const goToLogin = () => {
  uni.navigateTo({
    url: '/pages/login/index'
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
.register-container {
  display: flex;
  flex-direction: column;
  min-height: 100%;
  padding: 30rpx;
  position: relative;
}

/* 波浪装饰 */
.wave-decoration {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  height: 200rpx;
  background: url('data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 1440 320"><path fill="%23ffffff" fill-opacity="0.1" d="M0,96L48,112C96,128,192,160,288,154.7C384,149,480,107,576,96C672,85,768,107,864,128C960,149,1056,171,1152,165.3C1248,160,1344,128,1392,112L1440,96L1440,0L1392,0C1344,0,1248,0,1152,0C1056,0,960,0,864,0C768,0,672,0,576,0C480,0,384,0,288,0C192,0,96,0,48,0L0,0Z"></path></svg>') no-repeat center;
  background-size: cover;
  opacity: 0.4;
}

/* 标题区域 */
.title-area {
  margin-top: 60rpx;
  margin-bottom: 60rpx;
  z-index: 1;
  
  .main-title {
    font-size: 48rpx;
    font-weight: bold;
    color: #ffffff;
    margin-bottom: 16rpx;
    display: block;
  }
  
  .sub-title {
    font-size: 28rpx;
    color: rgba(255, 255, 255, 0.8);
  }
}

/* 表单样式 */
.register-form {
  background: rgba(255, 255, 255, 0.95);
  border-radius: 20rpx;
  padding: 40rpx;
  box-shadow: 0 10rpx 30rpx rgba(0, 0, 0, 0.1);
  z-index: 1;
  
  .form-group {
    margin-bottom: 30rpx;
    
    .form-label {
      font-size: 28rpx;
      color: #333;
      margin-bottom: 10rpx;
      display: block;
    }
    
    .input-container {
      display: flex;
      align-items: center;
      background-color: #f5f7fa;
      border-radius: 10rpx;
      padding: 0 20rpx;
      height: 80rpx;
      
      .uni-icons {
        color: #666;
        margin-right: 15rpx;
      }
      
      .form-control {
        flex: 1;
        height: 80rpx;
        font-size: 28rpx;
      }
      
      .password-toggle {
        color: #666;
        padding: 10rpx;
      }
    }
  }
  
  .agreement-container {
    display: flex;
    align-items: center;
    margin-bottom: 40rpx;
    
    .checkbox-container {
      margin-right: 15rpx;
      
      .checkbox {
        width: 32rpx;
        height: 32rpx;
        border: 2rpx solid #999;
        border-radius: 6rpx;
        position: relative;
        
        &.checked::after {
          content: "";
          position: absolute;
          width: 20rpx;
          height: 20rpx;
          background-color: #3498db;
          border-radius: 3rpx;
          top: 50%;
          left: 50%;
          transform: translate(-50%, -50%);
        }
      }
    }
    
    .agreement-text {
      font-size: 24rpx;
      color: #666;
      
      .agreement-link {
        color: #3498db;
      }
    }
  }
  
  .register-btn {
    background: linear-gradient(45deg, #3498db, #2980b9);
    color: white;
    height: 88rpx;
    line-height: 88rpx;
    border-radius: 44rpx;
    font-size: 32rpx;
    margin-bottom: 30rpx;
    
    &:disabled {
      opacity: 0.6;
    }
  }
  
  .login-link {
    text-align: center;
    font-size: 24rpx;
    color: #666;
    
    .login-text {
      color: #3498db;
      margin-left: 10rpx;
    }
  }
}
</style>