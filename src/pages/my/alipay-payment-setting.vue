<route lang="json5" type="page">
{
  style: {
    navigationBarTitleText: '支付宝收款设置',
  },
}
</route>

<!-- 支付宝收款设置页面 -->
<!-- pages/my/alipay-payment-setting.vue -->
<template>
  <view class="payment-setting-container">
    <!-- 顶部波浪装饰 -->
    <view class="wave-decoration"></view>
    
    <!-- 返回按钮 -->
    <view class="back-button" @click="goBack">
      <text class="uni-icons uniui-arrow-left"></text>
    </view>
    
    <view class="page-header">
      <!-- <text class="page-title">支付宝收款设置</text> -->
    </view>
    
    <view class="setting-form">
      <!-- 支付宝账号 -->
      <!-- <view class="form-item">
        <text class="form-label">支付宝账号</text>
        <input 
          class="form-input"
          type="text"
          v-model="formData.account"
          placeholder="请输入支付宝账号或手机号"
        />
      </view> -->

      <!-- 真实姓名 -->
      <!-- <view class="form-item">
        <text class="form-label">真实姓名</text>
        <input 
          class="form-input"
          type="text"
          v-model="formData.real_name"
          placeholder="请输入支付宝实名认证的姓名"
        />
      </view> -->

      <!-- 收款码上传 -->
      <view class="form-item qrcode-item">
        <text class="form-label">收款二维码</text>
        
        <view class="upload-container">
          <view class="upload-area" @click="chooseImage" v-if="!formData.alipay_qrcode_url">
            <text class="uni-icons uniui-camera"></text>
            <text class="upload-text">上传收款码</text>
          </view>
          
          <view class="qrcode-preview" v-else>
            <image 
              class="qrcode-image" 
              :src="formData.alipay_qrcode_url" 
              mode="aspectFit"
            ></image>
            <view class="qrcode-actions">
              <text class="action-btn" @click="previewImage">预览</text>
              <text class="action-btn" @click="reUpload">重新上传</text>
            </view>
          </view>
        </view>
      </view>
      
      <view class="tips-box">
        <view class="tip-item">
          <text class="uni-icons uniui-info"></text>
          <text class="tip-text">请确保上传真实有效的支付宝收款码</text>
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
import { ref, reactive, onMounted } from 'vue';
import { useUserStore } from '@/store/user';
import { http } from '@/utils/http';
import { chooseAndUploadAlipayQRCode } from '@/utils/imageUpload';

// 用户存储
const userStore = useUserStore();

// 表单数据
const formData = reactive({
  account: '',  // 支付宝账号
  real_name: '',  // 真实姓名
  alipay_qrcode_url: '',  // 二维码URL
});

// 状态变量
const isSubmitting = ref(false);
const isLoading = ref(true);

// 页面加载时获取已有的支付信息
onMounted(async () => {
  try {
    isLoading.value = true;
    
    const res = await http.get<{
      wechat_name: string;
      wechat_phone: string;
      wechat_qrcode_url: string;
      alipay_account: string;
      alipay_real_name: string;
      alipay_qrcode_url: string;
    }>('/api/payment-info');
    
    if (res.data) {
      formData.account = res.data.alipay_account || '';
      formData.real_name = res.data.alipay_real_name || '';
      formData.alipay_qrcode_url = res.data.alipay_qrcode_url || '';
      console.log('获取到的支付宝信息:', formData);
    }
  } catch (error) {
    console.error('获取支付信息失败:', error);
    uni.showToast({
      title: error.message || '获取数据失败',
      icon: 'none',
      duration: 2000
    });
  } finally {
    isLoading.value = false;
  }
});

// 选择图片
const chooseImage = async () => {
  try {
    // 使用统一的选择并上传方法
    const result = await chooseAndUploadAlipayQRCode();
    
    if (result.status === 'success' && result.data?.url) {
      // 更新二维码URL
      formData.alipay_qrcode_url = result.data.url;
      
      uni.showToast({
        title: '上传成功',
        icon: 'success'
      });
    } else {
      throw new Error(result.message || '上传失败');
    }
  } catch (error) {
    console.error('上传二维码失败:', error);
    uni.showToast({
      title: error.message || '上传失败，请重试',
      icon: 'none'
    });
  }
};

// 重新上传
const reUpload = () => {
  chooseImage();
};

// 预览图片
const previewImage = () => {
  if (!formData.alipay_qrcode_url) return;
  
  uni.previewImage({
    urls: [formData.alipay_qrcode_url],
    current: formData.alipay_qrcode_url
  });
};

// 保存设置
const saveSettings = async () => {
  // 验证表单
  // 移除账号和姓名的校验
  /* if (!formData.account) {
    uni.showToast({
      title: '请输入支付宝账号',
      icon: 'none'
    });
    return;
  }
  
  if (!formData.real_name) {
    uni.showToast({
      title: '请输入真实姓名',
      icon: 'none'
    });
    return;
  } */
  
  if (!formData.alipay_qrcode_url) {
    uni.showToast({
      title: '请上传支付宝收款码',
      icon: 'none'
    });
    return;
  }
  
  try {
    isSubmitting.value = true;
    
    const res = await http.post('/api/payment-info', {
      // 保留账号和姓名字段，但使用空值或已有值
      alipay_account: formData.account || '',
      alipay_real_name: formData.real_name || '',
      alipay_qrcode: formData.alipay_qrcode_url
    });
    
    if (res.status === 'success') {
      uni.showToast({
        title: '设置保存成功',
        icon: 'success'
      });
      
      // 延迟返回
      setTimeout(() => {
        uni.navigateBack();
      }, 1500);
    } else {
      throw new Error(res.message || '保存失败');
    }
  } catch (error) {
    console.error('保存设置失败:', error);
    uni.showToast({
      title: error.message || '保存失败，请重试',
      icon: 'none'
    });
  } finally {
    isSubmitting.value = false;
  }
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};
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
  background: linear-gradient(to right, #1677ff, #0091ff);
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
  width: 100%;
  box-sizing: border-box;
}

.form-item {
  margin-bottom: 30rpx;
  width: 100%;
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
  color: #1677ff;
  padding: 10rpx 20rpx;
  background-color: #e6f7ff;
  border-radius: 8rpx;
}

/* 提示框 */
.tips-box {
  background-color: #e6f7ff;
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
  color: #1677ff;
  font-size: 30rpx;
  margin-right: 10rpx;
}

.tip-text {
  font-size: 24rpx;
  color: #1677ff;
}

/* 按钮样式 */
.btn-wrapper {
  margin-top: 60rpx;
  padding: 0 30rpx;
}

.save-btn {
  background: linear-gradient(to right, #1677ff, #0091ff);
  color: white;
  font-size: 32rpx;
  font-weight: 500;
  height: 95rpx;
  line-height: 95rpx;
  border-radius: 48rpx;
  text-align: center;
  box-shadow: 0 6rpx 20rpx rgba(22, 119, 255, 0.3);
  transition: all 0.3s;
}

.save-btn:active {
  opacity: 0.8;
  transform: translateY(3rpx);
}

.save-btn[disabled] {
  background: linear-gradient(to right, #91caff, #69b1ff);
  opacity: 0.7;
}

/* 表单输入框 */
.form-input {
  width: 100%;
  height: 88rpx;
  background-color: #f9f9f9;
  border-radius: 12rpx;
  padding: 0 24rpx;
  font-size: 28rpx;
  color: #333;
  border: 2rpx solid #eee;
  box-sizing: border-box;
}

.form-input:focus {
  border-color: #1677ff;
  background-color: #fff;
}
</style> 