import { CustomRequestOptions } from '@/interceptors/request'
import { useUserStore } from '@/store'

// 判断当前是否在登录页面
const isOnLoginPage = () => {
  const pages = getCurrentPages()
  const currentPage = pages[pages.length - 1]
  return currentPage?.route?.includes('login') || false
}

// 检查是否正在重定向到登录页面
const isRedirectingToLogin = () => {
  return uni.getStorageSync('redirecting_to_login') === 'true'
}

// 设置重定向状态
const setRedirectingToLogin = (value: boolean) => {
  uni.setStorageSync('redirecting_to_login', value ? 'true' : 'false')
}

// 跳转到登录页面
const navigateToLogin = () => {
  // 如果当前已经在登录页，则不需要跳转
  if (isOnLoginPage()) {
    return
  }
  
  // 如果已经有一个重定向到登录页面的过程在进行，则不再重复跳转
  if (isRedirectingToLogin()) {
    console.log('已有重定向到登录页面的过程，跳过重复跳转')
    return
  }
  
  // 设置重定向状态为true
  setRedirectingToLogin(true)

  uni.showToast({
    icon: 'none',
    title: '登录已过期，请重新登录',
  })

  setTimeout(() => {
    uni.reLaunch({ 
      url: '/pages/login/index',
      success: () => {
        console.log('成功跳转到登录页面')
      },
      fail: () => {
        setRedirectingToLogin(false)
      }
    })
  }, 1500)
}

export const http = <T>(options: CustomRequestOptions) => {
  // 1. 返回 Promise 对象
  return new Promise<IResData<T>>((resolve, reject) => {
    // 确保带上token
    if (!options.header?.Authorization || !options.header?.authorization) {
      if (!options.header) {
        options.header = {}
      }

      // 从pinia store获取token
      const userStore = useUserStore()
      const token = userStore?.userInfo?.token

      // 如果找到token，添加到请求头
      if (token) {
        options.header.Authorization = `Bearer ${token}`
      } else {
      }
    }

    uni.request({
      ...options,
      dataType: 'json',
      // #ifndef MP-WEIXIN
      responseType: 'json',
      // #endif
      // 响应成功
      success(res) {
        // 添加详细日志，帮助排查问题
        console.log('HTTP响应:', {
          url: options.url,
          statusCode: res.statusCode,
          data: res.data
        });
        
        // 状态码 2xx，参考 axios 的设计
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 2.1 提取核心数据 res.data
          const responseData = res.data as IResData<T>

          // 有些API响应没有status字段，直接返回数据
          if (!responseData.hasOwnProperty('status')) {
            resolve(responseData as any);
            return;
          }

          // 即使HTTP状态码是2xx，也需要检查业务状态
          if (responseData.status === 'success') {
            resolve(responseData)
          } else {
            // 业务逻辑错误处理
            !options.hideErrorToast &&
              uni.showToast({
                icon: 'none',
                title: responseData.message || '请求失败',
              })
            console.error('业务逻辑错误:', responseData);
            reject(responseData)
          }
        } else if (res.statusCode === 401) {
          // 401错误 - 未授权，清理用户信息，跳转到登录页
          console.error('请求未授权 (401):', {
            url: options.url,
            statusCode: res.statusCode,
          })

          // 直接从pinia获取userStore进行清理
          const userStore = useUserStore()
          userStore.clearUserInfo()

          // 使用封装的登录跳转方法
          navigateToLogin()

          reject(res)
        } else if (res.statusCode === 403) {
          // 403错误 - 权限不足
          uni.showToast({
            icon: 'none',
            title: (res.data as any).message || '您没有权限执行此操作',
          })
          reject(res)
        } else if (res.statusCode === 404) {
          // 404错误 - 资源不存在
          uni.showToast({
            icon: 'none',
            title: '请求的资源不存在',
          })
          reject(res)
        } else if (res.statusCode === 422) {
          // 422错误 - 请求参数验证失败
          const responseData = res.data as IResData<T>
          !options.hideErrorToast &&
            uni.showToast({
              icon: 'none',
              title: responseData.message || '参数验证失败',
            })
          reject(res)
        } else {
          // 其他错误 -> 根据后端错误信息轻提示
          const responseData = res.data as IResData<T>
          !options.hideErrorToast &&
            uni.showToast({
              icon: 'none',
              title: responseData.message || '请求错误',
            })
          reject(res)
        }
      },
      // 响应失败
      fail(err) {
        console.error('网络请求失败:', {
          url: options.url,
          error: err,
        })

        uni.showToast({
          icon: 'none',
          title: '网络错误，请检查网络连接',
        })
        reject(err)
      },
    })
  })
}

/**
 * GET 请求
 * @param url 请求地址
 * @param query 请求query参数
 * @param options 其他请求选项
 * @returns Promise对象
 */
export const httpGet = <T>(
  url: string,
  query?: Record<string, any>,
  options?: Partial<CustomRequestOptions>,
) => {
  return http<T>({
    url,
    query,
    method: 'GET',
    ...options,
  })
}

/**
 * POST 请求
 * @param url 请求地址
 * @param data 请求body参数
 * @param query 请求query参数
 * @param options 其他请求选项
 * @returns Promise对象
 */
export const httpPost = <T>(
  url: string,
  data?: Record<string, any>,
  query?: Record<string, any>,
  options?: Partial<CustomRequestOptions>,
) => {
  return http<T>({
    url,
    query,
    data,
    method: 'POST',
    ...options,
  })
}

/**
 * PUT 请求
 * @param url 请求地址
 * @param data 请求body参数
 * @param query 请求query参数
 * @param options 其他请求选项
 * @returns Promise对象
 */
export const httpPut = <T>(
  url: string,
  data?: Record<string, any>,
  query?: Record<string, any>,
  options?: Partial<CustomRequestOptions>,
) => {
  return http<T>({
    url,
    query,
    data,
    method: 'PUT',
    ...options,
  })
}

/**
 * DELETE 请求
 * @param url 请求地址
 * @param data 请求body参数
 * @param query 请求query参数
 * @param options 其他请求选项
 * @returns Promise对象
 */
export const httpDelete = <T>(
  url: string,
  data?: Record<string, any>,
  query?: Record<string, any>,
  options?: Partial<CustomRequestOptions>,
) => {
  return http<T>({
    url,
    query,
    data,
    method: 'DELETE',
    ...options,
  })
}

// 添加便捷方法
http.get = httpGet
http.post = httpPost
http.put = httpPut
http.delete = httpDelete

export default http
