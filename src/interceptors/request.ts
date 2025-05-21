/* eslint-disable no-param-reassign */
import qs from 'qs'
import { useUserStore } from '@/store'
import { platform } from '@/utils/platform'
import { getEnvBaseUrl } from '@/utils'

export type CustomRequestOptions = UniApp.RequestOptions & {
  query?: Record<string, any>
  /** 出错时是否隐藏错误提示 */
  hideErrorToast?: boolean
} & IUniUploadFileOptions // 添加uni.uploadFile参数类型

// 请求基准地址
const baseUrl = getEnvBaseUrl()

// 判断当前是否在登录页面
const isOnLoginPage = () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  return currentPage?.route?.includes('login') || false
}

// 跳转到登录页面
const navigateToLogin = () => {
  // 如果当前已经在登录页，则不需要跳转
  if (isOnLoginPage()) {
    return
  }

  uni.showToast({
    icon: 'none',
    title: '登录已过期，请重新登录',
  })

  setTimeout(() => {
    uni.navigateTo({ url: '/pages/login/index' })
  }, 1500)
}

// 拦截器配置
const httpInterceptor = {
  // 拦截前触发
  invoke(options: CustomRequestOptions) {
    // 接口请求支持通过 query 参数配置 queryString
    if (options.query) {
      const queryStr = qs.stringify(options.query)
      if (options.url.includes('?')) {
        options.url += `&${queryStr}`
      } else {
        options.url += `?${queryStr}`
      }
    }
    // 非 http 开头需拼接地址
    if (!options.url.startsWith('http')) {
      // #ifdef H5
      // console.log(__VITE_APP_PROXY__)
      if (JSON.parse(__VITE_APP_PROXY__)) {
        // 如果是 H5 环境且启用了代理，使用接口代理
        // 不需要做额外处理
      } else {
        options.url = baseUrl + options.url
      }
      // #endif
      // 非H5正常拼接
      // #ifndef H5
      options.url = baseUrl + options.url
      // #endif
    }

    // 1. 请求超时
    options.timeout = 10000 // 10s

    // 2. 添加请求头
    options.header = {
      platform, // 平台标识
      ...options.header,
    }

    // 判断是否为文件上传请求 - 看是否有filePath属性
    const isUploadRequest = 'filePath' in options && !!options.filePath

    // 如果不是文件上传请求，添加JSON Content-Type
    if (!isUploadRequest && !options.header['Content-Type']) {
      options.header['Content-Type'] = 'application/json'
    }

    // 3. 添加 token 请求头标识 - 默认为所有请求添加token
    try {
      // 直接从pinia store获取token
      const userStore = useUserStore()
      const token = userStore?.userInfo?.token

      // 添加token到请求头
      if (token) {
        options.header.Authorization = `Bearer ${token}`
        console.log(`拦截器已添加token到请求头:`, options.url)
      } else {
        // 如果没有token，这里不处理错误，让http层再尝试获取一次
        console.warn(`拦截器未找到token:`, options.url)
      }
    } catch (error) {
      console.error('拦截器添加token失败:', error)
    }
  },
}

// 响应拦截器
const responseInterceptor = {
  // 响应拦截，这是一个可选功能
  returnValue(res: any) {
    // 如果是网络请求的响应结果，即包含 statusCode
    if (res && res.statusCode !== undefined) {
      // 处理常见的HTTP状态码
      switch (res.statusCode) {
        case 401: // 未授权
          // 清除用户信息并跳转到登录页
          const userStore = useUserStore()
          userStore.clearUserInfo()

          // 使用封装的登录跳转方法
          navigateToLogin()
          break

        case 403: // 禁止访问
          uni.showToast({
            icon: 'none',
            title: '您没有权限执行此操作',
          })
          break

        case 404: // 资源不存在
          uni.showToast({
            icon: 'none',
            title: '请求的资源不存在',
          })
          break

        case 500: // 服务器错误
        case 502: // 网关错误
        case 503: // 服务不可用
          uni.showToast({
            icon: 'none',
            title: '服务器错误，请稍后再试',
          })
          break
      }
    }
    return res
  },
}

export const requestInterceptor = {
  install() {
    // 拦截 request 请求
    uni.addInterceptor('request', httpInterceptor)
    uni.addInterceptor('request', responseInterceptor)
    // 拦截 uploadFile 文件上传
    uni.addInterceptor('uploadFile', httpInterceptor)
    uni.addInterceptor('uploadFile', responseInterceptor)
  },
}
