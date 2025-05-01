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
            <text class="uni-icons uniui-scan"></text>
          </view>
          <view class="menu-label">扫码支付</view>
        </view>
        
        <view class="menu-item" @click="handleMenuClick('payment')">
          <view class="menu-icon payment-icon">
            <text class="uni-icons uniui-card"></text>
          </view>
          <view class="menu-label">收付款</view>
        </view>
        
        <view class="menu-item" @click="handleMenuClick('transfer')">
          <view class="menu-icon transfer-icon">
            <text class="uni-icons uniui-upload"></text>
          </view>
          <view class="menu-label">转账</view>
        </view>
        
        <view class="menu-item" @click="handleMenuClick('account')">
          <view class="menu-icon account-icon">
            <text class="uni-icons uniui-person"></text>
          </view>
          <view class="menu-label">账户管理</view>
        </view>
      </view>
      
      <!-- 第二行菜单 -->
      <view class="menu-row">
        <view class="menu-item" @click="handleMenuClick('service')">
          <view class="menu-icon customer-icon">
            <text class="uni-icons uniui-headphone"></text>
          </view>
          <view class="menu-label">联系客服</view>
        </view>
        
        <view class="menu-item" @click="handleMenuClick('record')">
          <view class="menu-icon record-icon">
            <text class="uni-icons uniui-list"></text>
          </view>
          <view class="menu-label">收支记录</view>
        </view>
        
        <view class="menu-item" @click="handleMenuClick('verify')">
          <view class="menu-icon verify-icon">
            <text class="uni-icons uniui-checkbox-filled"></text>
          </view>
          <view class="menu-label">实名认证</view>
        </view>
        
        <view class="menu-item" @click="handleMenuClick('promote')">
          <view class="menu-icon promote-icon">
            <text class="uni-icons uniui-rmb"></text>
          </view>
          <view class="menu-label">推广</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
defineProps({
  safeAreaInsets: {
    type: Object,
    default: () => ({
      top: 0,
      bottom: 0,
      left: 0,
      right: 0
    })
  }
})

const emit = defineEmits(['menu-click'])

const handleMenuClick = (type: string) => {
  emit('menu-click', type)
}
</script>

<style>
/* 顶部区域 */
.header {
  position: relative;
  background: linear-gradient(135deg, #3498db, #1a5276);
  padding-bottom: 30rpx;
  border-bottom-left-radius: 40rpx;
  border-bottom-right-radius: 40rpx;
  overflow: hidden;
}

/* 波浪装饰 */
.wave-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 16rpx;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  z-index: 2;
}

/* 顶部背景 */
.header-bg {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 200rpx;
  background-image: url(data:image/svg+xml;base64,PHN2ZyB4bWxucz0iaHR0cDovL3d3dy53My5vcmcvMjAwMC9zdmciIHZpZXdCb3g9IjAgMCAxMDAgMTAwIj48ZGVmcz48bGluZWFyR3JhZGllbnQgaWQ9ImEiIHgxPSIwJSIgeTE9IjAlIiB4Mj0iMTAwJSIgeTI9IjEwMCUiPjxzdG9wIG9mZnNldD0iMCUiIHN0b3AtY29sb3I9InJnYmEoMjU1LCAyNTUsIDI1NSwgMC4xKSIvPjxzdG9wIG9mZnNldD0iMTAwJSIgc3RvcC1jb2xvcj0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjApIi8+PC9saW5lYXJHcmFkaWVudD48L2RlZnM+PHBhdGggZmlsbD0idXJsKCNhKSIgZD0iTTAgMGgxMDB2MTAwSDB6Ii8+PHBhdGggZmlsbD0icmdiYSgyNTUsIDI1NSwgMjU1LCAwLjIpIiBkPSJNMCAyMGMxNSAwIDIwIDEwIDQwIDEwczI1LTEwIDQwLTEwIDIwIDEwIDQwIDEwdjIwYy0yMCAwLTI1LTEwLTQwLTEwcy0yNSAxMC00MCAxMFMxNSA0MCAwIDQweiIvPjwvc3ZnPg==);
  opacity: 0.6;
  z-index: 1;
}

/* 菜单容器 */
.menu-container {
  position: relative;
  padding: 30rpx 30rpx 0;
  z-index: 10;
}

/* 菜单行 */
.menu-row {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30rpx;
}

/* 菜单项 */
.menu-item {
  width: 23%;
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.95);
  border-radius: 20rpx;
  padding: 20rpx 0;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
}

/* 菜单图标 */
.menu-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 12rpx;
}

.scanner-icon {
  background-color: rgba(52, 152, 219, 0.15);
  color: #3498db;
}

.payment-icon {
  background-color: rgba(243, 156, 18, 0.15);
  color: #f39c12;
}

.transfer-icon {
  background-color: rgba(46, 204, 113, 0.15);
  color: #2ecc71;
}

.account-icon {
  background-color: rgba(155, 89, 182, 0.15);
  color: #9b59b6;
}

.customer-icon {
  background-color: rgba(231, 76, 60, 0.15);
  color: #e74c3c;
}

.record-icon {
  background-color: rgba(52, 73, 94, 0.15);
  color: #34495e;
}

.verify-icon {
  background-color: rgba(26, 188, 156, 0.15);
  color: #1abc9c;
}

.promote-icon {
  background-color: rgba(241, 196, 15, 0.15);
  color: #f1c40f;
}

/* 菜单文字 */
.menu-label {
  font-size: 24rpx;
  color: #333;
  font-weight: 500;
}

/* 图标样式 */
.uni-icons {
  font-size: 40rpx;
}
</style> 