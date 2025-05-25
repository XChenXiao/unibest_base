<template>
  <wd-popup
    v-model="showPopup"
    round
    closeable
    position="center"
    :close-on-click-overlay="false"
    class="verification-required-popup"
    :style="{ zIndex: 10001 }"
    modal-style="z-index: 10001;"
    :close-on-click-modal="false"
    custom-style="background-color: transparent;z-index: 10001;"
  >
    <view class="popup-content">
      <!-- 图标 -->
      <view class="popup-icon">
        <wd-icon name="warn-fill" size="60" color="#e74c3c" />
      </view>

      <!-- 标题 -->
      <view class="popup-title">
        <text>需要实名认证</text>
      </view>

      <!-- 内容 -->
      <view class="popup-body">
        <text class="popup-message">{{ message }}</text>
      </view>

      <!-- 按钮 -->
      <view class="popup-footer">
        <button class="cancel-btn" @click="handleCancel">取消</button>
        <button class="verify-btn" @click="handleGoToVerify">去实名认证</button>
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { ref, computed } from 'vue'

// 定义属性
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  message: {
    type: String,
    default: '该功能需要完成实名认证后才能使用，请先完成实名认证。',
  },
})

// 定义事件
const emit = defineEmits(['update:modelValue', 'cancel', 'confirm'])

// 内部状态
const showPopup = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// 取消操作
const handleCancel = () => {
  showPopup.value = false
  emit('cancel')
}

// 跳转到实名认证页面
const handleGoToVerify = () => {
  showPopup.value = false
  emit('confirm')
  
  // 跳转到实名认证页面
  uni.navigateTo({
    url: '/pages/my/identity-verify',
  })
}
</script>

<style lang="scss" scoped>
.verification-required-popup {
  z-index: 10001 !important;
}

:deep(.wd-popup),
:deep(.wd-popup__content) {
  z-index: 10001 !important;
}

.popup-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 600rpx;
  padding: 60rpx 40rpx 40rpx;
  background-color: #fff;
  border-radius: 20rpx;
  text-align: center;
}

.popup-icon {
  margin-bottom: 30rpx;
}

.popup-title {
  margin-bottom: 30rpx;
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
}

.popup-body {
  margin-bottom: 50rpx;
}

.popup-message {
  font-size: 28rpx;
  line-height: 1.6;
  color: #666;
}

.popup-footer {
  display: flex;
  width: 100%;
  gap: 20rpx;
}

.cancel-btn,
.verify-btn {
  flex: 1;
  height: 80rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  border: none;
}

.cancel-btn {
  background-color: #f5f5f5;
  color: #666;
}

.verify-btn {
  background-color: #3498db;
  color: #fff;
}

.cancel-btn:active {
  background-color: #e0e0e0;
}

.verify-btn:active {
  background-color: #2980b9;
}
</style> 