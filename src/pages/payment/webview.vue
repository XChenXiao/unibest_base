<route lang="json5">
{
  style: {
    navigationBarTitleText: '支付',
  },
}
</route>

<template>
  <view class="payment-webview-container">
    <web-view :src="paymentUrl" @message="handleMessage"></web-view>
  </view>
</template>

<script setup lang="ts">
import { ref, onMounted } from 'vue'
import { onLoad, onUnload } from '@dcloudio/uni-app'

// 支付URL
const paymentUrl = ref('')

// 页面加载
onLoad((options) => {
  if (options.url) {
    try {
      paymentUrl.value = decodeURIComponent(options.url)
      console.log('支付页面URL:', paymentUrl.value)
    } catch (error) {
      console.error('解析支付URL失败:', error)
      uni.showToast({
        title: '支付链接无效',
        icon: 'none'
      })
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    }
  } else {
    uni.showToast({
      title: '支付链接不存在',
      icon: 'none'
    })
    setTimeout(() => {
      uni.navigateBack()
    }, 1500)
  }
})

// 处理WebView消息
const handleMessage = (event: any) => {
  console.log('收到WebView消息:', event)
  // 处理支付结果消息
  if (event.detail && event.detail.data) {
    const data = event.detail.data
    if (data.type === 'payment_success') {
      uni.showToast({
        title: '支付成功',
        icon: 'success'
      })
      // 返回到上一页
      setTimeout(() => {
        uni.navigateBack()
      }, 1500)
    } else if (data.type === 'payment_failed') {
      uni.showToast({
        title: '支付失败',
        icon: 'none'
      })
    }
  }
}

// 页面卸载
onUnload(() => {
  console.log('支付页面卸载')
})
</script>

<style lang="scss">
.payment-webview-container {
  width: 100%;
  height: 100vh;
}
</style> 