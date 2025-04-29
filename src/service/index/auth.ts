import { http } from '@/utils/http'

/**
 * 用户注册请求参数接口
 */
export interface IRegisterParams {
  name: string
  phone: string
  password: string
  password_confirmation: string
  withdraw_password: string
  referrer_invite_code?: string
}

/**
 * 用户登录请求参数接口
 */
export interface ILoginParams {
  login_id?: string
  mobile?: string
  password: string
}

/**
 * 用户注册API
 * @param params 注册参数
 * @returns Promise
 */
export const registerAPI = (params: IRegisterParams) => {
  return http.post<IUserInfo>('/api/register', params)
}

/**
 * 用户登录API
 * @param params 登录参数
 * @returns Promise
 */
export const loginAPI = (params: ILoginParams) => {
  return http.post<{
    user: IUserInfo
    access_token: string
    token_type: string
  }>('/api/login', params)
}

/**
 * 获取用户信息API
 * @returns Promise
 */
export const getUserInfoAPI = () => {
  return http.get<IUserInfo>('/api/user')
}

/**
 * 用户登出API
 * @returns Promise
 */
export const logoutAPI = () => {
  return http.post<void>('/api/logout')
} 