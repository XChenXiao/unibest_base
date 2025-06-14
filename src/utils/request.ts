/**
 * HTTP请求封装
 */

// HTTP请求方法
type HttpMethod = 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD' | 'OPTIONS'

// HTTP请求配置
interface RequestConfig {
  params?: Record<string, any>
  data?: any
  header?: Record<string, string>
  timeout?: number
  [key: string]: any
}

// HTTP响应接口
interface HttpResponse<T = any> {
  status: string
  message?: string
  data?: T
  [key: string]: any
}

/**
 * 封装的HTTP请求类
 */
class HttpRequest {
  /**
   * 发送请求
   * @param method 请求方法
   * @param url 请求地址
   * @param config 请求配置
   * @returns Promise<HttpResponse>
   */
  private request<T = any>(method: HttpMethod, url: string, config: RequestConfig = {}): Promise<HttpResponse<T>> {
    return new Promise((resolve, reject) => {
      uni.request({
        url,
        method: method as any,
        data: method === 'GET' ? config.params : config.data,
        header: config.header || {},
        timeout: config.timeout || 30000,
        success: (res: any) => {
          resolve(res.data as HttpResponse<T>)
        },
        fail: (err: any) => {
          reject(err)
        }
      })
    })
  }

  /**
   * GET请求
   * @param url 请求地址
   * @param config 请求配置
   * @returns Promise<HttpResponse>
   */
  get<T = any>(url: string, config: RequestConfig = {}): Promise<HttpResponse<T>> {
    return this.request<T>('GET', url, config)
  }

  /**
   * POST请求
   * @param url 请求地址
   * @param data 请求数据
   * @param config 请求配置
   * @returns Promise<HttpResponse>
   */
  post<T = any>(url: string, data?: any, config: RequestConfig = {}): Promise<HttpResponse<T>> {
    return this.request<T>('POST', url, { ...config, data })
  }

  /**
   * PUT请求
   * @param url 请求地址
   * @param data 请求数据
   * @param config 请求配置
   * @returns Promise<HttpResponse>
   */
  put<T = any>(url: string, data?: any, config: RequestConfig = {}): Promise<HttpResponse<T>> {
    return this.request<T>('PUT', url, { ...config, data })
  }

  /**
   * DELETE请求
   * @param url 请求地址
   * @param config 请求配置
   * @returns Promise<HttpResponse>
   */
  delete<T = any>(url: string, config: RequestConfig = {}): Promise<HttpResponse<T>> {
    return this.request<T>('DELETE', url, config)
  }
}

// 导出HTTP请求实例
export const http = new HttpRequest() 