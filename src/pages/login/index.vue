<route lang="json5">
{
  style: {
    navigationBarTitleText: '登录',
  },
}
</route>
<template>
  <view class="login-container p-4">
    <view class="logo-box my-10 flex justify-center">
      <image src="/static/logo.svg" alt="" class="w-20 h-20" />
    </view>
    <view class="login-form">
      <view class="form-item mb-4">
        <input
          v-model="loginForm.login_id"
          class="input bg-gray-100 p-3 rounded-lg w-full"
          type="text"
          placeholder="请输入手机号/邮箱"
        />
      </view>
      <view class="form-item mb-6">
        <input
          v-model="loginForm.password"
          class="input bg-gray-100 p-3 rounded-lg w-full"
          type="password"
          placeholder="请输入密码"
        />
      </view>
      <view class="form-item mb-4">
        <button
          @click="handleLogin"
          class="btn-login w-full bg-blue-500 text-white p-3 rounded-lg text-center"
          :disabled="loading"
        >
          {{ loading ? '登录中...' : '登录' }}
        </button>
      </view>
      <view class="flex justify-between text-sm text-gray-600">
        <navigator url="/pages/register/index" class="text-blue-500">注册账号</navigator>
        <text class="text-blue-500">忘记密码</text>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { loginAPI } from '@/service/index/auth'
import { useUserStore } from '@/store'

defineOptions({
  name: 'Login',
})

// 登录表单数据
const loginForm = ref({
  login_id: '',
  password: '',
})

// 加载状态
const loading = ref(false)

// 用户Store
const userStore = useUserStore()

// 登录处理函数
const handleLogin = async () => {
  // 表单验证
  if (!loginForm.value.login_id) {
    uni.showToast({
      icon: 'none',
      title: '请输入手机号或邮箱',
    })
    return
  }
  if (!loginForm.value.password) {
    uni.showToast({
      icon: 'none',
      title: '请输入密码',
    })
    return
  }

  try {
    loading.value = true
    // 调用登录API
    const res = await loginAPI(loginForm.value)
    
    // 登录成功，保存用户信息
    if (res.status === 'success' && res.data) {
      // 保存用户信息和token
      userStore.setUserInfo({
        ...res.data.user,
        token: res.data.access_token,
      })
      
      uni.showToast({
        icon: 'success',
        title: '登录成功',
      })
      
      // 延时跳转到首页
      setTimeout(() => {
        uni.switchTab({
          url: '/pages/index/index',
        })
      }, 1500)
    }
  } catch (error: any) {
    // 显示错误信息
    uni.showToast({
      icon: 'none',
      title: error.message || '登录失败，请重试',
    })
  } finally {
    loading.value = false
  }
}
</script>

<style>
.login-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.logo-box {
  flex: 1;
  display: flex;
  align-items: center;
}

.login-form {
  flex: 2;
}
</style> 