<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only'
import { useUserStore } from '@/store'
import { useAppStore } from '@/store/app'
import { usePlatformStore } from '@/store/platform'
import { getNeedLoginPages } from '@/utils'
import { pages } from '@/pages.json'
import { tabbarStore } from '@/components/fg-tabbar/tabbar'
import AnnouncementPopup from '@/components/common/AnnouncementPopup.vue'
import { API_URL } from '@/config/api'

// 初始化用户状态
const userStore = useUserStore()
// 初始化应用状态
const appStore = useAppStore()
// 初始化平台设置状态
const platformStore = usePlatformStore()

// 最小更新时间间隔(毫秒)：5分钟
const MIN_UPDATE_INTERVAL = 5 * 60 * 1000

// 公告弹窗状态
const showAnnouncementPopup = ref(false)
const appOpenCount = ref(0)

onLaunch(async () => {
  console.log('App Launch')
  
  // 初始化tabbar，设置首页索引为0
  tabbarStore.initTabbar()
  
  // 调试输出：显示页面配置和需要登录的页面
  console.log('Pages配置:', JSON.stringify(pages, null, 2))
  console.log('需要登录的页面列表:', getNeedLoginPages())
  
  // 获取银行卡开户预存金
  appStore.fetchBankCardOpenFee()
  
  // 获取平台功能开关设置
  console.log('获取平台功能开关设置...')
  await platformStore.fetchPlatformSettings()
  console.log('平台功能开关状态:', {
    银行卡功能: platformStore.enableBankAccount ? '已开放' : '未开放',
    交易所功能: platformStore.enableExchange ? '已开放' : '未开放'
  })
  
  // 检查是否有本地存储的token，如果有则尝试自动登录
  if (userStore.isLogined) {
    try {
      console.log('尝试获取用户信息')
      const success = await userStore.fetchUserInfo()
      if (success) {
        console.log('自动登录成功，用户信息已更新，包含认证状态')
        // 不再单独调用fetchVerificationStatus，因为fetchUserInfo已经包含了认证状态的获取
      } else {
        console.log('自动登录失败：无法获取用户信息')
        // 清除过期的token
        userStore.clearUserInfo()
        // 检查当前页面是否需要登录
        checkInitialPageRequiresLogin()
      }
    } catch (error) {
      console.error('自动登录失败', error)
      // 出错时清除token
      userStore.clearUserInfo()
      // 检查当前页面是否需要登录
      checkInitialPageRequiresLogin()
    }
  } else {
    console.log('没有检测到登录状态')
    // 检查当前页面是否需要登录
    checkInitialPageRequiresLogin()
  }
  
  // 应用启动时检查是否需要显示公告
  checkAndShowAnnouncement()
})

// 检查初始页面是否需要登录
const checkInitialPageRequiresLogin = () => {
  setTimeout(() => {
    // 获取当前页面路径
    const pages = getCurrentPages()
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1]
      const currentPath = '/' + currentPage.route
      
      console.log('当前页面路径:', currentPath)
      
      // 获取需要登录的页面列表
      const needLoginPages = getNeedLoginPages()
      
      // 手动添加需要登录的页面路径 - 以防配置未生效
      const manualNeedLoginPages = [
        '/pages/my/index',
        '/pages/verification/index'
      ]
      
      console.log('系统获取的需要登录页面列表:', needLoginPages)
      console.log('手动添加的需要登录页面列表:', manualNeedLoginPages)
      
      // 检查当前页面是否需要登录（优先使用配置中的列表，如果为空则使用手动列表）
      const isNeedLogin = (needLoginPages.length > 0 ? needLoginPages : manualNeedLoginPages).includes(currentPath)
      
      console.log('当前页面是否需要登录:', isNeedLogin)
      
      if (isNeedLogin && !userStore.isLogined) {
        console.log('当前页面需要登录，正在重定向到登录页...')
        // 重定向到登录页
        uni.navigateTo({
          url: `/pages/login/index?redirect=${encodeURIComponent(currentPath)}`
        })
      }
    }
  }, 100) // 延迟一小段时间，确保页面已加载
}

// 检查并显示公告
const checkAndShowAnnouncement = async () => {
  try {
    console.log('应用检查最新公告')
    
    // 导入公告服务API
    const { getLatestAnnouncementAPI } = await import('@/service/index/message')
    
    try {
      // 获取最新公告
      const result = await getLatestAnnouncementAPI()
      
      // 如果有公告，则显示弹窗
      if (result.status === 'success' && result.data) {
        // 检查此公告是否已经展示过
        const shownAnnouncements = uni.getStorageSync('shown_announcements') || []
        const hasShown = shownAnnouncements.includes(result.data.id)
        
        // 如果没有展示过，则显示弹窗
        if (!hasShown) {
          console.log('显示最新公告弹窗')
          // 延迟显示，确保应用已完全加载
          setTimeout(() => {
            showAnnouncementPopup.value = true
          }, 800)
        } else {
          console.log('此公告已经展示过，不再显示')
        }
      } else {
        console.log('没有公告可显示')
      }
    } catch (error) {
      console.error('获取公告失败:', error)
    }
  } catch (error) {
    console.error('检查公告失败:', error)
  }
}

// 处理公告弹窗关闭事件
const handleAnnouncementClose = (data: { dontShowAgain: boolean }) => {
  console.log('公告弹窗关闭:', data)
}

onShow(async () => {
  console.log('App Show')
  
  // 每次应用显示时刷新平台功能开关设置
  console.log('应用显示，刷新平台功能开关设置...')
  platformStore.fetchPlatformSettings()
  
  // 如果用户已登录，检查是否需要刷新用户信息
  if (userStore.isLogined) {
    // 获取上次更新时间
    const lastUpdateTime = uni.getStorageSync('userInfoUpdateTime') || 0
    const currentTime = Date.now()
    
    // 如果超过最小更新间隔，才重新获取用户信息
    if (currentTime - lastUpdateTime > MIN_UPDATE_INTERVAL) {
      try {
        console.log('距离上次更新超过设定时间，正在刷新用户信息')
        await userStore.fetchUserInfo()
        console.log('用户信息已更新')
      } catch (error) {
        console.error('更新用户信息失败:', error)
      }
    } else {
      console.log('距离上次更新时间不足，跳过用户信息更新', {
        lastUpdate: new Date(lastUpdateTime).toLocaleString(),
        nextUpdateAfter: new Date(lastUpdateTime + MIN_UPDATE_INTERVAL).toLocaleString()
      })
    }
  }
  // 如果用户未登录，检查当前页面是否需要登录
  else {
    checkInitialPageRequiresLogin()
    
    // 特别处理TabBar页面 - 直接检查当前URL
    setTimeout(() => {
      const pages = getCurrentPages()
      if (pages.length > 0) {
        const currentPage = pages[pages.length - 1]
        const currentPath = '/' + currentPage.route
        
        console.log('onShow检查 - 当前页面路径:', currentPath)
        
        // 如果是"我的"页面，检查登录状态
        if (currentPath === '/pages/my/index' && !userStore.isLogined) {
          console.log('TabBar页面需要登录，正在重定向到登录页...')
          // 直接硬编码判断"我的"页面，确保它一定需要登录
          uni.navigateTo({
            url: `/pages/login/index?redirect=${encodeURIComponent(currentPath)}`
          })
        }
      }
    }, 150)
  }
  
  // 应用恢复前台时也检查是否需要显示公告
  if (!showAnnouncementPopup.value) {
    checkAndShowAnnouncement()
  }
})

onHide(() => {
  console.log('App Hide')
})
</script>

<template>
  <!-- 全局公告弹窗 -->
  <AnnouncementPopup
    v-model="showAnnouncementPopup"
    @close="handleAnnouncementClose"
  />
</template>

<style lang="scss">
/* stylelint-disable selector-type-no-unknown */
button::after {
  border: none;
}

swiper,
scroll-view {
  flex: 1;
  height: 100%;
  overflow: hidden;
}

image {
  width: 100%;
  height: 100%;
  vertical-align: middle;
}

// 单行省略，优先使用 unocss: text-ellipsis
.ellipsis {
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

// 两行省略
.ellipsis-2 {
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
}

// 三行省略
.ellipsis-3 {
  display: -webkit-box;
  overflow: hidden;
  text-overflow: ellipsis;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
}

/* 全局弹窗样式覆盖 */
.wd-popup {
  z-index: 9999 !important;
}

.wd-popup__content {
  z-index: 9999 !important;
}
</style>
