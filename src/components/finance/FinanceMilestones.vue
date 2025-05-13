<template>
  <view class="milestone-container">
    <view class="milestone-header">
      <view class="milestone-title">打卡里程碑</view>
      <view class="milestone-subtitle">每月将自动领取达成的最高奖励</view>
    </view>
    
    <view class="timeline">
      <view class="timeline-line"></view>
      
      <view 
        v-for="(milestone, index) in milestones" 
        :key="index"
        class="milestone-item"
      >
        <view 
          class="milestone-dot" 
          :class="{ 
            'completed': milestone.completed, 
            'current': milestone.current, 
            'upcoming': !milestone.completed && !milestone.current 
          }"
        >
          <text v-if="milestone.completed">✓</text>
          <text v-else-if="milestone.current">●</text>
          <text v-else>○</text>
        </view>
        
        <view class="milestone-content">
          <view class="milestone-name">{{ milestone.title }}</view>
          <view class="milestone-progress-bar">
            <view 
              class="milestone-progress-fill" 
              :class="{ 
                'completed': milestone.completed, 
                'current': milestone.current, 
                'upcoming': !milestone.completed && !milestone.current 
              }"
              :style="{ width: (milestone.daysCompleted / milestone.days * 100) + '%' }"
            ></view>
          </view>
          <view class="milestone-footer">
            <view class="milestone-days">{{ milestone.daysCompleted }}/{{ milestone.days }}天</view>
            <view class="milestone-reward">¥{{ milestone.reward }}</view>
          </view>
          <view 
            class="status-badge" 
            :class="{ 
              'status-completed': milestone.completed, 
              'status-current': milestone.current, 
              'status-upcoming': !milestone.completed && !milestone.current 
            }"
          >
            {{ milestone.completed ? '已完成' : (milestone.current ? '进行中' : '未开始') }}
          </view>
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
interface Milestone {
  title: string;
  days: number;
  reward: string;
  daysCompleted: number;
  completed: boolean;
  current: boolean;
}

defineProps({
  milestones: {
    type: Array as () => Milestone[],
    default: () => []
  }
})
</script>

<style>
/* 里程碑 */
.milestone-container {
  background-color: white;
  border-radius: 30rpx;
  margin: 30rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.05);
  margin-bottom: 60rpx;
  position: relative;
  z-index: 1;
}

.milestone-header {
  margin-bottom: 40rpx;
}

.milestone-title {
  font-weight: bold;
  font-size: 32rpx;
  color: #333;
  margin-bottom: 10rpx;
}

.milestone-subtitle {
  font-size: 24rpx;
  color: #666;
}

.timeline {
  position: relative;
  padding-left: 40rpx;
}

.timeline-line {
  position: absolute;
  left: 8rpx;
  top: 0;
  height: 100%;
  width: 4rpx;
  background-color: #e0e0e0;
}

.milestone-item {
  position: relative;
  margin-bottom: 50rpx;
  padding-left: 30rpx;
}

.milestone-item:last-child {
  margin-bottom: 0;
}

.milestone-dot {
  position: absolute;
  left: -32rpx;
  top: 0;
  width: 32rpx;
  height: 32rpx;
  border-radius: 50%;
  z-index: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 20rpx;
}

.milestone-dot.completed {
  background-color: #4caf50;
  color: white;
}

.milestone-dot.current {
  background-color: #2196f3;
  color: white;
}

.milestone-dot.upcoming {
  background-color: #e0e0e0;
  color: #fff;
}

.milestone-content {
  position: relative;
}

.milestone-name {
  font-weight: bold;
  font-size: 28rpx;
  color: #333;
  margin-bottom: 16rpx;
}

.milestone-progress-bar {
  height: 16rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  overflow: hidden;
  margin-bottom: 16rpx;
}

.milestone-progress-fill {
  height: 100%;
  border-radius: 8rpx;
  transition: width 0.5s;
}

.milestone-progress-fill.completed {
  background-color: #4caf50;
}

.milestone-progress-fill.current {
  background-color: #2196f3;
}

.milestone-progress-fill.upcoming {
  background-color: #e0e0e0;
}

.milestone-footer {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
}

.milestone-days {
  color: #666;
}

.milestone-reward {
  color: #ff5722;
  font-weight: bold;
}

.status-badge {
  position: absolute;
  right: 0;
  top: 0;
  padding: 4rpx 16rpx;
  border-radius: 20rpx;
  font-size: 24rpx;
  color: white;
}

.status-completed {
  background-color: #4caf50;
}

.status-current {
  background-color: #2196f3;
}

.status-upcoming {
  background-color: #9e9e9e;
}
</style> 