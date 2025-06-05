<script setup lang="ts">
import { ref, onMounted, onUnmounted } from 'vue'
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only'
import { useUserStore, useUserManagerStore, useCurrencyStore, useDepositTipsStore } from '@/store'
import { useAppStore } from '@/store/app'
import { usePlatformStore } from '@/store/platform'
import { getNeedLoginPages, clearPageCache } from '@/utils'
import { pages } from '@/pages.json'
import { tabbarStore } from '@/components/fg-tabbar/tabbar'
import { API_URL } from '@/config/api'

// 初始化用户状态
const userStore = useUserStore()
// 用户管理器
const userManagerStore = useUserManagerStore()
// 初始化应用状态
const appStore = useAppStore()
// 初始化平台设置状态
const platformStore = usePlatformStore()
// 初始化货币数据store
const currencyStore = useCurrencyStore()
// 初始化预存金额提示store
const depositTipsStore = useDepositTipsStore()

// 最小更新时间间隔(毫秒)：5分钟
const MIN_UPDATE_INTERVAL = 5 * 60 * 1000

// 移除公告弹窗状态
// const showAnnouncementPopup = ref(false)
const appOpenCount = ref(0)
// 添加一个标志位，防止多次重定向
const isRedirecting = ref(false)

// 定义白名单路径 - 这些页面不需要登录
const noLoginPaths = [
  '/pages/login/index',
  '/pages/register/index',
  '/pages/register/captcha',
  '/pages/login/password',
  '/pages/login/reset-password',
  '/pages/index/index',
]

// 保存白名单到本地缓存
const saveNoLoginPathsToStorage = () => {
  uni.setStorageSync('no_login_paths', JSON.stringify(noLoginPaths))
}

// 从本地缓存获取白名单
const getNoLoginPathsFromStorage = () => {
  const paths = uni.getStorageSync('no_login_paths')
  return paths ? JSON.parse(paths) : noLoginPaths
}

// 检查页面是否在白名单中
const isInNoLoginPaths = (path: string) => {
  const paths = getNoLoginPathsFromStorage()
  return paths.some((noLoginPath: string) => path.startsWith(noLoginPath))
}

// 保存当前页面路径到缓存
const saveCurrentPageToStorage = () => {
  const pages = getCurrentPages()
  if (pages.length > 0) {
    const currentPage = pages[pages.length - 1]
    const currentPath = '/' + currentPage.route
    console.log('保存当前页面路径到缓存:', currentPath)
    uni.setStorageSync('last_page_path', currentPath)
  }
}

// 从缓存获取上次的页面路径
const getLastPageFromStorage = () => {
  return uni.getStorageSync('last_page_path') || ''
}

onLaunch(async () => {
  // 应用启动时，无论如何都重置登录重定向标志位
  // 这样即使上次应用异常退出，也能确保本次启动正常跳转到登录页
  uni.setStorageSync('redirecting_to_login', 'false')

  // 保存白名单到本地缓存
  saveNoLoginPathsToStorage()

  // 初始化tabbar，设置首页索引为0
  tabbarStore.setCurIdx(0)

  // 检查是否有token (通过pinia持久化存储)
  if (userStore.isLogined) {
    console.log('检测到用户token，获取用户基本信息')
    try {
      // 获取用户基本信息 - 只获取用户信息和认证状态，不请求银行卡和团队信息
      await userStore.fetchUserInfo()

      // 获取用户货币数据
      console.log('开始获取用户持有货币数据')
      currencyStore
        .fetchUserCurrencies(true)
        .then(() => {
          console.log('初始化用户货币数据成功')
        })
        .catch((error) => {
          console.error('初始化用户货币数据失败:', error)
        })

      // 登录有效，获取平台功能开关设置
      await platformStore.fetchPlatformSettings()
      // 获取银行卡开户预存金
      appStore.fetchBankCardOpenFee()

      // 获取预存金额提示（在后台进行，不阻塞应用启动）
      depositTipsStore.fetchDepositTips().catch((error) => {
        console.error('初始化预存金额提示失败:', error)
      })

      // 关闭启动封面
      closeSplashscreen()
    } catch (error) {
      console.error('获取用户信息失败', error)
      // 出错时清除token
      userManagerStore.clearAllUserData()
      // 跳转到登录页
      navigateToLogin()
      // 关闭启动封面
      closeSplashscreen()
    }
  } else {
    console.log('用户未登录，检查缓存的页面路径')

    // 获取当前页面路径或缓存的上一个页面路径
    const lastPagePath = uni.getStorageSync('last_page_path')

    // 检查是否为注册路径
    if (lastPagePath && lastPagePath.startsWith('/pages/register/')) {
      console.log('检测到注册路径，不跳转到登录页:', lastPagePath)

      // 如果是注册路径，直接跳转到该路径
      uni.reLaunch({
        url: lastPagePath,
        complete: () => {
          // 关闭启动封面
          closeSplashscreen()
        },
      })
      return
    }

    // 获取当前页面路径
    const pages = getCurrentPages()
    if (pages.length > 0) {
      const currentPage = pages[pages.length - 1]
      const currentPath = '/' + currentPage.route

      // 检查当前页面是否为注册路径
      if (currentPath.startsWith('/pages/register/')) {
        console.log('当前页面是注册路径，无需跳转到登录页:', currentPath)
        return
      }

      // 检查当前页面是否在白名单中
      if (isInNoLoginPaths(currentPath)) {
        console.log('当前页面在白名单中，无需跳转到登录页')
        return
      }
    }

    // 不在白名单中，跳转到登录页
    console.log('用户未登录且不在白名单中，直接跳转到登录页')
    setTimeout(() => {
      navigateToLogin()
    }, 500)
  }
})

// 关闭启动封面
const closeSplashscreen = () => {
  // #ifdef APP-PLUS
  // 立即尝试关闭一次
  try {
    console.log('立即尝试关闭启动封面')
    plus.navigator.closeSplashscreen()
  } catch (e) {
    console.error('直接关闭启动封面失败', e)
  }

  // 延迟后再次尝试关闭，确保一定能关闭
  setTimeout(() => {
    try {
      // 手动关闭App启动封面
      plus.navigator.closeSplashscreen()
      console.log('延迟关闭启动封面成功')
    } catch (e) {
      console.error('延迟关闭启动封面失败', e)
    }
  }, 1000)
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

  // 重定向到密码登录页
  uni.reLaunch({
    url: '/pages/login/password',
    success: () => {
      // 成功跳转后立即关闭启动封面
      console.log('成功跳转到登录页，立即关闭启动封面')
      closeSplashscreen()
    },
    complete: () => {
      // 完成后重置标志
      setTimeout(() => {
        isRedirecting.value = false
        // 不重置本地存储标志，让登录页面来重置
      }, 2000)
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
  console.log('App onShow')
  // 移除自动刷新用户信息的逻辑，只在首页刷新

  // 不再在每次应用显示时刷新平台功能开关设置
  console.log('应用显示，不再重复请求平台功能开关设置')
  // platformStore.fetchPlatformSettings() // 移除此处调用，仅在首次启动时请求

  // 注意：不再在onShow中触发登录跳转逻辑
  // 仅在第一次启动应用时(onLaunch)检查登录状态
  console.log('应用显示，不再检查登录状态以避免意外跳转')
})

onHide(() => {
  console.log('App Hide - 应用进入后台')
  // 应用退出到后台时，保存当前页面路径
  saveCurrentPageToStorage()

  // 应用退出到后台时，重置登录重定向标志位
  // 这样当用户再次进入时可以正常触发登录跳转
  uni.setStorageSync('redirecting_to_login', 'false')
  console.log('应用退出到后台，重置登录重定向标志位')

  // 清空页面缓存
  clearPageCache()
})

// UniApp不支持直接使用window.addEventListener
// 改为使用uni.onError捕获应用错误，同时保存页面状态
uni.onError((err) => {
  console.error('应用发生错误，保存当前页面状态:', err)
  saveCurrentPageToStorage()
})

// 在页面上注册unload事件（仅H5环境有效）
// #ifdef H5
onMounted(() => {
  window.addEventListener('beforeunload', () => {
    saveCurrentPageToStorage()
    console.log('页面即将刷新，保存当前页面路径')
  })
})

onUnmounted(() => {
  window.removeEventListener('beforeunload', () => {
    saveCurrentPageToStorage()
  })
})
// #endif
</script>

<template>
  <!-- 移除全局公告弹窗 -->
  <!-- <AnnouncementPopup v-model="showAnnouncementPopup" @close="handleAnnouncementClose" /> -->
  <view></view>
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
