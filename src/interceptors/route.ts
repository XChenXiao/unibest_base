/**
 * by 菲鸽 on 2024-03-06
 * 路由拦截，通常也是登录拦截
 * 可以设置路由白名单，或者黑名单，看业务需要选哪一个
 * 我这里应为大部分都可以随便进入，所以使用黑名单
 */
import { useUserStore } from '@/store'
import { needLoginPages as _needLoginPages, getNeedLoginPages } from '@/utils'
import { ref } from 'vue'

// 登录页面路径
const loginRoute = '/pages/login/index'

// 定义白名单路径 - 这些页面永远不需要登录
const whitelistPages = [
  '/pages/login/index', // 登录页面
  '/pages/register/index', // 注册页面
  '/pages/login/password', // 密码登录
  '/pages/login/reset-password', // 重置密码
  '/pages/index/index', // 首页
]

// 手动添加需要登录的页面路径 - 以防配置未生效
const manualNeedLoginPages = ['/pages/my/index', '/pages/verification/index']

// 添加一个标志位，避免多次重定向
const isRedirecting = ref(false)

// 检查是否已登录
const isLogined = () => {
  const userStore = useUserStore()
  return userStore.isLogined
}

const isDev = import.meta.env.DEV

// 黑名单登录拦截器 - （适用于大部分页面不需要登录，少部分页面需要登录）
const navigateToInterceptor = {
  // 注意，这里的url是 '/' 开头的，如 '/pages/index/index'，跟 'pages.json' 里面的 path 不同
  invoke({ url }: { url: string }) {
    console.log('路由拦截器检查URL:', url) // 添加调试输出

    const path = url.split('?')[0]

    // 如果目标页面在白名单中，直接允许导航
    if (whitelistPages.some((whitePath) => path.startsWith(whitePath))) {
      console.log('目标页面在白名单中，允许导航')
      return true
    }

    // 如果已经在重定向过程中，跳过重复检查
    if (isRedirecting.value) {
      console.log('已经在重定向中，跳过拦截器检查')
      return true
    }

    let needLoginPages: string[] = []
    // 为了防止开发时出现BUG，这里每次都获取一下。生产环境可以移到函数外，性能更好
    if (isDev) {
      needLoginPages = getNeedLoginPages()
    } else {
      needLoginPages = _needLoginPages
    }

    console.log(
      '路由拦截器 - 需要登录页面列表:',
      needLoginPages.length > 0 ? needLoginPages : manualNeedLoginPages,
    ) // 添加调试输出

    // 优先使用系统配置的页面列表，如果为空则使用手动配置的列表
    const finalNeedLoginPages = needLoginPages.length > 0 ? needLoginPages : manualNeedLoginPages

    const isNeedLogin = finalNeedLoginPages.includes(path)
    console.log('当前页面是否需要登录:', isNeedLogin) // 添加调试输出

    if (!isNeedLogin) {
      return true
    }

    const hasLogin = isLogined()
    console.log('用户是否已登录:', hasLogin) // 添加调试输出

    if (hasLogin) {
      return true
    }

    console.log('用户未登录，重定向到登录页') // 添加调试输出

    // 设置重定向标志位，防止循环重定向
    isRedirecting.value = true

    // 添加超时重置标志位，防止标志位一直为true
    setTimeout(() => {
      isRedirecting.value = false
    }, 2000)

    const redirectRoute = `${loginRoute}?redirect=${encodeURIComponent(url)}`
    uni.navigateTo({ url: redirectRoute })
    return false
  },
}

export const routeInterceptor = {
  install() {
    console.log('安装路由拦截器') // 添加调试输出
    uni.addInterceptor('navigateTo', navigateToInterceptor)
    uni.addInterceptor('reLaunch', navigateToInterceptor)
    uni.addInterceptor('redirectTo', navigateToInterceptor)
    uni.addInterceptor('switchTab', navigateToInterceptor)
  },
}
