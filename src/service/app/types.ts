/* eslint-disable */
// @ts-ignore

export type ApiResponse = {
  code?: number;
  type?: string;
  message?: string;
};

export type Category = {
  id?: number;
  name?: string;
};

export type deleteOrderParams = {
  /** ID of the order that needs to be deleted */
  orderId: number;
};

export type deletePetParams = {
  /** Pet id to delete */
  petId: number;
};

export type deleteUserParams = {
  /** The name that needs to be deleted */
  username: string;
};

export type findPetsByStatusParams = {
  /** Status values that need to be considered for filter */
  status: ('available' | 'pending' | 'sold')[];
};

export type findPetsByTagsParams = {
  /** Tags to filter by */
  tags: string[];
};

export type getOrderByIdParams = {
  /** ID of pet that needs to be fetched */
  orderId: number;
};

export type getPetByIdParams = {
  /** ID of pet to return */
  petId: number;
};

export type getUserByNameParams = {
  /** The name that needs to be fetched. Use user1 for testing.  */
  username: string;
};

export type loginUserParams = {
  /** The user name for login */
  username: string;
  /** The password for login in clear text */
  password: string;
};

export type Order = {
  id?: number;
  petId?: number;
  quantity?: number;
  shipDate?: string;
  /** Order Status */
  status?: 'placed' | 'approved' | 'delivered';
  complete?: boolean;
};

export type Pet = {
  id?: number;
  category?: Category;
  name: string;
  photoUrls: string[];
  tags?: Tag[];
  /** pet status in the store */
  status?: 'available' | 'pending' | 'sold';
};

export enum StatusEnum {
  available = 'available',
  pending = 'pending',
  sold = 'sold',
}

export type IStatusEnum = keyof typeof StatusEnum;

export enum StatusEnum2 {
  placed = 'placed',
  approved = 'approved',
  delivered = 'delivered',
}

export type IStatusEnum2 = keyof typeof StatusEnum2;

export type Tag = {
  id?: number;
  name?: string;
};

export type updatePetWithFormParams = {
  /** ID of pet that needs to be updated */
  petId: number;
};

export type updateUserParams = {
  /** name that need to be updated */
  username: string;
};

export type uploadFileParams = {
  /** ID of pet to update */
  petId: number;
};

export type User = {
  id?: number;
  username?: string;
  firstName?: string;
  lastName?: string;
  email?: string;
  password?: string;
  phone?: string;
  /** User Status */
  userStatus?: number;
};

// 货币相关类型定义
export type Currency = {
  id: number;
  name: string;
  symbol: string;
  icon?: string;
  price: number | string;
  total_supply?: string;
  circulating_supply?: string;
  buy_fee?: string;
  sell_fee?: string;
  min_transaction_amount?: string;
  max_transaction_amount?: string;
  description?: string;
  is_active?: boolean;
  is_base_currency?: boolean;
  is_fixed?: boolean;
  created_at?: string;
  updated_at?: string;
  reward_amount?: number | string;
  has_claimed_reward?: boolean;
  has_claimable_reward?: boolean;
  claimable_transaction_id?: number | null;
  // 用户相关字段（平台API返回）
  user_balance?: number | string;
  user_frozen_amount?: number | string;
  user_available_balance?: number | string;
  user_total_purchased?: number | string;
  user_total_cost?: number | string;
  user_average_cost?: number | string;
  user_current_value?: number | string;
  user_profit?: number | string;
  user_profit_rate?: number | string;
};

export type UserCurrency = {
  id: number;
  user_id: number;
  currency_id: number;
  amount: number;
  frozen_amount?: number;
  currency: Currency;
  has_claimed_reward?: boolean;
  has_claimable_reward?: boolean;
  claimable_transaction_id?: number | null;
  claimable_reward_amount?: number;
};

export type UserAssets = {
  total_assets: number;
  currency_assets: number;
  equity_assets: number;
  currencies: UserCurrency[];
};

// 实名认证状态
export interface VerificationStatus {
  status: string;
  data?: {
    verification?: {
      id: number;
      user_id: number;
      real_name: string;
      id_card_number: string;
      id_card_front: string;
      id_card_back: string;
      id_card_front_url: string;
      id_card_back_url: string;
      status: 'pending' | 'approved' | 'rejected';
      remark?: string;
      verified_at?: string;
      created_at: string;
      updated_at: string;
    };
    verification_status: 'pending' | 'approved' | 'rejected' | 'unsubmitted';
    is_verified: boolean;
  };
  message: string;
}

// 实名认证提交结果
export interface VerificationResult {
  status: string;
  message: string;
  data?: {
    id: string;
    real_name: string;
    id_card_number: string;
    id_card_front: string;
    id_card_back: string;
    id_card_front_url: string;
    id_card_back_url: string;
    status: 'pending';
    created_at: string;
    updated_at: string;
  };
}

// 图片上传结果
export interface UploadImageResult {
  status: string;
  message: string;
  data?: {
    path: string;
    url: string;
    size: number;
    width: number;
    height: number;
    mime_type: string;
    original_name: string;
    thumbnail?: string;
    file_path?: string; // 兼容旧版本
  };
}
