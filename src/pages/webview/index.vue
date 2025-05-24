<route lang="json5">
{
  style: {
    navigationBarTitleText: '支付',
  },
}
</route>

<template>
  <view class="webview-container">
    <!-- #ifdef APP-PLUS -->
    <web-view :src="webviewUrl" @message="handleMessage"></web-view>
    <!-- #endif -->
    
    <!-- #ifdef H5 -->
    <view class="fallback-message">
      <text>正在跳转到支付页面...</text>
    </view>
    <!-- #endif -->
  </view>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { onLoad } from '@dcloudio/uni-app'

const webviewUrl = ref('')

onLoad((options) => {
  if (options.url) {
    webviewUrl.value = decodeURIComponent(options.url)
    
    // #ifdef H5
    // H5端直接跳转到目标URL
    setTimeout(() => {
      window.location.href = webviewUrl.value
    }, 1000)
    // #endif
  } else {
    uni.showToast({
      title: '参数错误',
      icon: 'none'
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 2000)
  }
})

// 处理webview消息
const handleMessage = (event: any) => {
  console.log('webview消息:', event)
  // 可以在这里处理支付结果消息
}
</script>

<style lang="scss" scoped>
.webview-container {
  width: 100%;
  height: 100vh;
}

.fallback-message {
  display: flex;
  align-items: center;
  justify-content: center;
  height: 100vh;
  font-size: 32rpx;
  color: #666;
}
</style> 