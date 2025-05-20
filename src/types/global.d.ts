declare const __UNI_PLATFORM__:
  | 'h5'
  | 'app'
  | 'mp-alipay'
  | 'mp-baidu'
  | 'mp-jd'
  | 'mp-kuaishou'
  | 'mp-lark'
  | 'mp-qq'
  | 'mp-toutiao'
  | 'mp-weixin'
  | 'quickapp-webview'
  | 'quickapp-webview-huawei'
  | 'quickapp-webview-union'

declare const __VITE_APP_PROXY__: 'true' | 'false'

declare namespace JSX {
  interface IntrinsicElements {
    template: any
    block: any
  }
}

/**
 * 全局类型定义
 */

/**
 * 用户信息接口
 */
interface IUserInfo {
  id: number
  name: string
  phone: string
  invite_code: string
  referrer_invite_code?: string
  equity_balance: number | string
  balance: number | string
  frozen_balance: number | string
  created_at: string
  updated_at: string
  verification?: {
    real_name?: string
    id_card?: string
    created_at?: string
  }
  [key: string]: any
}
