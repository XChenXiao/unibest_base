<route lang="json5">
{
  style: {
    navigationBarTitleText: '联系客服',
    navigationBarBackgroundColor: '#3498db',
    navigationBarTextStyle: 'white',
  },
}
</route>

<template>
  <view class="container">
    <!-- 加载中提示 -->
    <view class="loading-container" v-if="loading">
      <wd-loading color="#3498db" />
      <text class="loading-text">加载中...</text>
    </view>

    <!-- 加载失败提示 -->
    <view class="error-container" v-else-if="error">
      <view class="error-icon">
        <wd-icon name="warn-fill" size="80" color="#e74c3c" />
      </view>
      <text class="error-text">{{ errorMsg }}</text>
      <wd-button type="primary" size="small" @click="loadData">重新加载</wd-button>
    </view>

    <!-- 客服信息内容 -->
    <block v-else-if="serviceInfo">
      <view class="service-header">
        <view class="service-title">客服中心</view>
        <view class="service-subtitle">全天候为您提供优质服务</view>
      </view>

      <!-- 调试信息面板 -->
      <view class="debug-panel" v-if="isDebug">
        <view class="debug-title">调试信息:</view>
        <view class="debug-item">推广信息: {{ serviceInfo.promotion_info || '无' }}</view>
        <view class="debug-item">群号: {{ serviceInfo.promotion_group_number || '无' }}</view>
        <view class="debug-item">二维码URL: {{ qrcodeUrl || '无' }}</view>
      </view>

      <!-- 二维码区域 -->
      <view class="qrcode-section">
        <view class="qrcode-container">
          <image
            class="qrcode-image"
            src="https://api.qrserver.com/v1/create-qr-code/?size=300x300&data=客服信息"
            mode="aspectFit"
          ></image>
          <view class="qrcode-tip">扫码添加客服</view>
          <!-- 调试信息 -->
          <view class="qrcode-url" v-if="isDebug">{{ qrcodeUrl || '使用固定二维码图片' }}</view>
        </view>
      </view>

      <view class="info-section">
        <view class="info-card">
          <view class="info-title">客服信息</view>
          <view class="info-content">
            <text class="info-text">{{ serviceInfo.promotion_info }}</text>
          </view>
        </view>

        <view class="info-card">
          <view class="info-title">交流群号</view>
          <view class="info-content group-content">
            <text class="group-number">{{ serviceInfo.promotion_group_number }}</text>
            <view class="copy-button" @click="copyGroupNumber">
              <wd-icon name="copy" size="20" color="#3498db" />
              <text class="copy-text">复制</text>
            </view>
          </view>
        </view>
      </view>

      <view class="contact-tips">
        <view class="tip-item">
          <wd-icon name="time" size="18" color="#3498db" />
          <text class="tip-text">工作时间: 9:00-22:00</text>
        </view>
        <view class="tip-item">
          <wd-icon name="warning" size="18" color="#e67e22" />
          <text class="tip-text">请勿轻信任何索要账号、密码的要求</text>
        </view>
      </view>

      <!-- 调试按钮 -->
      <view class="debug-button" @click="toggleDebug">
        <wd-icon name="setting" size="16" color="#999" />
      </view>
    </block>

    <!-- 无数据提示 -->
    <view class="empty-container" v-else>
      <wd-icon name="warn-outline" size="60" color="#bdc3c7" />
      <text class="empty-text">暂无客服信息</text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { getCustomerServiceInfoAPI, CustomerServiceInfo } from '@/service/app/customer-service'

defineOptions({
  name: 'CustomerService',
})

// 数据
const loading = ref(true)
const error = ref(false)
const errorMsg = ref('获取客服信息失败，请稍后重试')
const serviceInfo = ref<CustomerServiceInfo | null>(null)
const isDebug = ref(false) // 调试模式开关
const imageError = ref(false) // 图片加载错误标志

// 计算属性：处理二维码URL
const qrcodeUrl = computed(() => {
  if (!serviceInfo.value) return ''

  let url = ''

  // 优先从qrcode_details获取URL
  if (serviceInfo.value.qrcode_details && serviceInfo.value.qrcode_details.url) {
    url = serviceInfo.value.qrcode_details.url
  }
  // 如果qrcode_details不存在，尝试从promotion_qrcode_url获取
  else if (serviceInfo.value.promotion_qrcode_url) {
    url = serviceInfo.value.promotion_qrcode_url
  }

  // 如果图片加载出错，则返回空字符串
  if (imageError.value) {
    return ''
  }

  // 直接返回后端提供的URL，不做任何处理
  return url
})

// 本地默认数据（API失败时使用）
const defaultServiceInfo: CustomerServiceInfo = {
  promotion_info: '测试推广信息',
  promotion_group_number: '测试推广群号',
  promotion_qrcode_url: null,
  is_active: true,
}

// 处理API返回的不完整数据，填充默认值
const processApiData = (data: any): CustomerServiceInfo => {
  return {
    promotion_info: data.promotion_info || defaultServiceInfo.promotion_info,
    promotion_group_number:
      data.promotion_group_number || defaultServiceInfo.promotion_group_number,
    promotion_qrcode_url: data.promotion_qrcode_url || null,
    qrcode_details: data.qrcode_details || null,
    is_active: data.is_active !== undefined ? data.is_active : true,
  }
}

// 生命周期
onMounted(() => {
  loadData()
})

// 加载客服数据
const loadData = async () => {
  loading.value = true
  error.value = false
  imageError.value = false

  try {
    const res = await getCustomerServiceInfoAPI()
    console.log('API返回数据:', res)

    if (res && res.data && res.data.data) {
      // 处理API返回的数据
      serviceInfo.value = processApiData(res.data.data)
      console.log('处理后的客服信息:', serviceInfo.value)
    } else {
      // 使用默认数据
      serviceInfo.value = defaultServiceInfo
      console.log('使用默认客服信息')
    }
  } catch (err) {
    console.error('获取客服信息失败:', err)
    // 使用默认数据
    serviceInfo.value = defaultServiceInfo
    console.log('API错误，使用默认客服信息')
  } finally {
    loading.value = false
  }
}

// 处理图片加载错误
const handleImageError = (e: any) => {
  console.error('二维码图片加载失败:', e)
  console.error('尝试加载的URL:', qrcodeUrl.value)
  imageError.value = true

  uni.showToast({
    title: '二维码图片加载失败',
    icon: 'none',
  })

  // 添加调试信息
  if (!isDebug.value) {
    isDebug.value = true // 自动打开调试面板
    uni.showToast({
      title: '已开启调试模式，查看URL',
      icon: 'none',
    })
  }
}

// 复制群号
const copyGroupNumber = () => {
  if (!serviceInfo.value?.promotion_group_number) {
    uni.showToast({
      title: '群号不可用',
      icon: 'none',
    })
    return
  }

  uni.setClipboardData({
    data: serviceInfo.value.promotion_group_number,
    success: () => {
      uni.showToast({
        title: '复制成功',
        icon: 'success',
      })
    },
  })
}

// 切换调试模式
const toggleDebug = () => {
  isDebug.value = !isDebug.value
}
</script>

<style>
page {
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f5f5;
}

.container {
  position: relative;
  box-sizing: border-box;
  width: 100%;
  min-height: 100vh;
  padding: 30rpx;
  background-color: #f5f5f5;
}
/* 加载状态 */
.loading-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400rpx;
}

.loading-text {
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #666;
}
/* 错误状态 */
.error-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
}

.error-icon {
  margin-bottom: 20rpx;
}

.error-text {
  margin-bottom: 30rpx;
  font-size: 28rpx;
  color: #666;
}
/* 空状态 */
.empty-container {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400rpx;
}

.empty-text {
  margin-top: 20rpx;
  font-size: 28rpx;
  color: #999;
}
/* 头部样式 */
.service-header {
  margin-bottom: 40rpx;
  text-align: center;
}

.service-title {
  margin-bottom: 10rpx;
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
}

.service-subtitle {
  font-size: 26rpx;
  color: #666;
}
/* 调试面板 */
.debug-panel {
  padding: 20rpx;
  margin-bottom: 20rpx;
  font-family: monospace;
  font-size: 24rpx;
  color: #fff;
  background-color: #000;
  border-radius: 10rpx;
}

.debug-title {
  margin-bottom: 10rpx;
  font-weight: bold;
  color: #ff9800;
}

.debug-item {
  margin-bottom: 5rpx;
  word-break: break-all;
}

.debug-button {
  position: absolute;
  right: 50rpx;
  bottom: 50rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  width: 60rpx;
  height: 60rpx;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 30rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.1);
}
/* 二维码区域 */
.qrcode-section {
  box-sizing: border-box;
  display: flex;
  justify-content: center;
  width: 100%;
  padding: 30rpx;
  margin-bottom: 30rpx;
  background-color: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.05);
}

.qrcode-container {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.qrcode-image {
  width: 400rpx;
  height: 400rpx;
  background-color: #f9f9f9;
  border: 1rpx solid #eee;
}

.qrcode-tip {
  margin-top: 20rpx;
  font-size: 26rpx;
  color: #666;
}

.qrcode-url {
  max-width: 400rpx;
  margin-top: 10rpx;
  font-size: 20rpx;
  color: #999;
  text-align: center;
  word-break: break-all;
}
/* 信息区域 */
.info-section {
  width: 100%;
  margin-bottom: 30rpx;
}

.info-card {
  box-sizing: border-box;
  width: 100%;
  padding: 30rpx;
  margin-bottom: 20rpx;
  background-color: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.05);
}

.info-title {
  padding-left: 20rpx;
  margin-bottom: 20rpx;
  font-size: 30rpx;
  font-weight: bold;
  color: #333;
  border-left: 8rpx solid #3498db;
}

.info-content {
  padding: 10rpx;
}

.info-text {
  font-size: 28rpx;
  line-height: 1.5;
  color: #666;
}

.group-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.group-number {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
}

.copy-button {
  display: flex;
  align-items: center;
  padding: 10rpx 20rpx;
  background-color: #ecf0f1;
  border-radius: 30rpx;
}

.copy-text {
  margin-left: 6rpx;
  font-size: 24rpx;
  color: #3498db;
}
/* 提示区域 */
.contact-tips {
  box-sizing: border-box;
  width: 100%;
  padding: 30rpx;
  background-color: #fff;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.05);
}

.tip-item {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.tip-item:last-child {
  margin-bottom: 0;
}

.tip-text {
  margin-left: 10rpx;
  font-size: 26rpx;
  color: #666;
}
</style>
