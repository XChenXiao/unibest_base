<!-- 理财应用实名认证页面 -->
<route lang="json5">
{
  style: {
    navigationBarTitleText: '实名认证',
  },
}
</route>

<template>
  <view class="identity-verify-container">
    <!-- 顶部波浪装饰 -->
    <view class="wave-decoration"></view>
    
    <!-- 返回按钮 -->
    <view class="back-button" @click="goBack">
      <text class="uni-icons uniui-arrow-left"></text>
    </view>
    
    <!-- 页面标题 -->
    <!-- <view class="page-title">
      <text class="title-text">实名认证</text>
    </view> -->
    
    <!-- 认证状态展示 -->
    <view class="verify-status-card" style="margin-top: 20rpx;" v-if="verifyStatus !== 'none'">
      <!-- <view class="status-icon" :class="getStatusIconClass()">
        <text class="uni-icons" :class="getStatusIconName()"></text>
      </view> -->
      <text class="status-text">{{ getStatusText() }}</text>
      <text class="status-desc">{{ getStatusDesc() }}</text>
    </view>
    
    <!-- 实名认证表单 -->
    <view class="verify-form" v-if="verifyStatus === 'none' || verifyStatus === 'rejected'">
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
      
      <!-- 身份证正面上传 -->
      <view class="form-group">
        <text class="form-label">身份证人像面</text>
        <view class="upload-container" @click="chooseImage('front')" v-if="!formData.frontImage">
          <text class="uni-icons uniui-camera-filled upload-icon"></text>
          <text class="upload-text">点击上传身份证人像面</text>
        </view>
        <view class="image-preview" v-else>
          <image class="preview-image" :src="formData.frontImage" mode="aspectFit"></image>
          <view class="image-actions">
            <view class="action-btn preview-btn" @click="previewImage(formData.frontImage)">
              <image src="/static/images/view.png" class="action-icon"></image>
            </view>
            <view class="action-btn delete-btn" @click="deleteImage('front')">
              <image src="/static/images/del.png" class="action-icon"></image>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 身份证背面上传 -->
      <view class="form-group">
        <text class="form-label">身份证国徽面</text>
        <view class="upload-container" @click="chooseImage('back')" v-if="!formData.backImage">
          <text class="uni-icons uniui-camera-filled upload-icon"></text>
          <text class="upload-text">点击上传身份证国徽面</text>
        </view>
        <view class="image-preview" v-else>
          <image class="preview-image" :src="formData.backImage" mode="aspectFit"></image>
          <view class="image-actions">
            <view class="action-btn preview-btn" @click="previewImage(formData.backImage)">
              <image src="/static/images/view.png" class="action-icon"></image>
            </view>
            <view class="action-btn delete-btn" @click="deleteImage('back')">
              <image src="/static/images/del.png" class="action-icon"></image>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 提示说明 -->
      <view class="tips-container">
        <text class="tips-icon uni-icons uniui-info-filled"></text>
        <text class="tips-text">请确保上传证件清晰可见，信息完整，否则可能导致认证失败</text>
      </view>
      
      <!-- 提交按钮 -->
      <button class="submit-btn" @click="handleSubmit" :disabled="loading">{{ loading ? '提交中...' : '提交认证' }}</button>
    </view>
    
    <!-- 已通过状态下的信息展示 -->
    <view class="verify-info" v-if="verifyStatus === 'approved'">
      <view class="info-group">
        <text class="info-label">姓名</text>
        <text class="info-value">{{ userInfo.name }}</text>
      </view>
      <view class="info-group">
        <text class="info-label">身份证号</text>
        <text class="info-value">{{ maskIdNumber(userInfo.idNumber) }}</text>
      </view>
      <view class="info-group">
        <text class="info-label">认证时间</text>
        <text class="info-value">{{ userInfo.verifyTime }}</text>
      </view>
    </view>
    
    <!-- 认证被拒状态下的提示 -->
    <view class="verify-tips reject-tips" v-if="verifyStatus === 'rejected'">
      <text class="tips-large">认证未通过，请重新提交</text>
      <text class="tips-small">{{ rejectReason }}</text>
    </view>
    
    <!-- 底部版权信息 -->
    <view class="verify-footer">
      <text>© 2025 理财管理平台 版权所有</text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { useUserStore } from '@/store/user';
import { submitVerificationAPI, getVerificationStatusAPI } from '@/service/index/verification';
import { getEnvBaseUploadUrl } from '@/utils';
import { chooseAndUploadIdCardFront, chooseAndUploadIdCardBack, ImageType } from '@/utils/imageUpload';

// 获取用户状态
const userStore = useUserStore();

// 上传服务基础URL
const uploadBaseUrl = getEnvBaseUploadUrl();

// 认证状态：none-未认证，pending-审核中，approved-已通过，rejected-已拒绝
const verifyStatus = ref<'none' | 'pending' | 'approved' | 'rejected'>('none');

// 加载状态
const loading = ref(false);

// 拒绝原因
const rejectReason = ref('');

// 用户信息
const userInfo = reactive({
  name: '',
  idNumber: '',
  verifyTime: ''
});

// 表单数据
const formData = reactive({
  name: '',
  idNumber: '',
  frontImage: '',
  backImage: '',
  // 接口参数
  id_card_front: '',
  id_card_back: ''
});

// 获取状态图标样式
const getStatusIconClass = () => {
  switch (verifyStatus.value) {
    case 'pending':
      return 'pending-icon';
    case 'approved':
      return 'approved-icon';
    case 'rejected':
      return 'rejected-icon';
    default:
      return '';
  }
};

// 获取状态图标名称
const getStatusIconName = () => {
  switch (verifyStatus.value) {
    case 'pending':
      return 'uniui-spinner-cycle';
    case 'approved':
      return 'uniui-checkmark-filled';
    case 'rejected':
      return 'uniui-close-filled';
    default:
      return '';
  }
};

// 获取状态文本
const getStatusText = () => {
  switch (verifyStatus.value) {
    case 'pending':
      return '认证审核中';
    case 'approved':
      return '认证已通过';
    case 'rejected':
      return '认证未通过';
    default:
      return '';
  }
};

// 获取状态描述
const getStatusDesc = () => {
  switch (verifyStatus.value) {
    case 'pending':
      return '您的实名认证申请正在审核中，请耐心等待';
    case 'approved':
      return '您已完成实名认证，可以使用完整的平台功能';
    case 'rejected':
      return '很抱歉，您的实名认证未通过，请修改后重新提交';
    default:
      return '';
  }
};

// 身份证号码脱敏处理
const maskIdNumber = (idNumber: string) => {
  if (!idNumber) return '';
  return idNumber.replace(/^(.{6})(.*)(.{4})$/, '$1****$3');
};

// 页面加载时检查认证状态
onMounted(async () => {
  // 直接从userStore获取认证状态
  if (userStore.userInfo.is_verified) {
    // 用户已通过实名认证，直接设置状态为approved
    verifyStatus.value = 'approved';
    
    try {
      // 从用户信息或缓存中获取已认证的实名信息
      userInfo.name = userStore.userInfo.phone || '';
      
      // 如果需要更详细的实名认证信息，可以获取认证状态详情
      // 但仅当需要展示身份证号和认证时间等详细信息时才查询
      if (!userInfo.idNumber || !userInfo.verifyTime) {
        const res = await getVerificationStatusAPI();
        
        // 基于API返回的数据结构访问verification对象
        if (res.status === 'success' && res.data) {
          // 获取认证信息
          const verificationData = res.data;
          
          if (verificationData.data.verification) {
            // 填充用户信息
            const verification = verificationData.data.verification;
            userInfo.name = verification.real_name || userInfo.name;
            userInfo.idNumber = verification.id_card_number || '';
            userInfo.verifyTime = verification.verified_at || verification.updated_at || '';
          }
        }
      }
    } catch (error) {
      console.error('获取认证详情失败', error);
      // 使用基础用户信息作为备选
      userInfo.name = userStore.userInfo.phone || '';
    }
  } else {
    // 如果用户未通过实名认证，需要获取当前的认证状态
    await userStore.fetchVerificationStatus();
    
    if (userStore.isPendingVerification) {
      verifyStatus.value = 'pending';
    } else if (userStore.isRejectedVerification) {
      verifyStatus.value = 'rejected';
      rejectReason.value = userStore.verificationStatus.rejection_reason || '认证信息有误，请重新提交';
    } else {
      verifyStatus.value = 'none';
    }
  }
});

// 选择图片
const chooseImage = (type: 'front' | 'back') => {
  // 根据类型选择不同的上传方法
  const uploadMethod = type === 'front' 
    ? chooseAndUploadIdCardFront 
    : chooseAndUploadIdCardBack;
  
  loading.value = true;
  
  // 调用上传方法
  uploadMethod()
    .then(res => {
      if (res.status === 'success' && res.data) {
        // 显示本地预览（如果有URL）
        if (res.data.url) {
          if (type === 'front') {
            formData.frontImage = res.data.url;
          } else {
            formData.backImage = res.data.url;
          }
        }
        
        // 保存上传后的图片路径 - 优先使用file_path
        const filePath = res.data.file_path || res.data.path || res.data.url || '';
        console.log('上传结果:', res.data);
        
        if (type === 'front') {
          formData.id_card_front = filePath;
          console.log('身份证正面上传成功:', filePath);
        } else {
          formData.id_card_back = filePath;
          console.log('身份证背面上传成功:', filePath);
        }
        
        uni.showToast({
          icon: 'success',
          title: '上传成功',
        });
      } else {
        throw new Error(res.message || '上传失败');
      }
    })
    .catch(error => {
      console.error('图片上传错误:', error);
      uni.showToast({
        icon: 'none',
        title: typeof error === 'string' ? error : error.message || '上传失败',
      });
    })
    .finally(() => {
      loading.value = false;
    });
};

// 预览图片
const previewImage = (image: string) => {
  uni.previewImage({
    urls: [image]
  });
};

// 删除图片
const deleteImage = (type: 'front' | 'back') => {
  if (type === 'front') {
    formData.frontImage = '';
    formData.id_card_front = '';
  } else {
    formData.backImage = '';
    formData.id_card_back = '';
  }
};

// 提交认证申请
const handleSubmit = async () => {
  // 表单验证
  if (!formData.name.trim()) {
    uni.showToast({
      title: '请输入真实姓名',
      icon: 'none'
    });
    return;
  }
  
  if (!formData.idNumber.trim()) {
    uni.showToast({
      title: '请输入身份证号码',
      icon: 'none'
    });
    return;
  }
  
  // 简单的身份证格式验证
  const idCardReg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
  if (!idCardReg.test(formData.idNumber)) {
    uni.showToast({
      title: '请输入正确的身份证号码',
      icon: 'none'
    });
    return;
  }
  
  if (!formData.id_card_front) {
    uni.showToast({
      title: '请上传身份证人像面',
      icon: 'none'
    });
    return;
  }
  
  if (!formData.id_card_back) {
    uni.showToast({
      title: '请上传身份证国徽面',
      icon: 'none'
    });
    return;
  }
  
  try {
    // 显示加载状态
    loading.value = true;
    
    // 调用实名认证API - 使用真实API
    const res = await submitVerificationAPI({
      real_name: formData.name,
      id_card_number: formData.idNumber,
      id_card_front: formData.id_card_front,
      id_card_back: formData.id_card_back
    });
    
    if (res.status === 'success') {
      // 更新认证状态
      await userStore.fetchVerificationStatus();
      
      // 修改状态为已通过
      verifyStatus.value = 'approved';
      
      // 填充用户信息
      userInfo.name = formData.name;
      userInfo.idNumber = formData.idNumber;
      userInfo.verifyTime = new Date().toISOString();
      
      // 提交成功提示
      uni.showToast({
        title: '提交成功并已通过',
        icon: 'success'
      });
    }
  } catch (error: any) {
    uni.showToast({
      title: error.message || '提交失败，请重试',
      icon: 'none'
    });
  } finally {
    loading.value = false;
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
.identity-verify-container {
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

/* 页面标题 */
.page-title {
  text-align: center;
  margin-top: 130rpx;
  margin-bottom: 40rpx;
}

.title-text {
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
}

/* 认证状态卡片 */
.verify-status-card {
  background-color: white;
  border-radius: 20rpx;
  margin: 0 30rpx 30rpx;
  padding: 40rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.status-icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
}

.pending-icon {
  background-color: rgba(52, 152, 219, 0.1);
}

.pending-icon .uni-icons {
  color: #3498db;
  font-size: 60rpx;
}

.approved-icon {
  background-color: rgba(46, 204, 113, 0.1);
}

.approved-icon .uni-icons {
  color: #2ecc71;
  font-size: 60rpx;
}

.rejected-icon {
  background-color: rgba(231, 76, 60, 0.1);
}

.rejected-icon .uni-icons {
  color: #e74c3c;
  font-size: 60rpx;
}

.status-text {
  font-size: 36rpx;
  font-weight: 600;
  color: #333;
  margin-bottom: 15rpx;
}

.status-desc {
  font-size: 28rpx;
  color: #666;
  text-align: center;
}

/* 表单样式 */
.verify-form {
  background-color: white;
  border-radius: 20rpx;
  margin: 40rpx 30rpx 30rpx;
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

/* 上传容器 */
.upload-container {
  width: 100%;
  height: 280rpx;
  border: 2rpx dashed #ccc;
  border-radius: 20rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  background-color: #f8f8f8;
}

.upload-icon {
  position: static;
  font-size: 60rpx;
  color: #aaa;
  margin-bottom: 20rpx;
}

.upload-text {
  font-size: 28rpx;
  color: #888;
}

/* 图片预览 */
.image-preview {
  width: 100%;
  height: 280rpx;
  border-radius: 20rpx;
  position: relative;
  overflow: hidden;
  background-color: #f0f0f0;
}

.preview-image {
  width: 100%;
  height: 100%;
}

.image-actions {
  position: absolute;
  right: 20rpx;
  bottom: 20rpx;
  display: flex;
}

.action-btn {
  width: 70rpx;
  height: 70rpx;
  border-radius: 50%;
  // background-color: rgba(0, 0, 0, 0.5);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-left: 20rpx;
}

.action-btn .uni-icons {
  position: static;
  color: white;
  font-size: 32rpx;
}

.action-icon {
  width: 40rpx;
  height: 40rpx;
}

.preview-btn {
  // background-color: rgba(52, 152, 219, 0.8);
}

.delete-btn {
  // background-color: rgba(231, 76, 60, 0.8);
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

/* 认证信息展示 */
.verify-info {
  background-color: white;
  border-radius: 20rpx;
  margin: 0 30rpx 30rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.info-group {
  display: flex;
  justify-content: space-between;
  padding: 20rpx 0;
  border-bottom: 1px solid #f0f0f0;
}

.info-group:last-child {
  border-bottom: none;
}

.info-label {
  font-size: 28rpx;
  color: #666;
}

.info-value {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
}

/* 认证提示 */
.verify-tips {
  background-color: white;
  border-radius: 20rpx;
  margin: 0 30rpx 30rpx;
  padding: 40rpx 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
  display: flex;
  flex-direction: column;
  align-items: center;
}

.reject-tips {
  border-left: 8rpx solid #e74c3c;
}

.tips-large {
  font-size: 32rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 15rpx;
}

.tips-small {
  font-size: 28rpx;
  color: #666;
  text-align: center;
}

/* 底部版权信息 */
.verify-footer {
  text-align: center;
  padding: 30rpx 0;
  color: #999;
  font-size: 24rpx;
  margin-top: auto;
}
</style> 