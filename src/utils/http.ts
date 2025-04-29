import { CustomRequestOptions } from '@/interceptors/request'

export const http = <T>(options: CustomRequestOptions) => {
  // 1. 返回 Promise 对象
  return new Promise<IResData<T>>((resolve, reject) => {
    uni.request({
      ...options,
      dataType: 'json',
      // #ifndef MP-WEIXIN
      responseType: 'json',
      // #endif
      // 响应成功
      success(res) {
        // 状态码 2xx，参考 axios 的设计
        if (res.statusCode >= 200 && res.statusCode < 300) {
          // 2.1 提取核心数据 res.data
          const responseData = res.data as IResData<T>
          
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
            reject(responseData)
          }
        } else if (res.statusCode === 401) {
          // 401错误 - 未授权，清理用户信息，跳转到登录页
          const userStore = uni.getStorageSync('userStore') 
            ? JSON.parse(uni.getStorageSync('userStore'))
            : null
          if (userStore && userStore.clearUserInfo) {
            userStore.clearUserInfo()
          }
          uni.showToast({
            icon: 'none',
            title: '登录已过期，请重新登录',
          })
          setTimeout(() => {
            uni.navigateTo({ url: '/pages/login/index' })
          }, 1500)
          reject(res)
        } else if (res.statusCode === 403) {
          // 403错误 - 权限不足
          uni.showToast({
            icon: 'none',
            title: '您没有权限执行此操作',
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
  options?: Partial<CustomRequestOptions>
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
  options?: Partial<CustomRequestOptions>
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
  options?: Partial<CustomRequestOptions>
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
  options?: Partial<CustomRequestOptions>
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
