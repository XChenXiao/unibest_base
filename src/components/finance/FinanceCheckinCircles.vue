<template>
  <view class="checkin-circles">
    <view class="circles-header">
      <view class="circles-title">30天打卡记录</view>
      <view class="cycle-info">周期: {{ formatDate(checkInData.cycleStartDate) }} ~ {{ formatDate(checkInData.cycleEndDate) }}</view>
    </view>
    
    <view class="circles-grid">
      <view 
        v-for="day in 30" 
        :key="day"
        class="circle" 
        :class="{ 
          'checked': isCheckedDay(day), 
          'missed': isMissedDay(day),
          'today': isToday(day)
        }"
      >
        {{ day }}
        <view v-if="isCheckedDay(day)" class="check-mark">✓</view>
        <view v-else-if="isMissedDay(day)" class="miss-mark">✗</view>
        <view v-if="isToday(day)" class="today-mark">今</view>
      </view>
    </view>
    
    <view class="circles-legend">
      <view class="legend-item">
        <view class="legend-circle legend-checked"></view>
        <view>已打卡</view>
      </view>
      <view class="legend-item">
        <view class="legend-circle legend-missed"></view>
        <view>漏打卡</view>
      </view>
      <view class="legend-item">
        <view class="legend-circle legend-normal"></view>
        <view>未开始</view>
      </view>
      <view class="legend-item">
        <view class="legend-circle legend-today"></view>
        <view>今天</view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
interface CheckInData {
  daysCompleted: number;
  totalDays: number;
  isCheckedToday: boolean;
  completionRate: number;
  cycleStartDate: string;
  cycleEndDate: string;
}

const props = defineProps({
  checkInData: {
    type: Object as () => CheckInData,
    required: true
  },
  checkedDays: {
    type: Array as () => number[],
    default: () => []
  },
  missedDays: {
    type: Array as () => number[],
    default: () => []
  }
})

// 格式化日期
const formatDate = (dateStr: string) => {
  if (!dateStr) return '';
  
  const date = new Date(dateStr);
  return `${date.getMonth() + 1}月${date.getDate()}日`;
}

// 检查是否是已打卡的天
const isCheckedDay = (day: number) => {
  return props.checkedDays.includes(day);
}

// 检查是否是漏打卡的天
const isMissedDay = (day: number) => {
  return props.missedDays.includes(day);
}

// 检查是否是当前天
const isToday = (day: number) => {
  return day === getCurrentDayInCycle();
}

// 获取当前周期的第几天
const getCurrentDayInCycle = () => {
  if (!props.checkInData.cycleStartDate) return 1;
  
  const cycleStart = new Date(props.checkInData.cycleStartDate);
  const today = new Date();
  
  // 确保日期格式正确
  cycleStart.setHours(0, 0, 0, 0);
  today.setHours(0, 0, 0, 0);
  
  // 计算天数差
  const diffTime = Math.abs(today.getTime() - cycleStart.getTime());
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  
  // 当前天从1开始计数
  return Math.min(diffDays + 1, 30);
}
</script>

<style>
/* 打卡记录圆圈 */
.checkin-circles {
  background-color: white;
  border-radius: 30rpx;
  margin: 30rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 20rpx rgba(0, 0, 0, 0.05);
  position: relative;
  z-index: 5; /* 设置 z-index 值低于打卡进度 */
}

.circles-header {
  display: flex;
  justify-content: space-between;
  margin-bottom: 30rpx;
}

.circles-title {
  font-weight: bold;
  font-size: 32rpx;
  color: #333;
}

.cycle-info {
  font-size: 24rpx;
  color: #666;
}

.circles-grid {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
}

.circle {
  width: 88rpx;
  height: 88rpx;
  border-radius: 50%;
  margin: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 28rpx;
  font-weight: bold;
  position: relative;
  background-color: #f8f8f8;
  border: 2rpx solid #e0e0e0;
}

.circle.checked {
  background-color: #4caf50;
  color: white;
  border-color: #4caf50;
}

.circle.missed {
  background-color: #ff9800;
  color: white;
  border-color: #ff9800;
}

.circle.today {
  border: 4rpx solid #6e45e2;
  background-color: #f0f0ff;
  color: #333;
}

.circle.today.checked {
  background-color: #4caf50;
  color: white;
}

.check-mark, .miss-mark {
  position: absolute;
  bottom: 0;
  right: 0;
  width: 30rpx;
  height: 30rpx;
  border-radius: 50%;
  font-size: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
}

.check-mark {
  background-color: #388e3c;
}

.miss-mark {
  background-color: #f57c00;
}

.today-mark {
  position: absolute;
  top: -8rpx;
  right: -8rpx;
  width: 30rpx;
  height: 30rpx;
  font-size: 20rpx;
  background-color: #6e45e2;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

.circles-legend {
  display: flex;
  justify-content: center;
  margin-top: 30rpx;
  flex-wrap: wrap;
}

.legend-item {
  display: flex;
  align-items: center;
  margin: 0 20rpx;
  font-size: 24rpx;
  color: #666;
}

.legend-circle {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  margin-right: 10rpx;
}

.legend-checked {
  background-color: #4caf50;
}

.legend-missed {
  background-color: #ff9800;
}

.legend-normal {
  background-color: #f8f8f8;
  border: 2rpx solid #e0e0e0;
}

.legend-today {
  background-color: #f0f0ff;
  border: 2rpx solid #6e45e2;
}
</style> 