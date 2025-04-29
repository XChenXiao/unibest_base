/* eslint-disable no-param-reassign */
import qs from 'qs'
import { useUserStore } from '@/store'
import { platform } from '@/utils/platform'
import { getEnvBaseUrl } from '@/utils'

export type CustomRequestOptions = UniApp.RequestOptions & {
  query?: Record<string, any>
  /** 出错时是否隐藏错误提示 */
  hideErrorToast?: boolean
  /** 是否需要认证 */
  needAuth?: boolean
} & IUniUploadFileOptions // 添加uni.uploadFile参数类型

// 请求基准地址
const baseUrl = getEnvBaseUrl()

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
      'Content-Type': 'application/json', // 默认内容类型
      ...options.header,
    }
    
    // 3. 添加 token 请求头标识
    const userStore = useUserStore()
    const { token } = userStore.userInfo
    if (token) {
      options.header.Authorization = `Bearer ${token}`
    } else if (options.needAuth !== false) {
      // 如果请求需要认证但没有token，可以在这里处理
      // 例如，可以取消请求，重定向到登录页等
      console.warn('请求需要认证但无Token:', options.url)
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
          
          uni.showToast({
            icon: 'none',
            title: '登录已过期，请重新登录',
          })
          
          // 延迟跳转，让用户能看到提示
          setTimeout(() => {
            uni.navigateTo({ url: '/pages/login/index' })
          }, 1500)
          break;
          
        case 403: // 禁止访问
          uni.showToast({
            icon: 'none',
            title: '您没有权限执行此操作',
          })
          break;
          
        case 404: // 资源不存在
          uni.showToast({
            icon: 'none',
            title: '请求的资源不存在',
          })
          break;
          
        case 500: // 服务器错误
        case 502: // 网关错误
        case 503: // 服务不可用
          uni.showToast({
            icon: 'none',
            title: '服务器错误，请稍后再试',
          })
          break;
      }
    }
    return res
  }
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
