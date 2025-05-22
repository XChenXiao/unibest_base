<route lang="json5">
{
  style: {
    navigationBarTitleText: '登录',
    navigationStyle: 'custom',
  },
}
</route>
<template>
  <view class="login-container">
    <!-- 顶部波浪装饰 -->
    <view class="wave-decoration"></view>

    <!-- Logo区域 -->
    <view class="logo-area">
      <image src="/src/static/images/logo/logo.jpg" class="logo" />
      <text class="app-name">中银易捷</text>
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

      <!-- <view class="login-options">
        <text class="option-link" @click="goToResetPassword">忘记密码</text>
      </view> -->

      <view class="register-link">
        <text>没有账号？</text>
        <!-- <text class="register-text" @click="goToCaptchaRegister">图形验证码注册</text> -->
        <text class="register-text" @click="goToCaptchaRegister">去注册</text>
      </view>
    </view>

    <!-- 底部版权信息 -->
    <view class="login-footer">
      <text></text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, computed } from 'vue'
import { useUserStore } from '@/store'
import { loginAPI } from '@/service/index/auth'

// 表单数据
const formData = reactive({
  login_id: '',
  password: '',
  showPassword: false,
})

// 用户状态
const userStore = useUserStore()

// 切换密码显示
const togglePasswordVisibility = () => {
  formData.showPassword = !formData.showPassword
}

// 检查表单是否填写完整
const isFormValid = computed(() => {
  return formData.login_id.trim() !== '' && formData.password.trim() !== ''
})

// 处理登录
const handleLogin = async () => {
  if (!isFormValid.value) {
    uni.showToast({
      title: '请填写完整信息',
      icon: 'none',
    })
    return
  }

  try {
    uni.showLoading({
      title: '登录中...',
    })

    console.log('开始密码登录请求，参数:', {
      login_id: formData.login_id,
      password: '******', // 密码不输出
    })

    const res = await loginAPI({
      login_id: formData.login_id,
      password: formData.password,
    })

    console.log('密码登录响应:', res)

    uni.hideLoading()

    if (res && res.status === 'success' && res.data) {
      // 保存用户信息和token
      userStore.setUserInfo({
        ...res.data.user,
        token: res.data.access_token,
      })

      // 重置登录重定向标志
      uni.setStorageSync('redirecting_to_login', 'false')

      uni.showToast({
        title: '登录成功',
        icon: 'success',
      })

      // 获取平台设置和用户信息
      uni.showLoading({
        title: '加载数据...',
      })

      try {
        // 导入需要的store
        const { usePlatformStore } = await import('@/store/platform')
        const { useAppStore } = await import('@/store/app')

        const platformStore = usePlatformStore()
        const appStore = useAppStore()

        // 获取平台功能开关设置
        await platformStore.fetchPlatformSettings()
        // 获取银行卡开户预存金
        appStore.fetchBankCardOpenFee()
        // 刷新用户信息
        await userStore.fetchUserInfo()

        uni.hideLoading()
      } catch (error) {
        console.error('加载平台数据失败', error)
        uni.hideLoading()
      }

      // 延迟跳转到首页
      setTimeout(() => {
        uni.switchTab({
          url: '/pages/index/index',
          success: () => {
            console.log('成功跳转到首页')
          },
          fail: (err) => {
            console.error('跳转到首页失败:', err)
            // 如果switchTab失败，尝试使用reLaunch
            uni.reLaunch({
              url: '/pages/index/index',
            })
          },
        })
      }, 1000)
    } else {
      // 登录失败但服务器有返回消息
      uni.showToast({
        title: res?.message || '登录失败，请重试',
        icon: 'none',
      })
    }
  } catch (error: any) {
    uni.hideLoading()
    uni.showToast({
      title: error?.data?.message || error?.message || '登录失败，请重试',
      icon: 'none',
    })
  }
}

// 前往密码重置页面
const goToResetPassword = () => {
  uni.navigateTo({
    url: '/pages/login/reset-password',
  })
}

// 前往图形验证码注册页面
const goToCaptchaRegister = () => {
  uni.navigateTo({
    url: '/pages/register/captcha',
  })
}
</script>

<style lang="scss">
/* 全局重置 */
page {
  height: 100%;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  background: linear-gradient(135deg, #3498db, #1a5276);
}
/* 容器样式 */
.login-container {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  padding: 0 30rpx;
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
  display: flex;
  align-items: center;
  justify-content: center;
  width: 140rpx;
  height: 140rpx;
  margin-bottom: 30rpx;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  border-radius: 50%;
  box-shadow: 0 10rpx 30rpx rgba(243, 156, 18, 0.3);
}

.logo-text {
  font-size: 80rpx;
  font-weight: bold;
  color: white;
}

.app-name {
  margin-bottom: 10rpx;
  font-size: 44rpx;
  font-weight: 600;
  color: #ffffff;
}

.app-slogan {
  font-size: 28rpx;
  color: rgba(255, 255, 255, 0.8);
}
/* 登录表单 */
.login-form {
  padding: 40rpx;
  margin-bottom: 40rpx;
  background-color: white;
  border-radius: 20rpx;
  box-shadow: 0 20rpx 40rpx rgba(0, 0, 0, 0.15);
}
/* 表单组 */
.form-group {
  margin-bottom: 30rpx;
}
/* 表单标签 */
.form-label {
  display: block;
  margin-bottom: 16rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: #555;
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
  font-size: 36rpx;
  color: #aaa;
}
/* 输入框 */
.form-control {
  width: 100%;
  height: 90rpx;
  padding: 0 30rpx 0 80rpx;
  font-size: 30rpx;
  color: #333;
  background-color: #f8f8f8;
  border: 1px solid #e0e0e0;
  border-radius: 45rpx;
}
/* 密码显示切换按钮 */
.password-toggle {
  position: absolute;
  right: 20rpx;
  font-size: 36rpx;
  color: #aaa;
}
/* 忘记密码链接 */
.forgot-password {
  display: block;
  margin: -10rpx 0 40rpx;
  font-size: 28rpx;
  color: #3498db;
  text-align: right;
}
/* 登录按钮 */
.login-btn {
  width: 100%;
  height: 90rpx;
  margin-bottom: 30rpx;
  font-size: 32rpx;
  font-weight: 500;
  color: white;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  border: none;
  border-radius: 45rpx;
  box-shadow: 0 10rpx 20rpx rgba(243, 156, 18, 0.3);
}
/* 登录选项 */
.login-options {
  display: flex;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.option-link {
  padding: 10rpx;
  font-size: 26rpx;
  color: #3498db;
}
/* 底部版权信息 */
.login-footer {
  padding: 30rpx 0;
  margin-top: auto;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
  text-align: center;
}

.register-link {
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #333;
  text-align: center;
}

.register-text {
  padding: 0 10rpx;
  color: #3498db;
}
</style>
