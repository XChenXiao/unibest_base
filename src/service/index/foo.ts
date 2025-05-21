import { http } from '@/utils/http'
import { CustomRequestOptions } from '@/interceptors/request'

export interface IFooItem {
  id: string
  name: string
}

/** GET 请求 */
export const getFooAPI = (name: string) => {
  // 使用http工具提供的请求方法
  let controller: AbortController | null = new AbortController()

  // 返回请求和取消请求的方法
  return {
    request: http.get('/foo', { name }),
    cancel: () => {
      if (controller) {
        controller.abort()
        controller = null
      }
    },
  }
}

/** POST 请求 */
export const postFooAPI = (name: string) => {
  // 使用http工具提供的请求方法
  let controller: AbortController | null = new AbortController()

  // 返回请求和取消请求的方法
  return {
    request: http.post('/foo', { name }),
    cancel: () => {
      if (controller) {
        controller.abort()
        controller = null
      }
    },
  }
}
