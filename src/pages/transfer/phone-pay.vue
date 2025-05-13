<route lang="json5">
{
  style: {
    navigationBarTitleText: '手机号收款',
  },
}
</route>

<template>
  <view class="phone-pay-container">
    <!-- 返回按钮 -->
    <view class="back-button" @click="goBack">
      <wd-icon name="arrow-left" size="36rpx" />
    </view>
    
    <!-- 页面标题 -->
    <view class="page-title">
      <text class="title-text">手机号收款</text>
    </view>
    
    <!-- 收款表单 -->
    <view class="form-card">
      <view class="form-item">
        <view class="form-label">收款人手机号</view>
        <view class="form-input-wrapper">
          <input
            class="form-input"
            type="text"
            maxlength="11"
            v-model="phoneNumber"
            placeholder="请输入对方手机号码"
          />
          <wd-icon v-if="phoneNumber" name="close-circle" @click="clearPhoneNumber" size="36rpx" color="#999" />
        </view>
      </view>
      
      <!-- 最近联系人 -->
      <view class="recent-contacts">
        <view class="recent-title">最近联系人</view>
        <view class="contacts-list">
          <view class="contact-item" v-for="(contact, index) in recentContacts" :key="index" @click="selectContact(contact)">
            <view class="contact-avatar">
              <text>{{ contact.name.charAt(0) }}</text>
            </view>
            <view class="contact-info">
              <text class="contact-name">{{ contact.name }}</text>
              <text class="contact-phone">{{ contact.phone }}</text>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 下一步按钮 -->
      <button class="submit-button" :disabled="!isValidPhone" @click="handleNext">下一步</button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue';

// 手机号
const phoneNumber = ref('');

// 最近联系人
const recentContacts = ref([
  { name: '张三', phone: '13800138000' },
  { name: '李四', phone: '13900139000' },
  { name: '王五', phone: '13700137000' },
]);

// 验证手机号是否有效
const isValidPhone = computed(() => {
  const phoneRegex = /^1[3-9]\d{9}$/;
  return phoneRegex.test(phoneNumber.value);
});

// 清除手机号
const clearPhoneNumber = () => {
  phoneNumber.value = '';
};

// 选择联系人
const selectContact = (contact: { name: string; phone: string }) => {
  phoneNumber.value = contact.phone;
};

// 下一步
const handleNext = () => {
  if (!isValidPhone.value) {
    uni.showToast({
      title: '请输入有效的手机号码',
      icon: 'none'
    });
    return;
  }
  
  // 跳转到转账金额输入页面
  uni.navigateTo({
    url: `/pages/transfer/amount?phone=${phoneNumber.value}`
  });
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};
</script>

<style lang="scss">
page {
  background-color: #f5f5f5;
  min-height: 100%;
}

.phone-pay-container {
  padding: 30rpx;
}

/* 返回按钮 */
.back-button {
  margin-bottom: 30rpx;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 页面标题 */
.page-title {
  margin-bottom: 40rpx;
}

.title-text {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
}

/* 表单卡片 */
.form-card {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.form-input-wrapper {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 15rpx;
}

.form-input {
  flex: 1;
  height: 80rpx;
  font-size: 34rpx;
}

/* 最近联系人 */
.recent-contacts {
  margin-top: 40rpx;
  margin-bottom: 40rpx;
}

.recent-title {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
}

.contacts-list {
  display: flex;
  flex-direction: column;
}

.contact-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1px solid #f0f0f0;
}

.contact-avatar {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: #3498db;
  color: #ffffff;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 36rpx;
  margin-right: 20rpx;
}

.contact-info {
  flex: 1;
}

.contact-name {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 8rpx;
  display: block;
}

.contact-phone {
  font-size: 26rpx;
  color: #999;
}

/* 提交按钮 */
.submit-button {
  width: 100%;
  height: 90rpx;
  border-radius: 45rpx;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 500;
  background: linear-gradient(to right, #2196f3, #03a9f4);
  margin-top: 40rpx;
}

.submit-button[disabled] {
  background: #cccccc;
  color: #ffffff;
}
</style> 