import { http } from '@/utils/http'
export interface IFooItem {
  id: string
  name: string
}

/** GET 请求 */
export const getFooAPI = (name: string) => {
  // 使用uni-app的请求任务来实现取消
  let requestTask: UniApp.RequestTask | null = null
  
  // 返回请求和取消请求的方法
  return {
    request: new Promise((resolve, reject) => {
      // 直接使用uni.request以便获取requestTask
      requestTask = uni.request({
        url: '/foo', 
        data: { name },
        method: 'GET',
        success: (res) => {
          // 请求成功后处理
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data)
          } else {
            reject(res)
          }
        },
        fail: (err) => {
          reject(err)
        },
        complete: () => {
          requestTask = null
        }
      })
    }),
    cancel: () => {
      if (requestTask) {
        requestTask.abort()
        requestTask = null
      }
    }
  }
}

/** POST 请求 */
export const postFooAPI = (name: string) => {
  // 使用uni-app的请求任务来实现取消
  let requestTask: UniApp.RequestTask | null = null
  
  // 返回请求和取消请求的方法
  return {
    request: new Promise((resolve, reject) => {
      // 直接使用uni.request以便获取requestTask
      requestTask = uni.request({
        url: '/foo',
        data: { name },
        method: 'POST',
        success: (res) => {
          // 请求成功后处理
          if (res.statusCode >= 200 && res.statusCode < 300) {
            resolve(res.data)
          } else {
            reject(res)
          }
        },
        fail: (err) => {
          reject(err)
        },
        complete: () => {
          requestTask = null
        }
      })
    }),
    cancel: () => {
      if (requestTask) {
        requestTask.abort()
        requestTask = null
      }
    }
  }
}
