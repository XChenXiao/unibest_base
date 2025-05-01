<script setup lang="ts">
import { onLaunch, onShow, onHide } from '@dcloudio/uni-app'
import 'abortcontroller-polyfill/dist/abortcontroller-polyfill-only'
import { useUserStore } from '@/store'
import { getNeedLoginPages } from '@/utils'
import { pages } from '@/pages.json'

// 初始化用户状态
const userStore = useUserStore()

// 最小更新时间间隔(毫秒)：5分钟
const MIN_UPDATE_INTERVAL = 5 * 60 * 1000

onLaunch(async () => {
  console.log('App Launch')
  
  // 调试输出：显示页面配置和需要登录的页面
  console.log('Pages配置:', JSON.stringify(pages, null, 2))
  console.log('需要登录的页面列表:', getNeedLoginPages())
  
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

onShow(async () => {
  console.log('App Show')
  
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
})

onHide(() => {
  console.log('App Hide')
})
</script>

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
</style>
