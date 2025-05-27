<template>
  <view>
    <!-- 加载状态 -->
    <view v-if="loading" class="equity-loading">
      <view class="loading-spinner"></view>
      <text class="loading-text">加载股权数据中...</text>
    </view>
    
    <!-- 股权内容 -->
    <view v-else>
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

        <!-- 股权操作按钮 -->
        <view class="equity-actions">
          <button class="action-btn records-btn" @click="goToEquityRecords">股权记录</button>
          <!-- 注释：出售股权按钮 -->
          <!-- <button class="action-btn sell-btn" @click="openSellEquity" v-if="equityInfo.holdAmount > 0">出售股权</button> -->
        </view>
      </view>

      <!-- 股权奖励组件 -->
      <equity-rewards
        :register-reward="equityInfo.registerReward"
        :invite-reward="equityInfo.inviteReward"
        :is-register-reward-claimed="equityInfo.isRegisterRewardReceived"
        :has-claimable-registration="equityInfo.hasClaimableRegistration"
        :is-verified="equityInfo.isVerified"
        :invite-progress="equityInfo.inviteProgress"
        :invite-target="equityInfo.inviteTarget"
        :invitation-reward-claimed="equityInfo.invitationRewardClaimed"
        :has-claimable-invitation="equityInfo.hasClaimableInvitation"
        :invitation-rewards="equityInfo.invitationRewards"
        :registration-description="registrationRewardDescription"
        :is-register-reward-active="equityInfo.registrationReward?.is_active || false"
        @claim-reward="handleClaimReward"
      />
    </view>
  </view>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits, computed } from 'vue'
import EquityRewards from '@/components/equity/EquityRewards.vue'

const props = defineProps({
  equityInfo: {
    type: Object,
    required: true,
    default: () => ({
      holdAmount: 0,
      price: 0,
      registerReward: 0,
      inviteReward: 0,
      isRegisterRewardReceived: false,
      hasClaimableRegistration: false,
      isVerified: false,
      inviteProgress: 0,
      inviteTarget: 5,
      invitationRewardClaimed: false,
      hasClaimableInvitation: false,
      invitationRewards: [],
      registrationReward: {
        id: 0,
        amount: 0,
        description: '',
        is_active: false,
      },
    }),
  },
  loading: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['open-sell-equity', 'claim-reward'])

// 计算注册奖励描述
const registrationRewardDescription = computed(() => {
  // 调试日志 - 确认股权数据传递状态
  console.log('EquityTab 组件接收到的奖励数据:', {
    'isRegisterRewardClaimed(是否已领取)': props.equityInfo.isRegisterRewardReceived,
    'hasClaimableRegistration(是否可领取)': props.equityInfo.hasClaimableRegistration,
    'isVerified(是否已实名)': props.equityInfo.isVerified,
  })

  if (
    props.equityInfo.invitationRewards &&
    props.equityInfo.invitationRewards.length > 0 &&
    props.equityInfo.registrationReward
  ) {
    // 如果存在注册奖励配置，返回它的描述
    return props.equityInfo.registrationReward.description || '完成注册并实名认证可获得股权奖励'
  }
  return '完成注册并实名认证可获得股权奖励'
})

// 领取奖励
const handleClaimReward = (type: string) => {
  emit('claim-reward', type)
}

// 跳转到股权记录页面
const goToEquityRecords = () => {
  uni.navigateTo({
    url: '/pages/equity-records/index',
  })
}

// 格式化金额显示
const formatAmount = (amount: number) => {
  return Number(amount).toFixed(2)
}
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
  flex: 1;
  padding: 0 20rpx;
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

/* 股权操作按钮 */
.equity-actions {
  margin-top: 30rpx;
  display: flex;
  justify-content: flex-end;
  gap: 20rpx; /* 按钮之间的间距 */
}

.action-btn {
  padding: 12rpx 40rpx;
  border-radius: 40rpx;
  font-size: 28rpx;
  border: none;
}

.sell-btn {
  background: linear-gradient(to right, #f39c12, #e74c3c);
  color: white;
}

.records-btn {
  background: linear-gradient(to right, #3498db, #2980b9);
  color: white;
}

/* 加载状态 */
.equity-loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  padding: 60rpx 0;
  background-color: #f9f9f9;
  border-radius: 16rpx;
  margin-bottom: 30rpx;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  border: 4rpx solid #f3f3f3;
  border-top: 4rpx solid #f39c12;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-bottom: 20rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #666;
}

/* 旋转动画 */
@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}
</style>
