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
            v-model="formData.phone"
          />
        </view>
      </view>

      <view class="form-group">
        <text class="form-label">验证码</text>
        <view class="input-container">
          <text class="uni-icons" :class="['uniui-email-filled']"></text>
          <input
            class="form-control"
            type="text"
            inputmode="numeric"
            maxlength="6"
            placeholder="请输入验证码"
            v-model="formData.code"
          />
          <view class="send-code-btn" :class="{ disabled: cooldown > 0 }" @click="sendCode">
            {{ cooldown > 0 ? `${cooldown}秒后重试` : '获取验证码' }}
          </view>
        </view>
      </view>

      <button class="login-btn" @click="handleLogin">登 录</button>

      <view class="login-options">
        <text class="option-link" @click="goToPasswordLogin">密码登录</text>
        <text class="option-link" @click="goToResetPassword">忘记密码</text>
      </view>

      <view class="register-link">
        <text>没有账号？</text>
        <text class="register-text" @click="goToSmsRegister">短信验证码注册</text>
        <text>|</text>
        <text class="register-text" @click="goToCaptchaRegister">图形验证码注册</text>
      </view>
    </view>

    <!-- 底部版权信息 -->
    <view class="login-footer">
      <text></text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, onUnmounted, computed, onMounted } from 'vue'
import { useUserStore } from '@/store'
import { sendSmsCodeAPI, smsLoginAPI } from '@/service/index/auth'

// 添加重定向逻辑，在组件挂载时自动重定向到密码登录页面
onMounted(() => {
  // 自动重定向到密码登录页面
  uni.redirectTo({
    url: '/pages/login/password',
  })
})

// 表单数据
const formData = reactive({
  phone: '',
  code: '',
})

// 用户Store
const userStore = useUserStore()

// 验证码倒计时
const cooldown = ref<number>(0)
let timer: ReturnType<typeof setInterval> | null = null

// 组件销毁时清除定时器
onUnmounted(() => {
  if (timer) {
    clearInterval(timer)
  }
})

// 检查是否可以登录
const canLogin = computed(() => {
  return formData.phone.trim() !== '' && formData.code.trim() !== ''
})

// 发送验证码
const sendCode = async () => {
  // 如果正在倒计时，不允许再次发送
  if (cooldown.value > 0) return

  // 验证手机号
  if (!formData.phone.trim()) {
    uni.showToast({
      title: '请输入手机号',
      icon: 'none',
    })
    return
  }

  if (!/^1\d{10}$/.test(formData.phone)) {
    uni.showToast({
      title: '请输入正确的手机号',
      icon: 'none',
    })
    return
  }

  try {
    // 显示发送中提示
    uni.showLoading({
      title: '发送中...',
    })

    // 调用发送验证码API
    const res = await sendSmsCodeAPI({
      mobile: formData.phone,
      type: 'login',
    })

    // 隐藏加载提示
    uni.hideLoading()

    if (res && res.status === 'success') {
      uni.showToast({
        title: '验证码已发送',
        icon: 'success',
      })

      // 开始倒计时
      cooldown.value = res.data?.cooldown || 60
      timer = setInterval(() => {
        if (cooldown.value > 0) {
          cooldown.value--
        } else {
          if (timer) {
            clearInterval(timer)
            timer = null
          }
        }
      }, 1000)
    } else {
      uni.showToast({
        title: res?.data.message || '发送失败，请重试',
        icon: 'none',
      })
    }
  } catch (error: any) {
    uni.hideLoading()

    uni.showToast({
      title: '发送失败，请检查手机号是否可用',
      icon: 'none',
    })
  }
}

// 处理登录
const handleLogin = async () => {
  // 验证输入
  if (!formData.phone.trim()) {
    uni.showToast({
      title: '请输入手机号',
      icon: 'none',
    })
    return
  }

  if (!formData.code.trim()) {
    uni.showToast({
      title: '请输入验证码',
      icon: 'none',
    })
    return
  }

  try {
    // 显示登录中提示
    uni.showLoading({
      title: '登录中...',
    })

    console.log('开始登录请求，参数:', {
      phone: formData.phone,
      code: formData.code,
    })

    // 调用短信登录API
    const res = await smsLoginAPI({
      phone: formData.phone,
      code: formData.code,
    })

    console.log('登录响应:', res)

    // 隐藏加载提示
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

      // 登录成功后跳转到首页
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
    }
  } catch (error: any) {
    uni.hideLoading()
    uni.showToast({
      title: error?.data?.message || error?.message || '登录失败，请重试',
      icon: 'none',
    })
  }
}

// 前往短信验证码注册页面
const goToSmsRegister = () => {
  uni.navigateTo({
    url: '/pages/register/index',
  })
}

// 前往图形验证码注册页面
const goToCaptchaRegister = () => {
  uni.navigateTo({
    url: '/pages/register/captcha',
  })
}

// 前往密码重置页面
const goToResetPassword = () => {
  uni.navigateTo({
    url: '/pages/login/reset-password',
  })
}

// 前往密码登录页面
const goToPasswordLogin = () => {
  uni.navigateTo({
    url: '/pages/login/password',
  })
}
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

/* 发送验证码按钮 */
.send-code-btn {
  position: absolute;
  right: 20rpx;
  font-size: 24rpx;
  color: #3498db;
  padding: 10rpx 20rpx;
  border-radius: 30rpx;
  background-color: rgba(52, 152, 219, 0.1);

  &.disabled {
    color: #999;
    background-color: #f0f0f0;
  }
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
