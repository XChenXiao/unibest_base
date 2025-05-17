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
    <view v-if="verificationStatus && verificationStatus.data?.verification_status === 'approved'" class="status-box approved-box mb-6 p-4 rounded-lg">
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
        <text>{{ formatDate(verificationStatus.data?.verification?.verified_at || verificationStatus.data?.verification?.updated_at) }}</text>
      </view>
    </view>

    <!-- 被拒绝状态 -->
    <view v-else-if="verificationStatus && verificationStatus.data?.verification_status === 'rejected'" class="status-box rejected-box mb-6 p-4 rounded-lg">
      <view class="flex items-center mb-4">
        <text class="i-carbon-close-filled text-3xl text-red-500 mr-2"></text>
        <text class="text-lg font-bold">认证失败</text>
      </view>
      <view class="info-item mb-2">
        <text class="label text-gray-500">失败原因：</text>
        <text class="text-red-500">{{ verificationStatus.data?.verification?.remark || '认证信息有误，请重新提交' }}</text>
      </view>
    </view>

    <!-- 表单 - 仅在未认证或认证被拒绝时显示 -->
    <view v-if="!verificationStatus || verificationStatus.data?.verification_status === 'rejected' || verificationStatus.data?.verification_status === 'unsubmitted'" class="form-box">
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
      <view class="form-item mb-4">
        <view class="form-label mb-2">身份证正面照片</view>
        <view class="upload-tips text-sm text-gray-500 mb-2">请上传清晰的身份证人像面照片</view>
        <view @click="chooseImage('front')" class="upload-box bg-gray-100 p-4 rounded-lg flex items-center justify-center">
          <block v-if="frontImageUrl">
            <image :src="frontImageUrl" class="w-full" style="height: 180rpx;" mode="aspectFit" />
          </block>
          <block v-else>
            <view class="flex-col flex items-center">
              <text class="i-carbon-add-filled text-5xl text-gray-400"></text>
              <text class="text-gray-500 mt-2">上传身份证正面照片</text>
            </view>
          </block>
        </view>
      </view>
      <view class="form-item mb-4">
        <view class="form-label mb-2">身份证背面照片</view>
        <view class="upload-tips text-sm text-gray-500 mb-2">请上传清晰的身份证国徽面照片</view>
        <view @click="chooseImage('back')" class="upload-box bg-gray-100 p-4 rounded-lg flex items-center justify-center">
          <block v-if="backImageUrl">
            <image :src="backImageUrl" class="w-full" style="height: 180rpx;" mode="aspectFit" />
          </block>
          <block v-else>
            <view class="flex-col flex items-center">
              <text class="i-carbon-add-filled text-5xl text-gray-400"></text>
              <text class="text-gray-500 mt-2">上传身份证背面照片</text>
            </view>
          </block>
        </view>
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
import { useUserStore } from '@/store'
import { 
  chooseAndUploadIdCardFront, 
  chooseAndUploadIdCardBack,
  ImageType
} from '@/utils/imageUpload'

defineOptions({
  name: 'Verification',
})

// 用户状态
const userStore = useUserStore()

// 认证表单数据
const verificationForm = ref({
  real_name: '',
  id_card_number: '',
  id_card_front: '',
  id_card_back: '',
})

// 验证状态
const verificationStatus = ref<any>(null)

// 临时图片URL
const frontImageUrl = ref('')
const backImageUrl = ref('')

// 加载状态
const loading = ref(false)

// 获取认证状态
const fetchVerificationStatus = async () => {
  // 如果用户已认证，从store中获取状态，避免重复请求
  if (userStore.isVerified) {
    console.log('用户已认证，从store中获取状态')
    const storeStatus = {
      status: 'success',
      data: {
        verification_status: 'approved',
        is_verified: true,
        verification: (userStore.userInfo as any).verification || {}
      }
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

// 选择图片
const chooseImage = (type: 'front' | 'back') => {
  // 显示加载中
  uni.showLoading({
    title: '正在选择图片...',
    mask: true
  });

  // 根据类型选择不同的上传方法
  const uploadMethod = type === 'front' 
    ? chooseAndUploadIdCardFront 
    : chooseAndUploadIdCardBack
  
  try {
    loading.value = true
    
    // 调用上传方法
    uploadMethod()
      .then(res => {
        // 隐藏加载提示
        uni.hideLoading();
        
        if (res.status === 'success' && res.data) {
          // 显示本地预览（如果有URL）
          if (res.data.url) {
            if (type === 'front') {
              frontImageUrl.value = res.data.url
            } else {
              backImageUrl.value = res.data.url
            }
          }
          
          // 保存上传后的图片路径 - 优先使用file_path
          const filePath = res.data.file_path || res.data.path || '';
          console.log('上传结果:', res.data);
          
          if (type === 'front') {
            verificationForm.value.id_card_front = filePath
            console.log('身份证正面上传成功:', filePath)
          } else {
            verificationForm.value.id_card_back = filePath
            console.log('身份证背面上传成功:', filePath)
          }
          
          uni.showToast({
            icon: 'success',
            title: '上传成功',
          })
        } else {
          throw new Error(res.message || '上传失败')
        }
      })
      .catch(error => {
        // 隐藏加载提示
        uni.hideLoading();
        
        console.error('图片上传错误:', error)
        uni.showToast({
          icon: 'none',
          title: error.message || '上传失败',
        })
      })
      .finally(() => {
        loading.value = false
      })
  } catch (error: any) {
    // 隐藏加载提示
    uni.hideLoading();
    
    console.error('选择图片出错:', error)
    uni.showToast({
      icon: 'none',
      title: error.message || '上传失败',
    })
    loading.value = false
  }
}

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
  const idCardReg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
  if (!idCardReg.test(verificationForm.value.id_card_number)) {
    uni.showToast({
      icon: 'none',
      title: '身份证号码格式不正确',
    })
    return
  }
  
  if (!verificationForm.value.id_card_front) {
    uni.showToast({
      icon: 'none',
      title: '请上传身份证正面照片',
    })
    return
  }
  if (!verificationForm.value.id_card_back) {
    uni.showToast({
      icon: 'none',
      title: '请上传身份证背面照片',
    })
    return
  }

  try {
    loading.value = true
    
    // 显示提交中
    uni.showLoading({
      title: '提交中...',
      mask: true
    });
    
    // 打印将要提交的数据，以便调试
    console.log('提交实名认证数据:', {
      real_name: verificationForm.value.real_name,
      id_card_number: verificationForm.value.id_card_number,
      id_card_front: verificationForm.value.id_card_front,
      id_card_back: verificationForm.value.id_card_back
    })
    
    // 直接提交JSON数据，不使用FormData
    const res = await submitVerification({
      data: {
        real_name: verificationForm.value.real_name,
        id_card_number: verificationForm.value.id_card_number,
        id_card_front: verificationForm.value.id_card_front,
        id_card_back: verificationForm.value.id_card_back
      }
    })
    
    // 隐藏加载提示
    uni.hideLoading();
    
    // 提交成功
    if (res.status === 'success') {
      uni.showToast({
        icon: 'success',
        title: '提交成功并已通过',
      })
      
      // 重新获取验证状态
      await fetchVerificationStatus()
      
      // 更新用户信息，确保认证状态一致
      await userStore.fetchUserInfo()
    } else {
      throw new Error(res.message || '提交失败')
    }
  } catch (error: any) {
    // 隐藏加载提示
    uni.hideLoading();
    
    console.error('提交认证失败:', error)
    // 显示错误信息
    uni.showToast({
      icon: 'none',
      title: error.message || '提交失败，请重试',
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