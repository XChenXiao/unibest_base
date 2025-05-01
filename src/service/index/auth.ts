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
  return http.get<any>('/api/user')
    .then(res => {
      // 确保余额字段是数字类型
      if (res.status === 'success' && res.data && res.data.user) {
        // 转换余额字段类型
        const userData = res.data.user;
        
        // 处理用户姓名：如果用户已实名认证且有实名信息，则使用实名信息中的真实姓名作为用户名称
        if (res.data.is_verified && userData.verification && userData.verification.real_name) {
          userData.name = userData.verification.real_name;
        }
        
        return {
          status: 'success',
          data: {
            ...res.data,
            user: {
              ...userData,
              balance: userData.balance ? Number(userData.balance) : 0,
              frozen_balance: userData.frozen_balance ? Number(userData.frozen_balance) : 0,
              equity_balance: userData.equity_balance ? Number(userData.equity_balance) : 0
            }
          }
        };
      }
      return res;
    });
}

/**
 * 用户登出API
 * @returns Promise
 */
export const logoutAPI = () => {
  return http.post<void>('/api/logout')
} 