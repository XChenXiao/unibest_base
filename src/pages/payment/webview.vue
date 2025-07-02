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

// 支付URL和返回页面参数
const paymentUrl = ref('')
const returnPage = ref('')

// 页面加载
onLoad((options) => {
  // 获取支付URL
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
  
  // 获取返回页面参数
  if (options.returnPage) {
    returnPage.value = options.returnPage
    console.log('返回页面参数:', returnPage.value)
  }
})

// 根据returnPage参数决定如何返回
const handleReturn = () => {
  if (returnPage.value === 'gold-purchase') {
    // 支付成功时，返回到支付页面，由支付页面处理后续逻辑
    console.log('webview支付完成，返回到黄金支付页面')
    uni.navigateBack()
  } else {
    // 默认返回到上一页
    uni.navigateBack()
  }
}

// 处理WebView消息
const handleMessage = (event: any) => {
  console.log('收到WebView消息:', event)
  // 处理支付结果消息
  if (event.detail && event.detail.data) {
    const data = event.detail.data
    if (data.type === 'payment_success') {
      // 显示支付成功提示
      uni.showToast({
        title: '支付成功！',
        icon: 'success',
        duration: 2000
      })
      // 返回到指定页面
      setTimeout(() => {
        handleReturn()
      }, 2000)
    } else if (data.type === 'payment_failed') {
      uni.showToast({
        title: '支付失败，请重试',
        icon: 'none',
        duration: 2000
      })
      // 支付失败也返回到指定页面
      setTimeout(() => {
        handleReturn()
      }, 2000)
    }
  }
}

// 监听页面关闭事件，确保返回到正确页面
const handlePageClose = () => {
  console.log('支付页面关闭，返回到指定页面')
  handleReturn()
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