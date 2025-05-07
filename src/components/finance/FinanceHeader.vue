<template>
  <view class="header" :style="{ paddingTop: safeAreaInsets?.top + 'px' }">
    <view class="wave-decoration"></view>
    <view class="header-bg"></view>

    <!-- 菜单容器 -->
    <view class="menu-container">
      <!-- 第一行菜单 -->
      <view class="menu-row">
        <view class="menu-item" @click="handleMenuClick('scanPay')">
          <view class="menu-icon scanner-icon">
            <image src="/static/images/menu/m1-1.png" mode="aspectFit" class="menu-image"></image>
          </view>
          <view class="menu-label">扫码支付</view>
        </view>

        <view class="menu-item" @click="handleMenuClick('payment')">
          <view class="menu-icon payment-icon">
            <image src="/static/images/menu/m1-2.png" mode="aspectFit" class="menu-image"></image>
          </view>
          <view class="menu-label">收付款</view>
        </view>

        <view class="menu-item" @click="handleMenuClick('transfer')">
          <view class="menu-icon transfer-icon">
            <image src="/static/images/menu/m1-3.png" mode="aspectFit" class="menu-image"></image>
          </view>
          <view class="menu-label">转账</view>
        </view>

        <view class="menu-item" @click="handleMenuClick('account')">
          <view class="menu-icon account-icon">
            <image src="/static/images/menu/m1-4.png" mode="aspectFit" class="menu-image"></image>
          </view>
          <view class="menu-label">账户管理</view>
        </view>
      </view>
    </view>

    <!-- 插入图片 (移到菜单容器外) -->
    <view class="index-bg-container">
      <image src="/static/images/bg/indexBg.png" mode="widthFix" class="index-bg-image"></image>
    </view>

    <!-- 菜单容器（第二行） -->
    <view class="menu-container">
      <!-- 第二行菜单 -->
      <view class="menu-row">
        <view class="menu-item" @click="handleMenuClick('service')">
          <view class="menu-icon customer-icon">
            <image src="/static/images/menu/m2-1.png" mode="aspectFit" class="menu-image"></image>
          </view>
          <view class="menu-label">联系客服</view>
        </view>

        <view class="menu-item" @click="handleMenuClick('record')">
          <view class="menu-icon record-icon">
            <image src="/static/images/menu/m2-2.png" mode="aspectFit" class="menu-image"></image>
          </view>
          <view class="menu-label">收支记录</view>
        </view>

        <view class="menu-item" @click="handleMenuClick('verify')">
          <view class="menu-icon verify-icon">
            <image src="/static/images/menu/m2-3.png" mode="aspectFit" class="menu-image"></image>
          </view>
          <view class="menu-label">实名认证</view>
        </view>

        <view class="menu-item" @click="navigateToTeam">
          <view class="menu-icon promote-icon">
            <image src="/static/images/menu/m2-4.png" mode="aspectFit" class="menu-image"></image>
          </view>
          <view class="menu-label">推广</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref } from 'vue'
import { useUserStore } from '@/store'

defineProps({
  safeAreaInsets: {
    type: Object,
    default: () => ({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0,
    }),
  },
})

const emit = defineEmits(['menu-click'])
const userStore = useUserStore()

const handleMenuClick = (type: string) => {
  emit('menu-click', type)

  switch (type) {
    case 'record': // 收支记录
      uni.navigateTo({
        url: '/pages/my/wallet',
      })
      break
    case 'verify': // 实名认证
      checkVerificationStatus()
      break
    case 'service': // 联系客服
      uni.navigateTo({
        url: '/pages/my/customer-service',
      })
      break
    default:
      uni.showToast({
        title: '新功能即将上线',
        icon: 'none',
      })
      break
  }
}

// 检查实名认证状态
const checkVerificationStatus = async () => {
  try {
    // 获取用户信息，检查认证状态
    if (userStore.userInfo?.is_verified) {
      uni.showToast({
        title: '您已完成实名认证',
        icon: 'success',
      })
    } else {
      uni.navigateTo({
        url: '/pages/verification/index',
      })
    }
  } catch (error) {
    console.error('获取认证状态失败', error)
    // 出错时默认跳转到认证页面
    uni.navigateTo({
      url: '/pages/verification/index',
    })
  }
}

// 跳转到团队页面
const navigateToTeam = () => {
  uni.navigateTo({
    url: '/pages/team/index',
  })
}
</script>

<style>
/* 顶部区域 */
.header {
  position: relative;
  padding-bottom: 30rpx;
  overflow: hidden;
  background: linear-gradient(135deg, #3498db, #1a5276);
  border-bottom-right-radius: 40rpx;
  border-bottom-left-radius: 40rpx;
}
/* 波浪装饰 */
.wave-decoration {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  width: 100%;
  height: 16rpx;
  background: linear-gradient(to right, #f39c12, #e74c3c);
}
/* 顶部背景 */
.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  width: 100%;
  height: 200rpx;
  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjApIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHBhdGggZmlsbD0idXJsKCNhKSIgZD0iTTAgMGgxMDB2MTAwSDB6Ii8+PHBhdGggZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpIiBkPSJNMCAyMGMxNSAwIDIwIDEwIDQwIDEwczI1LTEwIDQwLTEwIDIwIDEwIDQwIDEwdjIwYy0yMCAwLTI1LTEwLTQwLTEwcy0yNSAxMC00MCAxMFMxNSA0MCAwIDQweiIvPjwvc3ZnPg==);
  opacity: 0.6;
}
/* 菜单容器 */
.menu-container {
  position: relative;
  z-index: 10;
  padding: 30rpx 30rpx 0;
}
/* 菜单行 */
.menu-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30rpx;
}
/* 背景图片容器 */
.index-bg-container {
  position: relative;
  width: 100%;
  padding: 0;
  margin: 0;
  overflow: hidden;
}
/* 背景图片 */
.index-bg-image {
  display: block;
  width: 100%;
  height: auto;
  vertical-align: top;
}
/* 菜单项 */
.menu-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 23%;
  padding: 20rpx 0;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}
/* 菜单图标 */
.menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80rpx;
  height: 80rpx;
  margin-bottom: 12rpx;
  border-radius: 50%;
}
/* 菜单图片样式 */
.menu-image {
  width: 50rpx;
  height: 50rpx;
}

.scanner-icon {
  background-color: rgba(52, 152, 219, 0.15);
}

.payment-icon {
  background-color: rgba(243, 156, 18, 0.15);
}

.transfer-icon {
  background-color: rgba(46, 204, 113, 0.15);
}

.account-icon {
  background-color: rgba(155, 89, 182, 0.15);
}

.customer-icon {
  background-color: rgba(231, 76, 60, 0.15);
}

.record-icon {
  background-color: rgba(52, 73, 94, 0.15);
}

.verify-icon {
  background-color: rgba(26, 188, 156, 0.15);
}

.promote-icon {
  background-color: rgba(241, 196, 15, 0.15);
}
/* 菜单文字 */
.menu-label {
  font-size: 24rpx;
  font-weight: 500;
  color: #333;
}
</style>
