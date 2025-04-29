<template>
  <view>
    <!-- 股权卡片 -->
    <view class="equity-card">
      <view class="equity-summary">
        <view class="equity-info">
          <text class="equity-label">持有股权</text>
          <view class="equity-amount">
            <text class="equity-value">{{ formatAmount(equityInfo.holdAmount) }}</text>
            <text class="equity-unit">股</text>
          </view>
        </view>
        <view class="equity-info">
          <text class="equity-label">股权价格</text>
          <view class="equity-amount">
            <text class="equity-value">{{ formatAmount(equityInfo.price) }}</text>
            <text class="equity-unit">元/股</text>
          </view>
        </view>
      </view>
      
      <!-- 出售股权按钮已移除 -->
    </view>
    
    <!-- 股权奖励列表 -->
    <view class="reward-section">
      <view class="section-header">
        <text class="section-title">股权奖励</text>
      </view>
      
      <view class="reward-list">
        <!-- 注册实名奖励 -->
        <view class="reward-item">
          <view class="reward-icon">
            <text class="uni-icons uniui-person-filled"></text>
          </view>
          <view class="reward-info">
            <text class="reward-title">注册实名奖励</text>
            <text class="reward-desc">完成注册并实名认证可获得股权奖励</text>
          </view>
          <view class="reward-action">
            <view class="reward-amount">{{ equityInfo.registerReward }}股</view>
            <button 
              class="reward-btn" 
              :class="{ 'received-btn': equityInfo.isRegisterRewardReceived }"
              @click="handleClaimReward('register')"
            >
              {{ equityInfo.isRegisterRewardReceived ? '已领取' : '领取' }}
            </button>
          </view>
        </view>
        
        <!-- 邀请奖励 -->
        <view class="reward-item">
          <view class="reward-icon invite-icon">
            <text class="uni-icons uniui-upload"></text>
          </view>
          <view class="reward-info">
            <text class="reward-title">邀请注册实名奖励</text>
            <text class="reward-desc">邀请好友注册并完成实名认证</text>
            <view class="progress-container">
              <view class="progress-bar">
                <view 
                  class="progress-filled" 
                  :style="{ width: (equityInfo.inviteProgress / equityInfo.inviteTarget * 100) + '%' }"
                ></view>
              </view>
              <text class="progress-text">{{ equityInfo.inviteProgress }}/{{ equityInfo.inviteTarget }}</text>
            </view>
          </view>
          <view class="reward-action">
            <view class="reward-amount">{{ equityInfo.inviteReward }}股</view>
            <button 
              class="reward-btn" 
              :class="{ 'disabled-btn': equityInfo.inviteProgress < equityInfo.inviteTarget }"
              @click="handleClaimReward('invite')"
            >
              领取
            </button>
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits } from 'vue';

const props = defineProps({
  equityInfo: {
    type: Object,
    required: true
  }
});

const emit = defineEmits(['open-sell-equity', 'claim-reward']);

// 打开出售股权弹窗
const openSellEquity = () => {
  emit('open-sell-equity');
};

// 领取奖励
const handleClaimReward = (type: string) => {
  emit('claim-reward', type);
};

// 格式化金额显示
const formatAmount = (amount: number) => {
  return amount.toFixed(2);
};
</script>

<style lang="scss" scoped>
/* 股权卡片 */
.equity-card {
  background: linear-gradient(135deg, #f9f9f9, #f0f0f0);
  border-radius: 16rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  border: 1px solid rgba(255, 255, 255, 0.6);
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.equity-summary {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30rpx;
}

.equity-info {
  display: flex;
  flex-direction: column;
}

.equity-label {
  font-size: 26rpx;
  color: #666;
  margin-bottom: 10rpx;
}

.equity-amount {
  display: flex;
  align-items: baseline;
}

.equity-value {
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
  margin-right: 8rpx;
}

.equity-unit {
  font-size: 24rpx;
  color: #666;
}

/* 股权奖励区域 */
.reward-section {
  margin-bottom: 20rpx;
}

.section-header {
  margin-bottom: 20rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
}

.reward-list {
  background-color: #f8f8f8;
  border-radius: 16rpx;
  overflow: hidden;
}

.reward-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  position: relative;
}

.reward-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 20rpx;
  right: 20rpx;
  bottom: 0;
  height: 1px;
  background-color: #e5e5e5;
}

.reward-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  background-color: rgba(46, 204, 113, 0.15);
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.reward-icon .uni-icons {
  color: #2ecc71;
  font-size: 36rpx;
}

.invite-icon {
  background-color: rgba(52, 152, 219, 0.15);
}

.invite-icon .uni-icons {
  color: #3498db;
}

.reward-info {
  flex: 1;
}

.reward-title {
  font-size: 28rpx;
  color: #333;
  font-weight: 500;
  margin-bottom: 6rpx;
  display: block;
}

.reward-desc {
  font-size: 24rpx;
  color: #999;
  margin-bottom: 10rpx;
  display: block;
}

.progress-container {
  display: flex;
  align-items: center;
  margin-top: 10rpx;
}

.progress-bar {
  flex: 1;
  height: 10rpx;
  background-color: #e0e0e0;
  border-radius: 5rpx;
  overflow: hidden;
  margin-right: 15rpx;
}

.progress-filled {
  height: 100%;
  background: linear-gradient(to right, #3498db, #2980b9);
}

.progress-text {
  font-size: 22rpx;
  color: #999;
}

.reward-action {
  display: flex;
  flex-direction: column;
  align-items: center;
}

.reward-amount {
  font-size: 26rpx;
  color: #f39c12;
  margin-bottom: 10rpx;
}

.reward-btn {
  background-color: #f39c12;
  color: white;
  font-size: 24rpx;
  padding: 8rpx 20rpx;
  border-radius: 30rpx;
  border: none;
  line-height: 1.5;
}

.received-btn {
  background-color: #bdc3c7;
}

.disabled-btn {
  background-color: #bdc3c7;
  opacity: 0.7;
}
</style> 