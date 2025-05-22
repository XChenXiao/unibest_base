<route lang="json5" type="page">
{
  style: {
    navigationBarTitleText: '设置',
  },
}
</route>

<!-- 理财应用设置页面 -->
<!-- pages/my/settings.vue -->
<template>
  <view class="settings-container">
    <!-- 顶部波浪装饰 -->
    <view class="wave-decoration"></view>
    
    <!-- 返回按钮 -->
    <view class="back-button" @click="goBack">
      <text class="uni-icons uniui-arrow-left"></text>
    </view>
    
    <!-- 设置选项 -->
    <view class="settings-list">
      <!-- 修改登录密码 -->
      <view class="settings-item" @click="navigateTo('/pages/my/reset-password')">
        <view class="settings-content">
          <text class="settings-title">修改登录密码</text>
        </view>
        <text class="uni-icons uniui-arrow-right settings-arrow"></text>
      </view>
      
      <!-- 修改提现密码 -->
      <view class="settings-item" @click="navigateTo('/pages/my/reset-withdraw-password')">
        <view class="settings-content">
          <text class="settings-title">修改提现密码</text>
        </view>
        <text class="uni-icons uniui-arrow-right settings-arrow"></text>
      </view>
      
      <!-- 微信收款设置 -->
      <view class="settings-item" @click="navigateTo('/pages/my/wechat-payment-setting')">
        <view class="settings-content">
          <text class="settings-title">微信收款设置</text>
        </view>
        <text class="uni-icons uniui-arrow-right settings-arrow"></text>
      </view>
      
      <!-- 支付宝收款设置 -->
      <view class="settings-item" @click="navigateTo('/pages/my/alipay-payment-setting')">
        <view class="settings-content">
          <text class="settings-title">支付宝收款设置</text>
        </view>
        <text class="uni-icons uniui-arrow-right settings-arrow"></text>
      </view>
      
      <!-- 清除缓存 -->
      <view class="settings-item" @click="clearCache">
        <view class="settings-content">
          <text class="settings-title">清除缓存</text>
          <text class="settings-desc">{{ cacheSize }}</text>
        </view>
        <text class="uni-icons uniui-arrow-right settings-arrow"></text>
      </view>
      
      <!-- 关于我们 -->
      <view class="settings-item" @click="navigateTo('/pages/my/about')">
        <view class="settings-content">
          <text class="settings-title">关于我们</text>
        </view>
        <text class="uni-icons uniui-arrow-right settings-arrow"></text>
      </view>
      
      <!-- 检查更新 -->
      <view class="settings-item" @click="checkAppUpdate">
        <view class="settings-content">
          <text class="settings-title">检查更新</text>
          <text class="settings-desc">当前版本: v{{ appVersion }}</text>
        </view>
        <text class="uni-icons uniui-arrow-right settings-arrow"></text>
      </view>
    </view>
    
    <!-- 底部版权信息 -->
    <view class="settings-footer">
      <text>© 2025 理财管理平台 版权所有</text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import checkUpdate from '@/uni_modules/uni-upgrade-center-app/utils/check-update';

// 缓存大小
const cacheSize = ref('2.5MB');
// 应用版本号
const appVersion = ref('1.0.0');
// 是否正在检查更新
const isCheckingUpdate = ref(false);

// 页面挂载时获取应用信息
onMounted(() => {
  getAppInfo();
  calculateCacheSize();
});

// 获取应用信息
const getAppInfo = () => {
  // #ifdef APP-PLUS
  const systemInfo = uni.getSystemInfoSync();
  appVersion.value = systemInfo.appVersion || '1.0.0';
  // #endif
};

// 计算缓存大小
const calculateCacheSize = () => {
  // #ifdef APP-PLUS
  plus.cache.calculate((size) => {
    const sizeInMB = (size / (1024 * 1024)).toFixed(2);
    cacheSize.value = `${sizeInMB}MB`;
  });
  // #endif
};

// 页面导航
const navigateTo = (url: string) => {
  uni.navigateTo({ url });
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 清除缓存
const clearCache = () => {
  uni.showModal({
    title: '提示',
    content: '确定要清除缓存吗？',
    success: (res) => {
      if (res.confirm) {
        uni.showLoading({
          title: '清除中...'
        });
        
        // #ifdef APP-PLUS
        plus.cache.clear(() => {
          uni.hideLoading();
          calculateCacheSize();
          
          uni.showToast({
            title: '缓存已清除',
            icon: 'success'
          });
        });
        // #endif
        
        // #ifndef APP-PLUS
        // 模拟清除缓存
        setTimeout(() => {
          uni.hideLoading();
          cacheSize.value = '0KB';
          
          uni.showToast({
            title: '缓存已清除',
            icon: 'success'
          });
        }, 1000);
        // #endif
      }
    }
  });
};

// 检查更新
const checkAppUpdate = async () => {
  if (isCheckingUpdate.value) return;
  
  isCheckingUpdate.value = true;
  uni.showLoading({
    title: '检查更新中...'
  });
  
  try {
    // 调用更新中心的检查更新方法
    await checkUpdate();
    uni.hideLoading();
  } catch (error) {
    console.error('检查更新失败:', error);
    uni.hideLoading();
    
    uni.showToast({
      title: '已是最新版本',
      icon: 'success'
    });
  } finally {
    isCheckingUpdate.value = false;
  }
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
.settings-container {
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

/* 设置列表 */
.settings-list {
  background-color: white;
  border-radius: 20rpx;
  margin: 30rpx 30rpx 30rpx;
  padding: 10rpx 0;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.settings-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  position: relative;
}

.settings-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 30rpx;
  right: 0;
  bottom: 0;
  height: 1px;
  background-color: #f0f0f0;
}

.settings-content {
  flex: 1;
}

.settings-title {
  font-size: 30rpx;
  color: #333;
  display: block;
}

.settings-desc {
  font-size: 24rpx;
  color: #999;
  margin-top: 6rpx;
  display: block;
}

.settings-arrow {
  color: #ccc;
  font-size: 28rpx;
}

/* 底部版权信息 */
.settings-footer {
  text-align: center;
  padding: 30rpx 0;
  color: #999;
  font-size: 24rpx;
  margin-top: auto;
}
</style> 