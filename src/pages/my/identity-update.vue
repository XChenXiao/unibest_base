<route lang="json5">
{
  style: {
    navigationBarTitleText: '修改实名信息',
  },
}
</route>

<template>
  <view class="identity-update-container">
    <!-- 顶部波浪装饰 -->
    <view class="wave-decoration"></view>

    <!-- 返回按钮 -->
    <view class="back-button" @click="goBack">
      <text class="uni-icons uniui-arrow-left"></text>
    </view>

    <!-- 实名信息更新表单 -->
    <view class="update-form">
      <view class="form-group">
        <text class="form-label">真实姓名</text>
        <view class="input-container">
          <text class="uni-icons uniui-person-filled"></text>
          <input
            class="form-control"
            type="text"
            placeholder="请输入您的真实姓名"
            v-model="formData.name"
          />
        </view>
      </view>

      <view class="form-group">
        <text class="form-label">身份证号码</text>
        <view class="input-container">
          <text class="uni-icons uniui-card-filled"></text>
          <input
            class="form-control"
            type="idcard"
            :maxlength="18"
            placeholder="请输入您的身份证号码"
            v-model="formData.idNumber"
          />
        </view>
      </view>

      <!-- 提示说明 -->
      <view class="tips-container">
        <text class="tips-icon uni-icons uniui-info-filled"></text>
        <text class="tips-text">请确保填写的信息真实有效，修改后需要重新审核</text>
      </view>

      <!-- 提交按钮 -->
      <button class="submit-btn" @click="handleSubmit" :disabled="loading">
        {{ loading ? '提交中...' : '提交修改' }}
      </button>
    </view>

    <!-- 底部版权信息 -->
    <view class="update-footer">
      <text></text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore, useVerificationStore } from '@/store'
import { http } from '@/utils/request'

// 获取用户状态
const userStore = useUserStore()
const verificationStore = useVerificationStore()

// 加载状态
const loading = ref(false)

// 表单数据
const formData = reactive({
  name: '',
  idNumber: '',
})

// 页面加载时获取当前实名信息
onMounted(async () => {
  try {
    // 从用户信息中获取基本信息
    formData.name = userStore.userInfo.name || ''
    
    // 获取认证详情
    const res = await http.get('/api/verification/status')
    
    // 基于API返回的数据结构访问verification对象
    if (res.status === 'success' && res.data) {
      // 获取认证信息
      const verificationData = res.data
      if (verificationData.verification) {
        // 填充表单数据
        const verification = verificationData.verification
        formData.name = verification.real_name || formData.name
        formData.idNumber = verification.id_card_number || ''
      }
    }
  } catch (error) {
    console.error('获取认证详情失败', error)
    
    // 显示错误提示
    uni.showToast({
      title: '获取认证信息失败',
      icon: 'none',
    })
  }
})

// 提交更新申请
const handleSubmit = async () => {
  // 表单验证
  if (!formData.name.trim()) {
    uni.showToast({
      title: '请输入真实姓名',
      icon: 'none',
    })
    return
  }

  if (!formData.idNumber.trim()) {
    uni.showToast({
      title: '请输入身份证号码',
      icon: 'none',
    })
    return
  }

  // 简单的身份证格式验证
  const idCardReg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  if (!idCardReg.test(formData.idNumber)) {
    uni.showToast({
      title: '请输入正确的身份证号码',
      icon: 'none',
    })
    return
  }

  try {
    // 显示加载状态
    loading.value = true

    // 调用更新实名信息API
    const res = await http.post('/api/verification/update', {
      real_name: formData.name,
      id_card_number: formData.idNumber,
    })

    if (res.status === 'success') {
      // 更新verificationStore中的信息
      verificationStore.setVerificationInfo({
        verified: true,
        pending: false,
        rejected: false,
        rejection_reason: '',
        real_name: formData.name,
        id_card_number: formData.idNumber,
      })

      // 提交成功提示
      uni.showToast({
        title: '实名信息修改成功',
        icon: 'success',
      })

      // 延迟1.5秒后返回上一页，让用户看到成功提示
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
  } catch (error: any) {
    uni.showToast({
      title: error.data?.message || '提交失败，请重试',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}
</script>

<style lang="scss">
/* 全局重置 */
page {
  background-color: #f5f5f5;
  height: 100%;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

/* 容器样式 */
.identity-update-container {
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

/* 表单样式 */
.update-form {
  background-color: white;
  border-radius: 20rpx;
  margin: 120rpx 30rpx 30rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
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

/* 提示容器 */
.tips-container {
  display: flex;
  padding: 20rpx;
  background-color: rgba(52, 152, 219, 0.1);
  border-radius: 10rpx;
  margin: 30rpx 0;
}

.tips-icon {
  position: static;
  font-size: 36rpx;
  color: #3498db;
  margin-right: 20rpx;
  flex-shrink: 0;
}

.tips-text {
  font-size: 24rpx;
  color: #666;
  line-height: 1.6;
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
  margin-top: 30rpx;
  box-shadow: 0 10rpx 20rpx rgba(243, 156, 18, 0.3);
}

.submit-btn[disabled] {
  opacity: 0.7;
  background: linear-gradient(to right, #f5cc7f, #f2a690);
}

/* 底部版权信息 */
.update-footer {
  text-align: center;
  padding: 30rpx 0;
  color: #999;
  font-size: 24rpx;
  margin-top: auto;
}
</style>