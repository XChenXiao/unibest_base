import { CustomRequestOptions } from '@/interceptors/request'
import http from './http'

/**
 * 请求方法: 主要是对 uni.request 的封装，去适配 openapi-ts-request 的 request 方法
 * 适配文档中定义的API响应格式
 * @param options 请求参数
 * @returns 返回 Promise 对象
 */
export function request<T = unknown>(
  url: string,
  options: Omit<CustomRequestOptions, 'url'> & {
    params?: Record<string, unknown>
    headers?: Record<string, unknown>
  },
) {
  // 转换请求选项格式
  const requestOptions = {
    url,
    ...options,
  }

  // 处理query参数
  if (options.params) {
    requestOptions.query = options.params
    delete requestOptions.params
  }

  // 处理header参数
  if (options.headers) {
    requestOptions.header = options.headers
    delete requestOptions.headers
  }

  // 使用http模块发送请求
  return http<T>(requestOptions)
}

/**
 * GET请求方法
 * @param url 请求地址
 * @param params 请求参数(query)
 * @param config 其他配置
 * @returns Promise对象
 */
export function get<T = unknown>(
  url: string,
  params?: Record<string, unknown>,
  config?: Omit<CustomRequestOptions, 'url' | 'method' | 'params'> & {
    headers?: Record<string, unknown>
  }
) {
  return request<T>(url, {
    method: 'GET',
    params,
    ...config,
  })
}

/**
 * POST请求方法
 * @param url 请求地址
 * @param data 请求体数据
 * @param params 请求参数(query)
 * @param config 其他配置
 * @returns Promise对象
 */
export function post<T = unknown>(
  url: string,
  data?: Record<string, unknown>,
  params?: Record<string, unknown>,
  config?: Omit<CustomRequestOptions, 'url' | 'method' | 'data' | 'params'> & {
    headers?: Record<string, unknown>
  }
) {
  return request<T>(url, {
    method: 'POST',
    data,
    params,
    ...config,
  })
}

/**
 * PUT请求方法
 * @param url 请求地址
 * @param data 请求体数据
 * @param params 请求参数(query)
 * @param config 其他配置
 * @returns Promise对象
 */
export function put<T = unknown>(
  url: string,
  data?: Record<string, unknown>,
  params?: Record<string, unknown>,
  config?: Omit<CustomRequestOptions, 'url' | 'method' | 'data' | 'params'> & {
    headers?: Record<string, unknown>
  }
) {
  return request<T>(url, {
    method: 'PUT',
    data,
    params,
    ...config,
  })
}

/**
 * DELETE请求方法
 * @param url 请求地址
 * @param data 请求体数据
 * @param params 请求参数(query)
 * @param config 其他配置
 * @returns Promise对象
 */
export function del<T = unknown>(
  url: string,
  data?: Record<string, unknown>,
  params?: Record<string, unknown>,
  config?: Omit<CustomRequestOptions, 'url' | 'method' | 'data' | 'params'> & {
    headers?: Record<string, unknown>
  }
) {
  return request<T>(url, {
    method: 'DELETE',
    data,
    params,
    ...config,
  })
}

// 导出request对象及便捷方法
request.get = get
request.post = post
request.put = put
request.delete = del

export default request
