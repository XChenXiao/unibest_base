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
        // 啥都不需要做
      } else {
        options.url = baseUrl + options.url
      }
      // #endif
      // 非H5正常拼接
      // #ifndef H5
      options.url = baseUrl + options.url
      // #endif
      // TIPS: 如果需要对接多个后端服务，也可以在这里处理，拼接成所需要的地址
    }
    // 1. 请求超时
    options.timeout = 10000 // 10s
    // 2. （可选）添加小程序端请求头标识
    options.header = {
      platform, // 可选，与 uniapp 定义的平台一致，告诉后台来源
      ...options.header,
    }
    // 3. 添加 token 请求头标识
    const userStore = useUserStore()
    const { token } = userStore.userInfo
    if (token) {
      options.header.Authorization = `Bearer ${token}`
    }
  },
}

// 响应拦截器
const responseInterceptor = {
  // 响应拦截，这是一个可选功能
  returnValue(res: any) {
    // 如果是网络请求的响应结果，即包含 statusCode
    if (res && res.statusCode !== undefined) {
      // 可以在这里做一些通用的状态码处理
      // 例如，如果是401，可以触发登出逻辑
      if (res.statusCode === 401) {
        const userStore = useUserStore()
        userStore.clearUserInfo()
        uni.showToast({
          icon: 'none',
          title: '登录已过期，请重新登录',
        })
        setTimeout(() => {
          uni.navigateTo({ url: '/pages/login/index' })
        }, 1500)
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
