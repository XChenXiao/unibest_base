<route lang="json5" type="page">
{
  style: {
    navigationBarTitleText: '微信收款设置',
  },
}
</route>

<!-- 微信收款设置页面 -->
<!-- pages/my/wechat-payment-setting.vue -->
<template>
  <view class="payment-setting-container">
    <!-- 顶部波浪装饰 -->
    <view class="wave-decoration"></view>

    
    <view class="setting-form" style="margin-top: 60rpx;">
      <!-- 微信账号 -->
      <!-- <view class="form-item">
        <text class="form-label">微信账号</text>
        <input 
          class="form-input"
          type="text"
          v-model="formData.account"
          placeholder="请输入微信账号或手机号"
        />
      </view> -->

      <!-- 真实姓名 -->
      <!-- <view class="form-item">
        <text class="form-label">真实姓名</text>
        <input 
          class="form-input"
          type="text"
          v-model="formData.real_name"
          placeholder="请输入微信实名认证的姓名"
        />
      </view> -->

      <!-- 收款码上传 -->
      <view class="form-item qrcode-item">
        <text class="form-label">收款二维码</text>
        
        <view class="upload-container">
          <view class="upload-area" @click="chooseQRCode" v-if="!formData.qrcode">
            <text class="uni-icons uniui-camera"></text>
            <text class="upload-text">上传收款码</text>
          </view>
          
          <view class="qrcode-preview" v-else>
            <image 
              class="qrcode-image" 
              :src="formData.qrcode" 
              mode="aspectFit"
            ></image>
            <view class="qrcode-actions">
              <text class="action-btn" @click="previewQRCode">预览</text>
              <text class="action-btn" @click="reUpload">重新上传</text>
            </view>
          </view>
        </view>
      </view>
      
      <view class="tips-box">
        <view class="tip-item">
          <text class="uni-icons uniui-info"></text>
          <text class="tip-text">请确保上传真实有效的微信收款码</text>
        </view>
        <view class="tip-item">
          <text class="uni-icons uniui-info"></text>
          <text class="tip-text">为保障资金安全，请勿使用他人收款码</text>
        </view>
      </view>
    </view>
    
    <!-- 保存按钮 -->
    <view class="btn-wrapper">
      <button class="save-btn" @click="saveSettings" :disabled="isSubmitting">
        {{ isSubmitting ? '提交中...' : '保存设置' }}
      </button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { useUserStore } from '@/store/user'
import { chooseAndUploadWechatQRCode } from '@/utils/imageUpload'
import { getPaymentInfo, updatePaymentInfo } from '@/service/app/wechat'

// 用户存储
const userStore = useUserStore()

// 表单数据
const formData = reactive({
  account: '',  // 微信账号
  real_name: '',  // 真实姓名
  qrcode: '',  // 二维码URL
})

// 状态变量
const isSubmitting = ref(false)
const isLoading = ref(true)

// 页面加载时获取已有的支付信息
onMounted(async () => {
  try {
    isLoading.value = true
    
    const res = await getPaymentInfo()
    
    if (res.status === 'success' && res.data) {
      formData.qrcode = res.data.wechat_qrcode_url || ''
      formData.account = res.data.wechat_name || ''
      formData.real_name = res.data.wechat_phone || ''  // 这里使用 wechat_phone 字段作为真实姓名
    }
  } catch (error) {
    console.error('获取支付信息失败:', error)
    uni.showToast({
      title: error.message || '获取数据失败',
      icon: 'none',
      duration: 2000
    })
  } finally {
    isLoading.value = false
  }
})

// 选择二维码图片
const chooseQRCode = async () => {
  try {
    const result = await chooseAndUploadWechatQRCode()
    
    if (result.status === 'success' && result.data?.url) {
      formData.qrcode = result.data.url
      
      uni.showToast({
        title: '上传成功',
        icon: 'success'
      })
    } else {
      throw new Error(result.message || '上传失败')
    }
  } catch (error) {
    console.error('上传二维码失败:', error)
    uni.showToast({
      title: error.message || '上传失败，请重试',
      icon: 'none'
    })
  }
}

// 重新上传
const reUpload = () => {
  chooseQRCode()
}

// 预览二维码
const previewQRCode = () => {
  if (!formData.qrcode) return
  
  uni.previewImage({
    urls: [formData.qrcode],
    current: formData.qrcode
  })
}

// 保存设置
const saveSettings = async () => {
  // 验证表单
  // if (!formData.account) {
  //   uni.showToast({
  //     title: '请输入微信账号',
  //     icon: 'none'
  //   })
  //   return
  // }
  
  // if (!formData.real_name) {
  //   uni.showToast({
  //     title: '请输入真实姓名',
  //     icon: 'none'
  //   })
  //   return
  // }

  if (!formData.qrcode) {
    uni.showToast({
      title: '请上传微信收款码',
      icon: 'none'
    })
    return
  }
  
  try {
    isSubmitting.value = true
    
    const res = await updatePaymentInfo({
      wechat_qrcode: formData.qrcode
    })
    
    if (res.status === 'success') {
      uni.showToast({
        title: '设置保存成功',
        icon: 'success'
      })
      
      // 延迟返回
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else {
      throw new Error(res.message || '保存失败')
    }
  } catch (error) {
    console.error('保存设置失败:', error)
    uni.showToast({
      title: error.message || '保存失败，请重试',
      icon: 'none'
    })
  } finally {
    isSubmitting.value = false
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
.payment-setting-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
  padding: 0 30rpx;
}

/* 顶部波浪装饰 */
.wave-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 16rpx;
  background: linear-gradient(to right, #07c160, #2ecc71);
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

/* 页面标题 */
.page-header {
  margin-top: 120rpx;
  margin-bottom: 40rpx;
  text-align: center;
}

.page-title {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
}

/* 表单样式 */
.setting-form {
  background-color: white;
  border-radius: 20rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.form-item {
  margin-bottom: 30rpx;
}

.qrcode-item {
  margin-bottom: 40rpx;
}

.form-label {
  display: block;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
  font-weight: 500;
}

.form-input {
  width: 100%;
  height: 90rpx;
  background-color: #f9f9f9;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #333;
}

/* 上传区域 */
.upload-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.upload-area {
  width: 300rpx;
  height: 300rpx;
  background-color: #f9f9f9;
  border: 2rpx dashed #ddd;
  border-radius: 10rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin: 20rpx auto;
}

.upload-area .uni-icons {
  font-size: 60rpx;
  color: #ccc;
  margin-bottom: 20rpx;
}

.upload-text {
  font-size: 28rpx;
  color: #999;
}

/* 二维码预览 */
.qrcode-preview {
  width: 300rpx;
  margin: 20rpx auto;
}

.qrcode-image {
  width: 300rpx;
  height: 300rpx;
  border-radius: 10rpx;
  background-color: #f9f9f9;
  border: 1px solid #eee;
}

.qrcode-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 20rpx;
}

.action-btn {
  font-size: 26rpx;
  color: #07c160;
  padding: 10rpx 20rpx;
  background-color: #e6ffed;
  border-radius: 8rpx;
}

/* 提示框 */
.tips-box {
  background-color: #e6ffed;
  border-radius: 10rpx;
  padding: 20rpx;
  margin-top: 20rpx;
}

.tip-item {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}

.tip-item:last-child {
  margin-bottom: 0;
}

.tip-item .uni-icons {
  color: #07c160;
  font-size: 30rpx;
  margin-right: 10rpx;
}

.tip-text {
  font-size: 24rpx;
  color: #07c160;
}

/* 按钮样式 */
.btn-wrapper {
  margin-top: 60rpx;
  padding: 0 30rpx;
}

.save-btn {
  width: 100%;
  height: 90rpx;
  background: linear-gradient(to right, #07c160, #2ecc71);
  border-radius: 45rpx;
  color: #fff;
  font-size: 32rpx;
  font-weight: 500;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 16rpx rgba(7, 193, 96, 0.2);
}

.save-btn:disabled {
  background: #ccc;
  box-shadow: none;
}
</style> 