<route lang="json5">
{
  style: {
    navigationBarTitleText: '注册',
  },
}
</route>
<template>
  <view class="register-container p-4">
    <view class="logo-box my-6 flex justify-center">
      <image src="/static/logo.svg" alt="" class="w-20 h-20" />
    </view>
    <view class="register-form">
      <view class="form-item mb-4">
        <input
          v-model="registerForm.name"
          class="input bg-gray-100 p-3 rounded-lg w-full"
          type="text"
          placeholder="请输入用户名"
        />
      </view>
      <view class="form-item mb-4">
        <input
          v-model="registerForm.phone"
          class="input bg-gray-100 p-3 rounded-lg w-full"
          type="text"
          placeholder="请输入手机号码"
        />
      </view>
      <view class="form-item mb-4">
        <input
          v-model="registerForm.password"
          class="input bg-gray-100 p-3 rounded-lg w-full"
          type="password"
          placeholder="请输入密码"
        />
      </view>
      <view class="form-item mb-4">
        <input
          v-model="registerForm.password_confirmation"
          class="input bg-gray-100 p-3 rounded-lg w-full"
          type="password"
          placeholder="请确认密码"
        />
      </view>
      <view class="form-item mb-4">
        <input
          v-model="registerForm.referrer_invite_code"
          class="input bg-gray-100 p-3 rounded-lg w-full"
          type="text"
          placeholder="邀请码（选填）"
        />
      </view>
      <view class="form-item mb-4">
        <button
          @click="handleRegister"
          class="btn-register w-full bg-blue-500 text-white p-3 rounded-lg text-center"
          :disabled="loading"
        >
          {{ loading ? '注册中...' : '注册' }}
        </button>
      </view>
      <view class="flex justify-center text-sm text-gray-600">
        <text>已有账号？</text>
        <navigator url="/pages/login/index" open-type="navigate" class="text-blue-500 ml-1">
          点击登录
        </navigator>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { registerAPI } from '@/service/index/auth'
import { useUserStore } from '@/store'

defineOptions({
  name: 'Register',
})

// 注册表单数据
const registerForm = ref({
  name: '',
  phone: '',
  password: '',
  password_confirmation: '',
  referrer_invite_code: '',
})

// 加载状态
const loading = ref(false)

// 用户Store
const userStore = useUserStore()

// 注册处理函数
const handleRegister = async () => {
  // 表单验证
  if (!registerForm.value.name) {
    uni.showToast({
      icon: 'none',
      title: '请输入用户名',
    })
    return
  }
  if (!registerForm.value.phone) {
    uni.showToast({
      icon: 'none',
      title: '请输入手机号码',
    })
    return
  }
  if (!registerForm.value.password) {
    uni.showToast({
      icon: 'none',
      title: '请输入密码',
    })
    return
  }
  if (registerForm.value.password !== registerForm.value.password_confirmation) {
    uni.showToast({
      icon: 'none',
      title: '两次输入的密码不一致',
    })
    return
  }

  try {
    loading.value = true
    // 调用注册API
    const res = await registerAPI(registerForm.value)
    
    // 注册成功，保存用户信息
    if (res.status === 'success' && res.data) {
      // 保存用户信息和token
      userStore.setUserInfo({
        ...res.data.user,
        token: res.data.access_token,
      })
      
      uni.showToast({
        icon: 'success',
        title: '注册成功',
      })
      
      // 判断是否需要进行实名认证
      if (res.data.requires_verification) {
        // 跳转到实名认证页面
        setTimeout(() => {
          uni.navigateTo({
            url: '/pages/verification/index',
          })
        }, 1500)
      } else {
        // 直接跳转到首页
        setTimeout(() => {
          uni.switchTab({
            url: '/pages/index/index',
          })
        }, 1500)
      }
    }
  } catch (error: any) {
    // 显示错误信息
    uni.showToast({
      icon: 'none',
      title: error.message || '注册失败，请重试',
    })
  } finally {
    loading.value = false
  }
}
</script>

<style>
.register-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
}

.logo-box {
  flex: 0.5;
  display: flex;
  align-items: center;
}

.register-form {
  flex: 2;
}
</style>