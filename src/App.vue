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
import { API_URL } from '@/config/api'

// 初始化用户状态
const userStore = useUserStore()
// 初始化应用状态
const appStore = useAppStore()
// 初始化平台设置状态
const platformStore = usePlatformStore()

// 最小更新时间间隔(毫秒)：5分钟
const MIN_UPDATE_INTERVAL = 5 * 60 * 1000

// 移除公告弹窗状态
// const showAnnouncementPopup = ref(false)
const appOpenCount = ref(0)
// 添加一个标志位，防止多次重定向
const isRedirecting = ref(false)

onLaunch(async () => {
  // 应用启动时，无论如何都重置登录重定向标志位
  // 这样即使上次应用异常退出，也能确保本次启动正常跳转到登录页
  uni.setStorageSync('redirecting_to_login', 'false')
  console.log('应用启动，重置登录重定向标志位')
  
  // 初始化tabbar，设置首页索引为0
  tabbarStore.initTabbar()

  console.log('应用启动，检查登录状态...')
  
  // 检查是否有本地存储的token
  if (userStore.isLogined) {
    console.log('检测到用户token，获取用户信息和平台设置')
    try {
      // 获取用户信息
      const success = await userStore.fetchUserInfo()
      if (success) {
        // 登录有效，获取平台功能开关设置
        await platformStore.fetchPlatformSettings()
        // 获取银行卡开户预存金
        appStore.fetchBankCardOpenFee()
        
        // 登录成功后导航到首页
        uni.switchTab({
          url: '/pages/index/index',
          fail: (err) => {
            console.error('跳转到首页失败，尝试使用reLaunch', err)
            uni.reLaunch({
              url: '/pages/index/index'
            })
          }
        })
        
        // 关闭启动封面
        closeSplashscreen()
      } else {
        // 清除过期的token
        userStore.clearUserInfo()
        // 跳转到登录页
        navigateToLogin()
      }
    } catch (error) {
      console.error('获取用户信息失败', error)
      // 出错时清除token
      userStore.clearUserInfo()
      // 跳转到登录页
      navigateToLogin()
    }
  } else {
    console.log('用户未登录，直接跳转到登录页')
    // 用户未登录，直接跳转到登录页
    setTimeout(() => {
      navigateToLogin()
    }, 500)
  }
})

// 关闭启动封面
const closeSplashscreen = () => {
  // #ifdef APP-PLUS
  setTimeout(() => {
    // 手动关闭App启动封面
    plus.navigator.closeSplashscreen()
  }, 1500)
  // #endif
}

// 导航到登录页面
const navigateToLogin = () => {
  // 先确保重定向标志位为false
  // 这样可以防止前一次异常导致标志位为true而跳过跳转
  uni.setStorageSync('redirecting_to_login', 'false')
  
  // 检查是否正在重定向到登录页面
  if (uni.getStorageSync('redirecting_to_login') === 'true') {
    console.log('已有重定向到登录页面的过程，跳过重复跳转')
    return
  }
  
  // 如果已经在重定向中，则不再执行
  if (isRedirecting.value) {
    console.log('已经在重定向过程中，跳过重复跳转')
    return
  }

  // 获取当前页面路径作为重定向目标
  const pages = getCurrentPages()
  // 如果当前已经在登录页，不需要再次跳转
  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1]
    const currentPath = '/' + currentPage.route

    if (currentPath.includes('/pages/login/')) {
      console.log('当前已在登录页面，无需重定向')
      return
    }
  }

  console.log('导航到登录页')

  // 设置重定向标志
  isRedirecting.value = true
  // 设置本地存储标志
  uni.setStorageSync('redirecting_to_login', 'true')

  // 重定向到登录页
  uni.reLaunch({
    url: '/pages/login/index',
    complete: () => {
      // 完成后重置标志
      setTimeout(() => {
        isRedirecting.value = false
        // 不重置本地存储标志，让登录页面来重置
      }, 2000)
      
      // 在跳转完成后关闭启动封面
      closeSplashscreen()
    },
  })
}

// 移除公告检查方法
// const checkAndShowAnnouncement = async () => {
//   try {
//     console.log('应用检查最新公告')
//
//     // 检查当前页面是否在白名单中，如果在白名单中且不是首页，则不显示公告
//     const pages = getCurrentPages()
//     if (pages.length > 0) {
//       const currentPage = pages[pages.length - 1]
//       const currentPath = '/' + currentPage.route
//
//       // 特别排除注册和登录相关页面显示公告
//       if (currentPath.includes('/pages/register/') ||
//           (currentPath.includes('/pages/login/') && !currentPath.includes('/pages/login/index'))) {
//         console.log('当前在注册/登录流程中，暂不显示公告:', currentPath)
//         return
//       }
//     }
//
//     // 导入公告服务API
//     const { getLatestAnnouncementAPI } = await import('@/service/index/message')
//
//     try {
//       // 获取最新公告
//       const result = await getLatestAnnouncementAPI()
//
//       // 如果有公告，则显示弹窗
//       if (result.status === 'success' && result.data) {
//         // 检查此公告是否已经展示过
//         const shownAnnouncements = uni.getStorageSync('shown_announcements') || []
//         const hasShown = shownAnnouncements.includes(result.data.id)
//
//         // 如果没有展示过，则显示弹窗
//         if (!hasShown) {
//           console.log('显示最新公告弹窗')
//           // 延迟显示，确保应用已完全加载
//           setTimeout(() => {
//             showAnnouncementPopup.value = true
//           }, 800)
//         } else {
//           console.log('此公告已经展示过，不再显示')
//         }
//       } else {
//         console.log('没有公告可显示')
//       }
//     } catch (error) {
//       console.error('获取公告失败:', error)
//     }
//   } catch (error) {
//     console.error('检查公告失败:', error)
//   }
// }

// 移除处理公告弹窗关闭事件的方法
// const handleAnnouncementClose = (data: { dontShowAgain: boolean }) => {
//   console.log('公告弹窗关闭:', data)
// }

onShow(() => {
  // 每次应用显示时刷新平台功能开关设置
  console.log('应用显示，刷新平台功能开关设置...')
  platformStore.fetchPlatformSettings()

  // 检查是否在白名单页面，避免重复登录检查
  const pages = getCurrentPages()

  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1]
    const currentPath = '/' + currentPage.route

    const whitelistPaths = [
      '/pages/login/index',
      '/pages/register/index',
      '/pages/login/password',
      '/pages/login/reset-password',
      '/pages/index/index',
    ]

    // 如果当前页面在白名单中，不做额外处理
    if (whitelistPaths.some((path) => currentPath.startsWith(path))) {
      console.log('当前页面在白名单中，无需处理登录状态:', currentPath)
      return
    }
    
    // 检查登录状态
    if (!userStore.isLogined) {
      console.log('用户未登录，自动跳转到登录页')
      setTimeout(() => {
        navigateToLogin()
      }, 500)
    }
  }
})

onHide(() => {
  console.log('App Hide - 应用进入后台')
  // 应用退出到后台时，重置登录重定向标志位
  // 这样当用户再次进入时可以正常触发登录跳转
  uni.setStorageSync('redirecting_to_login', 'false')
  console.log('应用退出到后台，重置登录重定向标志位')
})
</script>

<template>
  <!-- 移除全局公告弹窗 -->
  <!-- <AnnouncementPopup v-model="showAnnouncementPopup" @close="handleAnnouncementClose" /> -->
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
