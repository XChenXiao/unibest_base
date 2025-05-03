<template>
  <view class="equity-rewards-container">
    <!-- 奖励模块标题 -->
    <view class="rewards-title">
      <text class="title-text">股权奖励</text>
    </view>
    
    <!-- 奖励卡片列表 -->
    <view class="rewards-list">
      <!-- 注册实名奖励卡片 -->
      <view class="reward-card">
        <view class="reward-icon-container">
          <view class="reward-icon register-icon">
            <text class="uni-icons uniui-person-filled"></text>
          </view>
        </view>
        <view class="reward-content">
          <view class="reward-header">
            <text class="reward-name">注册实名奖励</text>
            <text class="reward-amount">{{ registerReward }}股</text>
          </view>
          <text class="reward-desc">{{ registrationDescription || '完成注册并实名认证可获得股权奖励' }}</text>
          <button 
            class="reward-btn" 
            :class="{
              'claimed-btn': registerButtonStatus.claimed,
              'disabled-btn': registerButtonStatus.disabled && !registerButtonStatus.claimed
            }"
            :disabled="registerButtonStatus.disabled" 
            @click="claimReward('register')"
          >
            <text>{{ registerButtonStatus.text }}</text>
          </button>
        </view>
      </view>
      
      <!-- 邀请奖励卡片（多个） -->
      <view 
        v-for="(reward, index) in sortedInvitationRewards" 
        :key="reward.id" 
        class="reward-card"
      >
        <view class="reward-icon-container">
          <view class="reward-icon invite-icon">
            <text class="uni-icons uniui-upload"></text>
          </view>
        </view>
        <view class="reward-content">
          <view class="reward-header">
            <text class="reward-name">邀请奖励</text>
            <text class="reward-amount">{{ reward.amount }}股</text>
          </view>
          <text class="reward-desc">{{ reward.description }}</text>
          <!-- 进度条 -->
          <view class="progress-container">
            <view class="progress-bar">
              <view 
                class="progress-filled" 
                :style="{ width: `${(reward.currentInvites / reward.inviteCount) * 100}%` }"
              ></view>
            </view>
            <text class="progress-text">{{ reward.currentInvites }}/{{ reward.inviteCount }}</text>
          </view>
          <button 
            class="reward-btn" 
            :class="{
              'claimed-btn': getInviteRewardButtonStatus(reward).claimed,
              'disabled-btn': getInviteRewardButtonStatus(reward).disabled && !getInviteRewardButtonStatus(reward).claimed
            }" 
            :disabled="getInviteRewardButtonStatus(reward).disabled"
            @click="claimInviteReward(reward.id)"
          >
            <text>{{ getInviteRewardButtonStatus(reward).text }}</text>
          </button>
        </view>
      </view>
      
      <!-- 当没有邀请奖励时显示单个邀请奖励卡片 -->
      <view v-if="!invitationRewards || invitationRewards.length === 0" class="reward-card">
        <view class="reward-icon-container">
          <view class="reward-icon invite-icon">
            <text class="uni-icons uniui-upload"></text>
          </view>
        </view>
        <view class="reward-content">
          <view class="reward-header">
            <text class="reward-name">邀请注册实名奖励</text>
            <text class="reward-amount">{{ inviteReward }}股</text>
          </view>
          <text class="reward-desc">邀请好友注册并完成实名认证</text>
          <!-- 进度条 -->
          <view class="progress-container">
            <view class="progress-bar">
              <view 
                class="progress-filled" 
                :style="{ width: `${(inviteProgress / inviteTarget) * 100}%` }"
              ></view>
            </view>
            <text class="progress-text">{{ inviteProgress }}/{{ inviteTarget }}</text>
          </view>
          <button 
            class="reward-btn" 
            :class="{
              'claimed-btn': inviteButtonStatus.claimed,
              'disabled-btn': inviteButtonStatus.disabled && !inviteButtonStatus.claimed
            }" 
            :disabled="inviteButtonStatus.disabled"
            @click="claimReward('invite')"
          >
            <text>{{ inviteButtonStatus.text }}</text>
          </button>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { defineProps, defineEmits, computed } from 'vue';

// 邀请奖励接口定义
interface InvitationReward {
  id: number;
  amount: number;
  inviteCount: number;
  description: string;
  hasClaimed: boolean;
  hasClaimable: boolean;
  currentInvites: number;
  claimInfo: string;
}

// 定义属性
const props = defineProps({
  registerReward: {
    type: Number,
    default: 0
  },
  inviteReward: {
    type: Number,
    default: 0
  },
  isRegisterRewardClaimed: {
    type: Boolean,
    default: false
  },
  hasClaimableRegistration: {
    type: Boolean,
    default: false
  },
  isVerified: {
    type: Boolean,
    default: false
  },
  inviteProgress: {
    type: Number,
    default: 0
  },
  inviteTarget: {
    type: Number,
    default: 1
  },
  invitationRewardClaimed: {
    type: Boolean,
    default: false
  },
  hasClaimableInvitation: {
    type: Boolean,
    default: false
  },
  // 新增属性：注册奖励描述
  registrationDescription: {
    type: String,
    default: ''
  },
  // 新增属性：邀请奖励配置数组
  invitationRewards: {
    type: Array as () => InvitationReward[],
    default: () => []
  }
});

// 定义事件
const emit = defineEmits(['claim-reward']);

// 计算注册奖励按钮状态
const registerButtonStatus = computed(() => {
  // 更新注释以反映正确的状态含义
  console.log('注册奖励按钮状态计算:', {
    'isRegisterRewardClaimed(是否已领取)': props.isRegisterRewardClaimed,
    'hasClaimableRegistration(是否可领取)': props.hasClaimableRegistration,
    'isVerified(是否已实名)': props.isVerified
  });
  
  // 已领取
  if (props.isRegisterRewardClaimed) {
    return { text: '已领取', disabled: true, claimed: true };
  }
  // 未实名认证
  if (!props.isVerified) {
    return { text: '请先完成实名认证', disabled: true, claimed: true };
  }
  // 不可领取
  if (!props.hasClaimableRegistration) {
    return { text: '暂不可领取', disabled: true, claimed: true };
  }
  // 可领取
  return { text: '领取奖励', disabled: false, claimed: false };
});

// 计算邀请奖励按钮状态 (用于单个邀请奖励)
const inviteButtonStatus = computed(() => {
  // 已领取
  if (props.invitationRewardClaimed) {
    return { text: '已领取', disabled: true, claimed: true };
  }
  // 可领取
  if (props.hasClaimableInvitation) {
    return { text: '领取奖励', disabled: false, claimed: false };
  }
  // 不可领取
  return { text: `需要邀请${props.inviteTarget}人`, disabled: true, claimed: false };
});

// 计算特定邀请奖励的按钮状态
const getInviteRewardButtonStatus = (reward: InvitationReward) => {
  // 已领取
  if (reward.hasClaimed) {
    return { text: '已领取', disabled: true, claimed: true };
  }
  // 不可领取，但有提示信息
  if (reward.claimInfo && !reward.hasClaimable) {
    return { text: reward.claimInfo.replace(/（.*?）|\(.*?\)/g, ''), disabled: true, claimed: false };
  }
  // 可领取
  if (reward.hasClaimable) {
    return { text: '领取奖励', disabled: false, claimed: false };
  }
  // 默认不可领取状态
  return { text: `需要邀请${reward.inviteCount}人`, disabled: true, claimed: false };
};

// 领取奖励处理函数
const claimReward = (type: 'register' | 'invite') => {
  // 调试日志 - 确认按钮点击时的状态
  console.log('EquityRewards 组件状态:', {
    'type': type,
    'isRegisterRewardClaimed(是否已领取)': props.isRegisterRewardClaimed,
    'hasClaimableRegistration(是否可领取)': props.hasClaimableRegistration,
    'isVerified(是否已实名)': props.isVerified
  });
  
  if (type === 'register') {
    // 检查按钮状态是否禁用
    if (registerButtonStatus.value.disabled) {
      return;
    }
  }
  
  if (type === 'invite') {
    // 检查按钮状态是否禁用
    if (inviteButtonStatus.value.disabled) {
      return;
    }
  }
  
  // 触发领取奖励事件
  emit('claim-reward', type);
};

// 领取特定ID的邀请奖励
const claimInviteReward = (rewardId: number) => {
  emit('claim-reward', `invite_${rewardId}`);
};

// 对邀请奖励进行排序 - 按照邀请数量从大到小排序
const sortedInvitationRewards = computed(() => {
  if (!props.invitationRewards || props.invitationRewards.length === 0) {
    return [];
  }
  
  // 按照邀请目标数量从小到大排序
  return [...props.invitationRewards].sort((a, b) => {
    // 先按照邀请要求数量排序
    return a.inviteCount - b.inviteCount;
  });
});

</script>

<style lang="scss">
.equity-rewards-container {
  width: 100%;
  padding: 0 20rpx;
}

.rewards-title {
  margin-bottom: 24rpx;
}

.title-text {
  font-size: 34rpx;
  font-weight: 600;
  color: #333;
}

.rewards-list {
  display: flex;
  flex-direction: column;
  gap: 20rpx;
}

.reward-card {
  display: flex;
  background: #FFFFFF;
  border-radius: 16rpx;
  box-shadow: 0 4rpx 16rpx rgba(0, 0, 0, 0.04);
  padding: 24rpx;
  position: relative;
  overflow: hidden;
}

.reward-card::before {
  content: '';
  position: absolute;
  left: 0;
  top: 0;
  height: 100%;
  width: 6rpx;
}

.reward-card:nth-child(1)::before {
  background: linear-gradient(to bottom, #2ecc71, #27ae60);
}

.reward-card:nth-child(2)::before {
  background: linear-gradient(to bottom, #3498db, #2980b9);
}

.reward-icon-container {
  margin-right: 20rpx;
}

.reward-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.register-icon {
  background-color: rgba(46, 204, 113, 0.1);
}

.register-icon .uni-icons {
  color: #2ecc71;
  font-size: 40rpx;
}

.invite-icon {
  background-color: rgba(52, 152, 219, 0.1);
}

.invite-icon .uni-icons {
  color: #3498db;
  font-size: 40rpx;
}

.reward-content {
  flex: 1;
}

.reward-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 10rpx;
}

.reward-name {
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
}

.reward-amount {
  font-size: 32rpx;
  font-weight: 600;
  color: #f39c12;
}

.reward-desc {
  font-size: 24rpx;
  color: #888;
  margin-bottom: 16rpx;
}

.progress-container {
  display: flex;
  align-items: center;
  margin-bottom: 16rpx;
}

.progress-bar {
  flex: 1;
  height: 12rpx;
  background-color: #eee;
  border-radius: 6rpx;
  margin-right: 20rpx;
  overflow: hidden;
}

.progress-filled {
  height: 100%;
  background: linear-gradient(to right, #3498db, #2980b9);
  border-radius: 6rpx;
}

.progress-text {
  font-size: 24rpx;
  color: #888;
  width: 60rpx;
  text-align: right;
}

.reward-btn {
  height: 70rpx;
  border-radius: 35rpx;
  font-size: 26rpx;
  font-weight: 500;
  color: white;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  line-height: 70rpx;
  padding: 0 30rpx;
  margin: 0 auto;
  width: 280rpx;
  text-align: center;
  border: none;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  transition: all 0.3s ease;
}

/* 已领取状态的按钮样式 */
.claimed-btn {
  background: #bbbbbb !important;
  box-shadow: none;
  color: #ffffff;
}

/* 不可领取但未领取的按钮样式 */
.disabled-btn {
  background: #f2f2f2 !important;
  color: #999999;
  box-shadow: none;
}
</style> 