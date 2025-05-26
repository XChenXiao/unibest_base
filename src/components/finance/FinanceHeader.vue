<template>
  <view class="header">
    <view class="header-bg"></view>

    <!-- 菜单容器 -->
    <view class="menu-container first-row-menu">
      <!-- 第一行菜单 -->
      <view class="menu-row">
        <view class="menu-item" @click="handleMenuClick('scanPay')">
          <view class="menu-icon scanner-icon">
            <image src="/static/images/menu/m1-1.png" mode="aspectFit" class="menu-image"></image>
          </view>
          <view class="menu-label line1">扫码支付</view>
        </view>

        <view class="menu-item" @click="handleMenuClick('payment')">
          <view class="menu-icon payment-icon">
            <image src="/static/images/menu/m1-2.png" mode="aspectFit" class="menu-image"></image>
          </view>
          <view class="menu-label line1">收付款</view>
        </view>

        <view class="menu-item" @click="handleMenuClick('transfer')">
          <view class="menu-icon transfer-icon">
            <image src="/static/images/menu/m1-3.png" mode="aspectFit" class="menu-image"></image>
          </view>
          <view class="menu-label line1">转账</view>
        </view>

        <view class="menu-item" @click="handleMenuClick('account')">
          <view class="menu-icon account-icon">
            <image src="/static/images/menu/m1-4.png" mode="aspectFit" class="menu-image"></image>
          </view>
          <view class="menu-label line1">账户管理</view>
        </view>
      </view>
    </view>

    <!-- 菜单容器（第二行） -->
    <view class="menu-container second-row-menu">
      <!-- 第二行菜单 -->

      <view class="menu-row">
        <view class="menu-item" @click="handleMenuClick('record')">
          <view class="menu-icon-simple">
            <image
              src="/static/images/menu/m2-1.png"
              mode="aspectFit"
              class="menu-image-simple"
              style="width: 82rpx; height: 82rpx"
            ></image>
          </view>
          <view class="menu-label">收支记录</view>
        </view>

        <view class="menu-item" @click="handleMenuClick('verify')">
          <view class="menu-icon-simple">
            <image
              src="/static/images/menu/m2-2.png"
              mode="aspectFit"
              class="menu-image-simple"
            ></image>
          </view>
          <view class="menu-label">实名认证</view>
        </view>

        <view class="menu-item" @click="navigateToInviteFriend">
          <view class="menu-icon-simple">
            <image
              src="/static/images/menu/m2-3.png"
              mode="aspectFit"
              class="menu-image-simple"
            ></image>
          </view>
          <view class="menu-label">推广</view>
        </view>

        <view class="menu-item" @click="navigateToTeam">
          <view class="menu-icon-simple">
            <image
              src="/static/images/menu/m2-4.png"
              mode="aspectFit"
              class="menu-image-simple"
            ></image>
          </view>
          <view class="menu-label">我的团队</view>
        </view>

        <view class="menu-item" @click="handleMenuClick('service')">
          <view class="menu-icon-simple">
            <image
              src="/static/images/menu/m2-5.png"
              mode="aspectFit"
              class="menu-image-simple"
            ></image>
          </view>
          <view class="menu-label">联系客服</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, defineEmits } from 'vue'
import { useUserStore, useVerificationStore } from '@/store'

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
const verificationStore = useVerificationStore()

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
    if (verificationStore.isVerified) {
      uni.showToast({
        title: '您已实名',
        icon: 'success',
      })
      return // 添加return语句，确保已认证用户不会继续执行跳转
    }

    // 未认证用户才会执行到这里
    uni.navigateTo({
      url: '/pages/my/identity-verify',
    })
  } catch (error) {
    console.error('跳转到实名认证页面失败', error)
    // 出错时也尝试跳转到认证页面
    uni.navigateTo({
      url: '/pages/my/identity-verify',
    })
  }
}

// 跳转到邀请好友页面
const navigateToInviteFriend = () => {
  // 检查实名认证状态
  if (!verificationStore.isVerified) {
    uni.showModal({
      title: '需要实名认证',
      content: '推广功能需要完成实名认证后才能使用，请先完成实名认证。',
      confirmText: '去认证',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 用户点击确认，跳转到实名认证页面
          uni.navigateTo({
            url: '/pages/my/identity-verify',
          })
        }
      }
    })
    return
  }

  // 已认证用户才可以进入邀请好友页面
  uni.navigateTo({
    url: '/pages/team/invite-poster',
  })
}

// 跳转到我的团队页面
const navigateToTeam = () => {
  // 检查实名认证状态
  if (!verificationStore.isVerified) {
    uni.showModal({
      title: '需要实名认证',
      content: '我的团队功能需要完成实名认证后才能使用，请先完成实名认证。',
      confirmText: '去认证',
      cancelText: '取消',
      success: (res) => {
        if (res.confirm) {
          // 用户点击确认，跳转到实名认证页面
          uni.navigateTo({
            url: '/pages/my/identity-verify',
          })
        }
      }
    })
    return
  }

  // 已认证用户才可以进入我的团队页面
  uni.navigateTo({
    url: '/pages/team/index',
  })
}
</script>

<style lang="scss">
/* 顶部区域 */
.header {
  position: relative;
  padding-bottom: 30rpx;
  overflow: hidden;
  border-bottom-right-radius: 10rpx;
  border-bottom-left-radius: 10rpx;
}
/* 顶部背景 */
.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 1;
  width: 100%;
  height: 200rpx;
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
  /* margin-bottom: 30rpx; */
  background-color: transparent;
}
/* 背景图片容器 */
.index-bg-container {
  display: none;
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
  border-radius: 20rpx;
  transition: transform 0.2s ease;
}
.menu-item:active {
  transform: scale(0.95);
}
/* 第一行菜单图标 (带背景色) */
.menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 90rpx;
  height: 90rpx;
  margin-bottom: 12rpx;
  border-radius: 14rpx;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.2);
}
/* 第二行菜单图标 (无背景) */
.menu-icon-simple {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 90rpx;
  height: 90rpx;
  margin-bottom: 12rpx;
}
/* 菜单图片样式 */
.menu-image {
  width: 65rpx;
  height: 65rpx;
}

.menu-image-simple {
  width: 92rpx;
  height: 92rpx;
}

.scanner-icon {
  background-color: rgba(231, 76, 60, 1);
}

.payment-icon {
  background-color: rgba(231, 76, 60, 1);
}

.transfer-icon {
  background-color: rgba(231, 76, 60, 1);
}

.account-icon {
  background-color: rgba(231, 76, 60, 1);
}
/* 菜单文字 */
.menu-label {
  font-size: 24rpx;
  font-weight: 500;
  color: #ffffff;
  &.line1 {
    color: rgb(0, 0, 0);
  }
}
/* 第二行菜单容器 */
.second-row-menu {
  padding: 30rpx 30rpx 0;
  margin: 30rpx 30rpx 0;
  background: linear-gradient(135deg, #3498db, #1a5276);
  border-radius: 20rpx;
}
/* 第一行菜单容器 */
.first-row-menu {
  padding-bottom: 170rpx;
  /* border-radius: 20rpx; */
  // margin-top: 17rpx;
  background-image: url('@/static/images/bg/topHeader.png');
  background-repeat: no-repeat;
  background-size: 100% 100%;
}
</style>
