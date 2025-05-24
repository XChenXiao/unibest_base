/* eslint-disable */
// @ts-ignore
import { http, httpGet, httpPost, httpPut, httpDelete } from '@/utils/http';
import { CustomRequestOptions } from '@/interceptors/request';

/**
 * 二维码详情
 */
export interface QrcodeDetails {
  exists: boolean
  path?: string
  url: string
  storage_type: string
  id?: number
  collection?: string
  disk?: string
  file_name?: string
  mime_type?: string
  size?: number
}

/**
 * 客服信息响应类型
 */
export interface CustomerServiceInfo {
  promotion_info: string
  promotion_group_number: string
  promotion_qrcode_url: string | null
  qrcode_details?: QrcodeDetails | null
  is_active: boolean
  updated_at?: string
}

/**
 * 客服API响应类型
 */
export interface CustomerServiceResponse {
  status: string
  message: string
  data: CustomerServiceInfo | null
}

/**
 * 获取客服信息API
 * 
 * @returns 客服信息
 */
export function getCustomerServiceInfoAPI(options?: CustomRequestOptions) {
  return httpGet<CustomerServiceInfo>('/api/customer-service', null, options);
} 