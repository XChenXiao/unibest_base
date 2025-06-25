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
 * 短信验证码注册请求参数接口
 */
export interface ISmsRegisterParams {
  phone: string
  code: string
  password: string
  password_confirmation: string
  withdraw_password: string
  referrer_invite_code?: string
}

/**
 * 图片验证码注册请求参数接口
 */
export interface ICaptchaRegisterParams {
  phone: string
  captcha_id: string
  captcha_code: string
  password: string
  password_confirmation: string
  withdraw_password: string
  referrer_invite_code?: string
  name?: string
}

/**
 * 发送短信验证码请求参数接口
 */
export interface ISendSmsParams {
  mobile: string
  type: 'login' | 'register' | 'reset_password' | 'withdraw'
}

/**
 * 生成图片验证码请求参数接口
 */
export interface IGenerateCaptchaParams {
  type?: 'login' | 'register' | 'reset_password' | 'withdraw'
}

/**
 * 验证图片验证码请求参数接口
 */
export interface IVerifyCaptchaParams {
  captcha_id: string
  code: string
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
 * 图片验证码登录请求参数接口 
 */
export interface ICaptchaLoginParams {
  login_id?: string
  mobile?: string
  password: string
  captcha_id: string
  captcha_code: string
}

/**
 * 用户找回密码请求参数接口
 */
export interface IForgotPasswordParams {
  phone: string
  name: string
  id_card_number: string
  new_password: string
  new_password_confirmation: string
}

/**
 * 用户重置密码请求参数接口
 */
export interface IResetPasswordParams {
  current_password: string
  new_password: string
  new_password_confirmation: string
}

/**
 * 短信验证码登录请求参数接口
 */
export interface ISmsLoginParams {
  phone: string
  code: string
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
 * 发送短信验证码API
 * @param params 发送短信参数
 * @returns Promise
 */
export const sendSmsCodeAPI = (params: ISendSmsParams) => {
  return http.post<{
    status: string
    message: string
    data?: {
      cooldown: number
      expires_in: number
    }
  }>('/api/send-verification-code', {
    mobile: params.mobile,
    type: params.type || 'login'
  })
}

/**
 * 生成图片验证码API
 * @param params 生成验证码参数
 * @returns Promise
 */
export const generateCaptchaAPI = (params: IGenerateCaptchaParams = {}) => {
  return http.post<{
    status: string
    message: string
    data: {
      captcha_id: string
      captcha_image: string
      expires_in: number
    }
  }>('/api/captcha/generate-image', params)
}

/**
 * 验证图片验证码API
 * @param params 验证码参数
 * @returns Promise
 */
export const verifyCaptchaAPI = (params: IVerifyCaptchaParams) => {
  return http.post<{
    status: string
    message: string
    data?: {
      type: string
    }
  }>('/api/captcha/verify', params)
}

/**
 * 短信验证码注册API
 * @param params 短信注册参数
 * @returns Promise
 */
export const smsRegisterAPI = (params: ISmsRegisterParams) => {
  return http.post<{
    status: string
    message: string
    data?: {
      user: IUserInfo
      access_token: string
      token_type: string
    }
  }>('/api/register-with-sms', params)
}

/**
 * 图片验证码注册API
 * @param params 图片验证码注册参数
 * @returns Promise
 */
export const captchaRegisterAPI = (params: ICaptchaRegisterParams) => {
  return http.post<{
    status: string
    message: string
    data?: {
      user: IUserInfo
      access_token: string
      token_type: string
    }
  }>('/api/register-with-captcha', params)
}

/**
 * 用户登录API
 * @param params 登录参数
 * @returns Promise
 */
export const loginAPI = (params: ILoginParams) => {
  return http.post<{
    status: string
    message: string
    data?: {
      user: IUserInfo
      access_token: string
      token_type: string
    }
  }>('/api/login', {
    login_type: 'password',
    mobile: params.login_id,
    password: params.password
  })
}

/**
 * 图片验证码登录API
 * @param params 图片验证码登录参数
 * @returns Promise
 */
export const captchaLoginAPI = (params: ICaptchaLoginParams) => {
  return http.post<{
    status: string
    message: string
    data?: {
      user: IUserInfo
      access_token: string
      token_type: string
    }
  }>('/api/login-with-captcha', params)
}

/**
 * 用户找回密码API
 * @param params 找回密码参数
 * @returns Promise
 */
export const forgotPasswordAPI = (params: IForgotPasswordParams) => {
  return http.post<any>('/api/forgot-password', params)
}

/**
 * 用户重置密码API (需要登录)
 * @param params 重置密码参数
 * @returns Promise
 */
export const resetPasswordAPI = (params: IResetPasswordParams) => {
  return http.post<any>('/api/reset-password', params)
}

/**
 * 使用短信验证码登录API
 * @param params 短信登录参数
 * @returns Promise
 */
export const smsLoginAPI = (params: ISmsLoginParams) => {
  return http.post<{
    status: string
    message: string
    data?: {
      user: IUserInfo
      access_token: string
      token_type: string
    }
  }>('/api/login', {
    login_type: 'sms',
    mobile: params.phone,
    code: params.code
  })
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