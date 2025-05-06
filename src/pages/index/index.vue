<!-- 使用 type="home" 属性设置首页，其他页面不需要设置，默认为page；推荐使用json5，更强大，且允许注释 -->
<route lang="json5" type="home">
{
  layout: 'tabbar',
  style: {
    navigationStyle: 'custom',
    navigationBarTitleText: '理财首页',
  },
}
</route>
<template>
  <view class="page-container">
    <!-- 顶部区域 -->
    <finance-header 
      :safeAreaInsets="safeAreaInsets"
      @menu-click="handleMenuItem"
    />
    
    <!-- 签到状态 -->
    <finance-checkin-status 
      :checkInData="checkInData"
      :markers="markers"
      :isCheckingIn="isCheckingIn"
      @check-in="handleCheckIn"
    />
    
    <!-- 打卡记录圆圈 -->
    <finance-checkin-circles
      :checkInData="checkInData"
      :checkedDays="checkedDays"
      :missedDays="missedDays"
    />
    
    <!-- 里程碑时间线 -->
    <finance-milestones
      :milestones="milestones"
    />
  </view>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue'
import FinanceHeader from '@/components/finance/FinanceHeader.vue'
import FinanceCheckinStatus from '@/components/finance/FinanceCheckinStatus.vue'
import FinanceCheckinCircles from '@/components/finance/FinanceCheckinCircles.vue'
import FinanceMilestones from '@/components/finance/FinanceMilestones.vue'
import { getCheckInStatsAPI, getCheckInDailyStatusAPI, checkInAPI } from '@/service/index/checkin'
import { useUserStore } from '@/store'

defineOptions({
  name: 'FinanceHome',
})

// 获取屏幕边界到安全区域距离
const { safeAreaInsets } = uni.getSystemInfoSync()

// 数据
const isCheckingIn = ref(false)
// 签到数据
const checkInData = ref({
  daysCompleted: 0,
  totalDays: 30,
  isCheckedToday: false,
  completionRate: 0,
  cycleStartDate: '',
  cycleEndDate: ''
})
// 里程碑点
const markers = ref([
  { days: 7, label: '7天' },
  { days: 15, label: '15天' },
  { days: 30, label: '30天' }
])
// 已打卡的天
const checkedDays = ref<number[]>([])
// 漏打卡的天
const missedDays = ref<number[]>([])
// 里程碑数据
const milestones = ref([])

// 生命周期
onMounted(() => {
  console.log('首页组件已挂载，准备获取签到数据')
  // 获取签到数据
  fetchCheckInData()
})


// 方法
// 获取签到数据
const fetchCheckInData = async () => {
  console.log('开始获取签到数据')
  try {
    // 获取打卡统计信息
    console.log('调用 getCheckInStatsAPI')
    const statsRes = await getCheckInStatsAPI()
    console.log('getCheckInStatsAPI 返回:', statsRes)
    
    if (statsRes && statsRes.data) {
      const statsData = statsRes.data
      
      // 更新签到数据
      checkInData.value = {
        daysCompleted: statsData.current_cycle_days,
        totalDays: 30, // 固定为30天周期
        isCheckedToday: statsData.today_checked,
        completionRate: (statsData.current_cycle_days / 30) * 100,
        cycleStartDate: statsData.cycle_start_date,
        cycleEndDate: statsData.cycle_end_date
      }
      console.log('更新签到数据:', checkInData.value)
      
      // 更新里程碑数据
      if (statsData.milestones) {
        milestones.value = statsData.milestones
        console.log('更新里程碑数据:', milestones.value)
      }
      
      try {
        // 获取打卡日历状态
        console.log('调用 getCheckInDailyStatusAPI')
        const dailyStatusRes = await getCheckInDailyStatusAPI()
        console.log('getCheckInDailyStatusAPI 返回:', dailyStatusRes)
        
        if (dailyStatusRes && dailyStatusRes.data) {
          const dailyStatus = dailyStatusRes.data.daily_status
          
          // 处理已打卡和漏打卡的天
          checkedDays.value = []
          missedDays.value = []
          
          dailyStatus.forEach((day, index) => {
            const dayNumber = index + 1 // 从1开始计数
            if (day.is_past_or_today) {
              if (day.checked_in) {
                checkedDays.value.push(dayNumber)
              } else if (!day.is_today) { // 今天未打卡不算漏打卡
                missedDays.value.push(dayNumber)
              }
            }
          })
          console.log('更新签到日历数据:', { 
            checkedDays: checkedDays.value, 
            missedDays: missedDays.value 
          })
        }
      } catch (dailyError) {
        console.error('获取打卡日历状态失败:', dailyError)
        // 检查具体的错误信息
        if (dailyError.statusCode) {
          console.error('HTTP状态码:', dailyError.statusCode)
        }
        if (dailyError.data) {
          console.error('错误数据:', dailyError.data)
        }
      }
    }
  } catch (error) {
    console.error('获取签到数据失败:', error)
    // 检查具体的错误信息
    if (error.statusCode) {
      console.error('HTTP状态码:', error.statusCode)
    }
    if (error.data) {
      console.error('错误数据:', error.data)
    }
    
    uni.showToast({
      title: error.data?.message || '获取数据失败，请稍后重试',
      icon: 'none'
    })
  }
}

// 处理菜单项点击
const handleMenuItem = (type: string) => {
  // 菜单点击处理已经在FinanceHeader组件中完成
  console.log('菜单项点击:', type)
  // 这里可以处理特殊菜单项，其他的在FinanceHeader组件中已处理
}

// 处理签到
const handleCheckIn = async () => {
  if (checkInData.value.isCheckedToday || isCheckingIn.value) {
    return
  }
  
  isCheckingIn.value = true
  
  try {
    // 调用签到API
    const res = await checkInAPI()
    
    if (res) {
      uni.showToast({
        title: '签到成功',
        icon: 'success'
      })
      
      // 重新获取签到数据
      await fetchCheckInData()
    }
  } catch (error) {
    console.error('签到失败', error)
    uni.showToast({
      title: error.data.message,
      icon: 'none'
    })
  } finally {
    isCheckingIn.value = false
  }
}
</script>

<style>
page {
  background-color: #f5f5f5;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

/* 页面容器 */
.page-container {
  min-height: 100vh;
}
</style>
