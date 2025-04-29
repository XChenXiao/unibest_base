<route lang="json5">
{
  style: {
    navigationBarTitleText: '实名认证',
  },
}
</route>
<template>
  <view class="verification-container p-4">
    <view class="form-box">
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
import { ref } from 'vue'
import { submitVerificationAPI } from '@/service/index/verification'
import { uploadFile } from '@/utils/upload'
import { getEnvBaseUploadUrl } from '@/utils'

defineOptions({
  name: 'Verification',
})

// 上传服务基础URL
const uploadBaseUrl = getEnvBaseUploadUrl()

// 认证表单数据
const verificationForm = ref({
  real_name: '',
  id_card_number: '',
  id_card_front: '',
  id_card_back: '',
})

// 临时图片URL
const frontImageUrl = ref('')
const backImageUrl = ref('')

// 加载状态
const loading = ref(false)

// 选择图片
const chooseImage = (type: 'front' | 'back') => {
  uni.chooseImage({
    count: 1,
    success: (res) => {
      const tempFilePath = res.tempFilePaths[0]
      
      // 显示本地预览
      if (type === 'front') {
        frontImageUrl.value = tempFilePath
      } else {
        backImageUrl.value = tempFilePath
      }
      
      // 上传图片
      loading.value = true
      uploadFile(`${uploadBaseUrl}/api/upload`, {
        filePath: tempFilePath,
        name: 'file',
        formData: {
          type: `id_card_${type}`,
        }
      })
        .then(res => {
          if (res.status === 'success' && res.data) {
            // 保存上传后的图片路径
            if (type === 'front') {
              verificationForm.value.id_card_front = res.data.file_path
            } else {
              verificationForm.value.id_card_back = res.data.file_path
            }
            uni.showToast({
              icon: 'success',
              title: '上传成功',
            })
          }
        })
        .catch(error => {
          uni.showToast({
            icon: 'none',
            title: error.message || '上传失败',
          })
        })
        .finally(() => {
          loading.value = false
        })
    }
  })
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
    // 调用实名认证API
    const res = await submitVerificationAPI(verificationForm.value)
    
    // 提交成功
    if (res.status === 'success') {
      uni.showToast({
        icon: 'success',
        title: '提交成功，等待审核',
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
      title: error.message || '提交失败，请重试',
    })
  } finally {
    loading.value = false
  }
}
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
</style> 