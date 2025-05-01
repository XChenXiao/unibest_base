declare interface IUserInfo {
  id?: number
  name?: string
  email?: string
  phone?: string
  token?: string
  invite_code?: string
  referrer_invite_code?: string
  referrer_id?: number
  referrer_name?: string
  balance?: number
  frozen_balance?: number
  equity_balance?: number
  registration_date?: string
  created_at?: string
  updated_at?: string
  /** 已验证的推荐人数量 */
  verified_referrals_count?: number
  /** 是否有银行卡 */
  has_bank_card?: boolean
  /** 银行卡开通时间 */
  bank_card_opened_at?: string
  /** 是否已通过实名认证 */
  is_verified?: boolean
}

declare interface ILoginResponse {
  user: IUserInfo
  access_token: string
  token_type: string
}

declare interface IRegisterResponse {
  user: IUserInfo
} 