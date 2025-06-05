<route lang="json5">
{
  style: {
    navigationBarTitleText: '实名认证',
  },
}
</route>
<template>
  <view class="verification-container p-4">
    <!-- 已认证状态 -->
    <view
      v-if="verificationStatus && verificationStatus.data?.verification_status === 'approved'"
      class="status-box approved-box mb-6 p-4 rounded-lg"
    >
      <view class="flex items-center mb-4">
        <text class="i-carbon-checkmark-filled text-3xl text-green-500 mr-2"></text>
        <text class="text-lg font-bold">认证成功</text>
      </view>
      <view class="info-item mb-2">
        <text class="label text-gray-500">姓名：</text>
        <text>{{ verificationStatus.data?.verification?.real_name }}</text>
      </view>
      <view class="info-item mb-2">
        <text class="label text-gray-500">身份证号：</text>
        <text>{{ maskIdCard(verificationStatus.data?.verification?.id_card_number) }}</text>
      </view>
      <view class="info-item mb-2">
        <text class="label text-gray-500">认证时间：</text>
        <text>
          {{
            formatDate(
              verificationStatus.data?.verification?.verified_at ||
                verificationStatus.data?.verification?.updated_at,
            )
          }}
        </text>
      </view>
    </view>

    <!-- 被拒绝状态 -->
    <view
      v-else-if="verificationStatus && verificationStatus.data?.verification_status === 'rejected'"
      class="status-box rejected-box mb-6 p-4 rounded-lg"
    >
      <view class="flex items-center mb-4">
        <text class="i-carbon-close-filled text-3xl text-red-500 mr-2"></text>
        <text class="text-lg font-bold">认证失败</text>
      </view>
      <view class="info-item mb-2">
        <text class="label text-gray-500">失败原因：</text>
        <text class="text-red-500">
          {{ verificationStatus.data?.verification?.remark || '认证信息有误，请重新提交' }}
        </text>
      </view>
    </view>

    <!-- 表单 - 仅在未认证或认证被拒绝时显示 -->
    <view
      v-if="
        !verificationStatus ||
        verificationStatus.data?.verification_status === 'rejected' ||
        verificationStatus.data?.verification_status === 'unsubmitted'
      "
      class="form-box"
    >
      <view class="form-item mb-4">
        <view class="form-label mb-2">真实姓名</view>
        <input
          v-model="verificationForm.real_name"
          class="input bg-gray-100 p-3 rounded-lg w-full"
          type="text"
          placeholder="请输入您的真实姓名"
        />
      </view>
      <view class="form-item mb-4">
        <view class="form-label mb-2">身份证号码</view>
        <input
          v-model="verificationForm.id_card_number"
          class="input bg-gray-100 p-3 rounded-lg w-full"
          type="text"
          placeholder="请输入您的身份证号码"
        />
      </view>
      <view class="form-item mt-8">
        <button
          @click="handleSubmit"
          class="btn-submit w-full bg-blue-500 text-white p-3 rounded-lg text-center"
          :disabled="loading"
        >
          {{ loading ? '提交中...' : '提交认证' }}
        </button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import { submitVerification, getVerificationStatus } from '@/service/app/user'
import type { VerificationStatus } from '@/service/app/types'
import { useUserStore, useVerificationStore } from '@/store'
// 移除了身份证图片上传相关的导入

defineOptions({
  name: 'Verification',
})

// 用户状态
const userStore = useUserStore()
const verificationStore = useVerificationStore()

// 认证表单数据
const verificationForm = ref({
  real_name: '',
  id_card_number: '',
  // 使用默认值替代
  id_card_front: 'default_id_card_front',
  id_card_back: 'default_id_card_back',
})

// 验证状态
const verificationStatus = ref<any>(null)

// 加载状态
const loading = ref(false)

// 获取认证状态
const fetchVerificationStatus = async () => {
  // 如果用户已认证，从store中获取状态，避免重复请求
  if (verificationStore.isVerified) {
    console.log('用户已认证，从store中获取状态')
    const storeStatus = {
      status: 'success',
      data: {
        verification_status: 'approved',
        is_verified: true,
        verification: verificationStore.verificationInfo || {},
      },
    }
    verificationStatus.value = storeStatus
    return
  }

  try {
    loading.value = true
    console.log('获取实名认证状态...')
    const res = await getVerificationStatus({})
    console.log('获取到的实名认证状态:', res)
    verificationStatus.value = res
  } catch (error: any) {
    uni.showToast({
      icon: 'none',
      title: error.message || '获取认证状态失败',
    })
  } finally {
    loading.value = false
  }
}

// 格式化日期
const formatDate = (dateStr?: string) => {
  if (!dateStr) return '-'
  const date = new Date(dateStr)
  return `${date.getFullYear()}-${String(date.getMonth() + 1).padStart(2, '0')}-${String(date.getDate()).padStart(2, '0')} ${String(date.getHours()).padStart(2, '0')}:${String(date.getMinutes()).padStart(2, '0')}`
}

// 身份证号脱敏
const maskIdCard = (idCard?: string) => {
  if (!idCard) return '-'
  return idCard.replace(/^(.{6})(.*)(.{4})$/, '$1******$3')
}

// 移除了选择图片相关函数

// 提交认证
const handleSubmit = async () => {
  // 表单验证
  if (!verificationForm.value.real_name) {
    uni.showToast({
      icon: 'none',
      title: '请输入真实姓名',
    })
    return
  }
  if (!verificationForm.value.id_card_number) {
    uni.showToast({
      icon: 'none',
      title: '请输入身份证号码',
    })
    return
  }

  // 简单验证身份证号码格式
  const idCardReg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
  if (!idCardReg.test(verificationForm.value.id_card_number)) {
    uni.showToast({
      icon: 'none',
      title: '身份证号码格式不正确',
    })
    return
  }

  // 移除了身份证图片上传校验

  try {
    loading.value = true

    // 显示提交中
    uni.showLoading({
      title: '提交中...',
      mask: true,
    })

    // 打印将要提交的数据，以便调试
    console.log('提交实名认证数据:', {
      real_name: verificationForm.value.real_name,
      id_card_number: verificationForm.value.id_card_number,
      id_card_front: 'default_id_card_front', // 使用默认值
      id_card_back: 'default_id_card_back', // 使用默认值
    })

    // 直接提交JSON数据，不使用FormData
    const res = await submitVerification({
      data: {
        real_name: verificationForm.value.real_name,
        id_card_number: verificationForm.value.id_card_number,
        id_card_front: 'default_id_card_front', // 使用默认值
        id_card_back: 'default_id_card_back', // 使用默认值
      },
    })

    // 隐藏加载提示
    uni.hideLoading()

    // 提交成功
    if (res.status === 'success') {
      uni.showToast({
        icon: 'success',
        title: '实名认证提交成功并已通过',
      })

      // 直接更新verificationStore状态为已认证
      verificationStore.setVerificationInfo({
        verified: true,
        pending: false,
        rejected: false,
        rejection_reason: '',
        real_name: (res as any).data?.real_name,
        id_card_number: (res as any).data?.id_card_number,
      })

      // 延迟1.5秒后返回首页，让用户看到成功提示
      setTimeout(() => {
        uni.reLaunch({
          url: '/pages/index/index',
        })
      }, 1500)
    } else {
      throw new Error(res.message || '提交失败')
    }
  } catch (error: any) {
    // 隐藏加载提示
    uni.hideLoading()

    console.error('提交认证失败:', error)
    // 显示错误信息
    uni.showToast({
      icon: 'none',
      title: error.data?.message || '提交失败，请重试',
    })
  } finally {
    loading.value = false
  }
}

// 页面加载时获取认证状态，只在页面首次加载时请求
onMounted(() => {
  console.log('实名认证页面加载，获取认证状态')
  fetchVerificationStatus()
})

// 使用uni-app生命周期钩子 onLoad 和 onShow
uni.$on('refreshVerificationStatus', fetchVerificationStatus)
onUnload(() => {
  uni.$off('refreshVerificationStatus')
})

// 不使用onShow钩子，避免每次页面显示都重复请求
</script>

<style>
.verification-container {
  min-height: 100vh;
  padding-bottom: 30px;
}

.form-label {
  font-weight: bold;
}

.upload-box {
  height: 200rpx;
  border: 1px dashed #ccc;
}

/* 状态框样式 */
.status-box {
  border-left: 8rpx solid;
}

.approved-box {
  background-color: #f0fff4;
  border-color: #48bb78;
}

.pending-box {
  background-color: #ebf8ff;
  border-color: #4299e1;
}

.rejected-box {
  background-color: #fff5f5;
  border-color: #f56565;
}

.info-item {
  display: flex;
  align-items: center;
}

.info-item .label {
  width: 160rpx;
}

.upload-tips {
  color: #666;
}
</style>
