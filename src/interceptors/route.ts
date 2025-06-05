/**
 * by 菲鸽 on 2024-03-06
 * 路由拦截，通常也是登录拦截
 * 使用黑名单模式 - 默认所有页面都需要登录验证，除了特定的页面（登录、找回密码、注册）
 */
import { useUserStore } from '@/store'
import { ref } from 'vue'

// 登录页面路径
const loginRoute = '/pages/login/password'

// 定义白名单路径 - 这些页面不需要登录
const noLoginPages = [
  '/pages/login/index', // 登录页面
  '/pages/register/index', // 注册页面
  '/pages/register/captcha', // 图形验证码注册页面
  '/pages/login/password', // 密码登录
  '/pages/login/reset-password', // 重置密码
]

// 添加一个标志位，避免多次重定向
const isRedirecting = ref(false)

// 保存白名单到本地缓存
const saveNoLoginPathsToStorage = () => {
  uni.setStorageSync('no_login_paths', JSON.stringify(noLoginPages))
}

// 从本地缓存获取白名单
const getNoLoginPathsFromStorage = () => {
  const paths = uni.getStorageSync('no_login_paths')
  return paths ? JSON.parse(paths) : noLoginPages
}

// 检查页面是否在白名单中
const isInNoLoginPaths = (path: string) => {
  const paths = getNoLoginPathsFromStorage()
  return paths.some((noLoginPath: string) => path.startsWith(noLoginPath))
}

// 检查是否已登录
const isLogined = () => {
  const userStore = useUserStore()
  return userStore.isLogined
}

// 检查当前路径是否为注册路径
const isRegisterPath = (path: string) => {
  return path.startsWith('/pages/register/')
}

// 登录拦截器 - 默认所有页面都需要登录，除了白名单中的页面
const navigateToInterceptor = {
  // 注意，这里的url是 '/' 开头的，如 '/pages/index/index'，跟 'pages.json' 里面的 path 不同
  invoke({ url }: { url: string }) {
    console.log('路由拦截器检查URL:', url) // 添加调试输出

    const path = url.split('?')[0]

    // 先检查是否为注册路径，如果是则直接允许导航，不需要登录
    if (isRegisterPath(path)) {
      console.log('检测到注册路径，允许导航:', path)
      return true
    }

    // 如果目标页面不需要登录，直接允许导航
    if (isInNoLoginPaths(path)) {
      console.log('目标页面不需要登录，允许导航')
      return true
    }

    // 检查是否正在重定向到登录页面
    const isRedirectingToLoginFlag = uni.getStorageSync('redirecting_to_login') === 'true'
    if (isRedirectingToLoginFlag) {
      console.log('已有重定向到登录页面的过程，跳过拦截器重定向')
      return true
    }

    // 如果已经在重定向过程中，跳过重复检查
    if (isRedirecting.value) {
      console.log('已经在重定向中，跳过拦截器检查')
      return true
    }

    // 检查登录状态
    const hasLogin = isLogined()
    console.log('用户是否已登录:', hasLogin) // 添加调试输出

    if (hasLogin) {
      return true
    }

    console.log('用户未登录，检查是否有缓存的页面路径') // 添加调试输出

    // 检查是否有缓存的页面路径
    const lastPagePath = uni.getStorageSync('last_page_path')

    // 检查缓存的页面路径是否为注册路径
    if (lastPagePath && isRegisterPath(lastPagePath)) {
      console.log('检测到缓存的注册页面路径，重定向到:', lastPagePath)

      // 设置重定向标志位，防止循环重定向
      isRedirecting.value = true
      uni.setStorageSync('redirecting_to_login', 'true')

      // 使用reLaunch而不是跳转到登录页
      uni.reLaunch({
        url: lastPagePath,
        complete: () => {
          setTimeout(() => {
            isRedirecting.value = false
            uni.setStorageSync('redirecting_to_login', 'false')
          }, 2000)
        },
      })
      return false
    }

    if (lastPagePath && isInNoLoginPaths(lastPagePath)) {
      console.log('检测到缓存的白名单页面路径，重定向到:', lastPagePath)

      // 设置重定向标志位，防止循环重定向
      isRedirecting.value = true
      uni.setStorageSync('redirecting_to_login', 'true')

      // 使用reLaunch而不是跳转到登录页
      uni.reLaunch({
        url: lastPagePath,
        complete: () => {
          setTimeout(() => {
            isRedirecting.value = false
            uni.setStorageSync('redirecting_to_login', 'false')
          }, 2000)
        },
      })
      return false
    }

    console.log('用户未登录，重定向到登录页') // 添加调试输出

    // 先确保重定向标志位为false，以防因异常导致的标志位为true
    uni.setStorageSync('redirecting_to_login', 'false')

    // 设置重定向标志位，防止循环重定向
    isRedirecting.value = true
    // 设置本地存储标志
    uni.setStorageSync('redirecting_to_login', 'true')

    // 添加超时重置标志位，防止标志位一直为true
    setTimeout(() => {
      isRedirecting.value = false
      // 不重置 redirecting_to_login，让登录页面来重置
    }, 2000)

    uni.reLaunch({ url: loginRoute })
    return false
  },
}

export const routeInterceptor = {
  install() {
    console.log('安装路由拦截器') // 添加调试输出

    // 初始化时保存白名单到缓存
    saveNoLoginPathsToStorage()

    uni.addInterceptor('navigateTo', navigateToInterceptor)
    uni.addInterceptor('reLaunch', navigateToInterceptor)
    uni.addInterceptor('redirectTo', navigateToInterceptor)
    uni.addInterceptor('switchTab', navigateToInterceptor)
  },
}
