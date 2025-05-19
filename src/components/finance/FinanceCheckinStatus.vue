<template>
  <view class="checkin-status">
    <view class="status-header">
      <view class="status-title">打卡进度</view>
      <view class="today-status" :class="{ checked: checkInData.isCheckedToday }">
        {{ checkInData.isCheckedToday ? '今日已打卡' : '今日未打卡' }}
      </view>
    </view>

    <view class="progress-bar" style="margin-top: 50rpx">
      <view class="progress-fill" :style="{ width: checkInData.completionRate + '%' }"></view>
      <view
        v-for="(marker, index) in markers"
        :key="index"
        class="progress-marker"
        :class="{ reached: checkInData.daysCompleted >= marker.days }"
        :style="{ left: (marker.days / checkInData.totalDays) * 100 + '%' }"
      >
        <view class="marker-day">{{ marker.days }}天</view>
      </view>
    </view>

    <view class="progress-info">
      <view>已打卡 {{ checkInData.daysCompleted }}/{{ checkInData.totalDays }} 天</view>
      <view>完成率 {{ Math.round(checkInData.completionRate) }}%</view>
    </view>

    <button
      class="check-in-button"
      :class="{ disabled: checkInData.isCheckedToday }"
      :disabled="checkInData.isCheckedToday || isCheckingIn"
      @click="handleCheckIn"
    >
      {{ isCheckingIn ? '打卡中...' : checkInData.isCheckedToday ? '今日已打卡' : '立即打卡' }}
    </button>
  </view>
</template>

<script lang="ts" setup>
interface CheckInData {
  daysCompleted: number
  totalDays: number
  isCheckedToday: boolean
  completionRate: number
  cycleStartDate: string
  cycleEndDate: string
}

interface Marker {
  days: number
  label: string
}

defineProps({
  checkInData: {
    type: Object as () => CheckInData,
    required: true,
  },
  markers: {
    type: Array as () => Marker[],
    default: () => [],
  },
  isCheckingIn: {
    type: Boolean,
    default: false,
  },
})

const emit = defineEmits(['check-in'])

const handleCheckIn = () => {
  emit('check-in')
}
</script>

<style>
/* 签到状态 */
.checkin-status {
  background-color: white;
  border-radius: 30rpx;
  margin: 0 30rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.1);
  margin-top: -20rpx;
  position: relative;
  z-index: 10;
}

.status-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 30rpx;
}

.status-title {
  font-weight: bold;
  font-size: 32rpx;
  color: #333;
}

.today-status {
  font-size: 24rpx;
  color: #ff5c00;
  background-color: rgba(255, 92, 0, 0.1);
  padding: 6rpx 20rpx;
  border-radius: 20rpx;
}

.today-status.checked {
  color: #4caf50;
  background-color: rgba(76, 175, 80, 0.1);
}

.progress-bar {
  height: 20rpx;
  background-color: #f5f5f5;
  border-radius: 10rpx;
  margin-bottom: 30rpx;
  position: relative;
}

.progress-fill {
  height: 100%;
  background: linear-gradient(90deg, #ff9645 0%, #ff5c00 100%);
  border-radius: 10rpx;
  transition: width 0.5s;
}

.progress-marker {
  position: absolute;
  top: -6rpx;
  width: 30rpx;
  height: 30rpx;
  border-radius: 50%;
  background-color: #fff;
  border: 4rpx solid #ccc;
  transform: translateX(-50%);
  z-index: 1;
}

.progress-marker.reached {
  border-color: #ff5c00;
  background-color: #ff9645;
}

.marker-day {
  position: absolute;
  top: -50rpx;
  left: 50%;
  transform: translateX(-50%);
  font-size: 24rpx;
  white-space: nowrap;
  background-color: #f8f8f8;
  padding: 6rpx 16rpx;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 10rpx rgba(0, 0, 0, 0.1);
}

.progress-info {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: #666;
  margin-bottom: 30rpx;
}

.check-in-button {
  background: linear-gradient(90deg, #ff9645 0%, #ff5c00 100%);
  color: white;
  border: none;
  padding: 24rpx 0;
  width: 100%;
  border-radius: 50rpx;
  font-size: 32rpx;
  font-weight: bold;
  box-shadow: 0 8rpx 16rpx rgba(255, 92, 0, 0.3);
}

.check-in-button.disabled {
  background: #cccccc;
  color: #ffffff;
  box-shadow: none;
}
</style>
