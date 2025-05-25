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
    <!-- 顶部波浪装饰 -->
    <view class="wave-decoration"></view>

    <!-- 顶部区域 -->
    <finance-header :safeAreaInsets="safeAreaInsets" @menu-click="handleMenuItem" />

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
    <finance-milestones :milestones="milestones" />

    <!-- 公告弹窗组件 - 降低层级 -->
    <AnnouncementPopup
      v-model="showAnnouncementPopup"
      :external-announcement="latestAnnouncement"
      @close="handleAnnouncementClose"
    />

    <!-- 实名认证指引弹窗 - 层级高于公告弹窗 -->
    <VerificationGuidePopup
      v-model="showVerificationGuidePopup"
      @close="handleVerificationGuideClose"
    />
  </view>
</template>

<script lang="ts" setup>
import { ref, onMounted, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import FinanceHeader from '@/components/finance/FinanceHeader.vue'
import FinanceCheckinStatus from '@/components/finance/FinanceCheckinStatus.vue'
import FinanceCheckinCircles from '@/components/finance/FinanceCheckinCircles.vue'
import FinanceMilestones from '@/components/finance/FinanceMilestones.vue'
import AnnouncementPopup from '@/components/common/AnnouncementPopup.vue'
import VerificationGuidePopup from '@/components/common/VerificationGuidePopup.vue'
import { getCheckInStatsAPI, getCheckInDailyStatusAPI, checkInAPI } from '@/service/index/checkin'
import { useUserStore, useVerificationStore, useUserManagerStore } from '@/store'
import { API_URL } from '@/config/api'
import checkUpdate from '@/uni_modules/uni-upgrade-center-app/utils/check-update'

defineOptions({
  name: 'FinanceHome',
})

// 获取屏幕边界到安全区域距离
const { safeAreaInsets } = uni.getSystemInfoSync()

// 获取用户状态
const userStore = useUserStore()
// 获取验证状态
const verificationStore = useVerificationStore()
// 获取用户管理器
const userManagerStore = useUserManagerStore()

// 数据
const isCheckingIn = ref(false)
// 签到数据
const checkInData = ref({
  daysCompleted: 0,
  totalDays: 30,
  isCheckedToday: false,
  completionRate: 0,
  cycleStartDate: '',
  cycleEndDate: '',
})
// 里程碑点
const markers = ref([
  { days: 7, label: '7天' },
  { days: 15, label: '15天' },
  { days: 30, label: '30天' },
])
// 已打卡的天
const checkedDays = ref<number[]>([])
// 漏打卡的天
const missedDays = ref<number[]>([])
// 里程碑数据
const milestones = ref([])

// 公告弹窗状态
const showAnnouncementPopup = ref(false)
const latestAnnouncement = ref(null)
// 实名认证指引弹窗状态
const showVerificationGuidePopup = ref(false)
// 用户实名认证状态
const verificationStatus = ref<any>(null)
// 标记是否是首次进入页面
const isFirstEnter = ref(true)

// 生命周期
onMounted(() => {
  console.log('首页组件已挂载，准备获取签到数据')
  // 获取签到数据（首次加载需要包含日历状态）
  fetchCheckInData(true)

  // 检查用户实名认证状态并显示相应弹窗
  checkVerificationStatusAndShowPopups()

  // 检查应用更新
  checkAppUpdate()
})

// 监听页面显示（每次进入页面都会调用）
onShow(() => {
  console.log('首页被显示')

  // 如果是首次进入，跳过onShow的处理，避免与onMounted重复
  if (isFirstEnter.value) {
    isFirstEnter.value = false
    console.log('首次进入页面，跳过onShow处理避免重复')
    return
  }

  // 检查是否是从登录页面跳转而来，如果是则跳过所有数据刷新避免重复请求
  const pages = getCurrentPages()
  const fromLogin = pages.length > 1 && pages[pages.length - 2]?.route?.includes('login')

  if (!fromLogin) {
    // 只在非首次且非从登录页跳转时才进行数据刷新
    console.log('非首次且非从登录页跳转，仅刷新签到统计数据')

    // 只刷新签到统计数据，不获取日历状态数据
    fetchCheckInData(false)
  } else {
    console.log('从登录页面跳转而来，跳过所有数据刷新避免重复请求')
  }

  // 每次进入首页都检查并显示公告弹窗（无论是否首次进入）
  console.log('每次进入首页都检查用户实名认证状态并显示相应弹窗')
  checkVerificationStatusAndShowPopups()
})

// 页面卸载事件
onUnmounted(() => {
  console.log('首页组件卸载')
})

// 检查应用更新
const checkAppUpdate = async () => {
  try {
    await checkUpdate()
  } catch (error) {
    console.error('检查更新失败:', error)
  }
}

// 方法
// 获取签到数据
const fetchCheckInData = async (includeDailyStatus = false) => {
  console.log('开始获取签到数据，是否包含日历状态:', includeDailyStatus)
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
        cycleEndDate: statsData.cycle_end_date,
      }
      console.log('更新签到数据:', checkInData.value)

      // 更新里程碑数据
      if (statsData.milestones) {
        milestones.value = statsData.milestones
        console.log('更新里程碑数据:', milestones.value)
      }

      // 只在需要时获取日历状态（首次加载或签到成功后）
      if (includeDailyStatus) {
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
                } else if (!day.is_today) {
                  // 今天未打卡不算漏打卡
                  missedDays.value.push(dayNumber)
                }
              }
            })
            console.log('更新签到日历数据:', {
              checkedDays: checkedDays.value,
              missedDays: missedDays.value,
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
      } else {
        console.log('跳过日历状态获取，使用缓存数据')
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
      icon: 'none',
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

  // 检查实名认证状态
  if (!verificationStore.isVerified) {
    uni.showModal({
      title: '需要实名认证',
      content: '打卡功能需要完成实名认证后才能使用，请先完成实名认证。',
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

  isCheckingIn.value = true

  try {
    // 调用签到API
    const res = await checkInAPI()

    if (res) {
      uni.showToast({
        title: '打卡成功',
        icon: 'success',
      })

      // 重新获取签到数据（签到成功后需要更新日历状态）
      await fetchCheckInData(true)
    }
  } catch (error) {
    console.error('签到失败', error)
    uni.showToast({
      title: error.data.message,
      icon: 'none',
    })
  } finally {
    isCheckingIn.value = false
  }
}

// 获取用户实名认证状态
const fetchVerificationStatus = async () => {
  try {
    // 如果正在请求中，直接返回，避免重复请求
    if (isRequestingVerification) {
      console.log('正在请求实名认证状态中，不重复发送请求')
      return verificationStore.isVerified
    }

    // 如果用户未登录，不获取认证状态
    if (!userStore.isLogined) {
      return false
    }

    // 首先从verificationStore中检查认证状态
    if (verificationStore.isVerified) {
      console.log('首页从store中获取到用户已实名认证')
      return true
    }

    // 设置请求标记
    isRequestingVerification = true

    // 清除可能存在的定时器
    if (verificationRequestTimer) {
      clearTimeout(verificationRequestTimer)
    }

    // 如果store中没有明确的认证状态，通过用户管理器刷新认证信息
    console.log('首页刷新用户实名认证状态')
    await verificationStore.fetchVerificationStatus()

    // 返回最新的认证状态
    return verificationStore.isVerified
  } catch (error) {
    console.error('获取实名认证状态失败:', error)
    return false
  } finally {
    // 设置一个延迟，在这段时间内不再重复请求
    verificationRequestTimer = setTimeout(() => {
      isRequestingVerification = false
    }, 2000) // 2秒内不重复请求
  }
}

// 检查用户实名认证状态并显示相应弹窗
const checkVerificationStatusAndShowPopups = async () => {
  // 获取最新的实名认证状态
  const isVerified = await fetchVerificationStatus()

  // 取消自动显示实名认证弹窗，直接显示公告弹窗
  // if (!isVerified) {
  //   console.log('用户未实名认证，显示实名认证指引弹窗')
  //   setTimeout(() => {
  //     showVerificationGuidePopup.value = true
  //   }, 800)
  // } else {
    // 用户已实名认证，直接显示公告弹窗
    console.log('获取最新公告')
    await checkAndShowAnnouncement()
  // }
}

// 防止短时间内多次请求
let isRequestingAnnouncement = false
let announcementRequestTimer: ReturnType<typeof setTimeout> | null = null

// 防止短时间内多次请求实名认证状态
let isRequestingVerification = false
let verificationRequestTimer: ReturnType<typeof setTimeout> | null = null

// 检查并显示公告
const checkAndShowAnnouncement = async () => {
  try {
    console.log('首页检查最新公告')

    // 检查是否有最新公告
    const { getLatestAnnouncementAPI } = await import('@/service/index/message')
    console.log('开始请求公告API')
    const result = await getLatestAnnouncementAPI()
    console.log('公告API请求完成', result)

    // 如果有公告，则显示弹窗
    if (result.status === 'success' && result.data) {
      console.log('首页获取到公告数据:', result.data)

      // 保存公告数据到组件属性
      latestAnnouncement.value = result.data

      // 准备显示公告弹窗
      console.log('首页准备显示公告弹窗')

      // 延迟显示，确保首页已完全加载
      setTimeout(() => {
        showAnnouncementPopup.value = true
        console.log('首页已显示公告弹窗，传递外部公告数据')
      }, 800)
    } else {
      console.log('没有获取到公告数据或没有可显示的公告')
      latestAnnouncement.value = null
    }
  } catch (error) {
    console.error('首页检查公告失败:', error)
    latestAnnouncement.value = null
  }
}

// 处理公告弹窗关闭事件
const handleAnnouncementClose = (data: { dontShowAgain: boolean }) => {
  console.log('公告弹窗关闭:', data)
}

// 处理实名认证指引弹窗关闭事件
const handleVerificationGuideClose = (data: { later: boolean }) => {
  console.log('实名认证指引弹窗关闭:', data)

  if (data.later) {
    // 用户选择了"稍后认证"，可以在这里添加额外逻辑
    console.log('用户选择了稍后认证，获取最新公告')

    // 请求并显示最新公告
    checkAndShowAnnouncement()
  }
}

// 刷新用户基本信息
const refreshBasicUserData = async () => {
  if (userStore.isLogined) {
    console.log('刷新用户基本信息')
    await userManagerStore.refreshBasicUserData()
  } else {
    console.log('用户未登录，不刷新用户数据')
  }
}

// 刷新用户基本信息（但不包括实名认证状态）
const refreshBasicUserDataOnly = async () => {
  if (userStore.isLogined) {
    console.log('刷新用户基本信息（不包括实名认证状态）')
    // 直接调用用户store的fetchUserInfo，不调用userManagerStore避免重复的实名认证状态请求
    await userStore.fetchUserInfo()
  } else {
    console.log('用户未登录，不刷新用户数据')
  }
}
</script>

<style lang="scss" scoped>
page {
  background-color: #f5f5f5;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  padding-bottom: 50rpx;
}

.wave-decoration {
  position: relative;
  // top: 0;
  // left: 0;
  width: 100%;
  height: 16rpx;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  z-index: 2;
}

/* 页面容器 */
.page-container {
  min-height: 100vh;
}
</style>
