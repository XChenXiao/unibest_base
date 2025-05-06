/* eslint-disable */
// @ts-ignore
import { http, httpGet, httpPost, httpPut, httpDelete } from '@/utils/http';
import { CustomRequestOptions } from '@/interceptors/request';

/**
 * 二维码详情
 */
export interface QrcodeDetails {
  exists: boolean
  id: number
  url: string
  collection: string
  disk: string
  file_name: string
  mime_type: string
  size: number
  storage_type: string
}

/**
 * 客服信息响应类型
 */
export interface CustomerServiceInfo {
  promotion_info: string
  promotion_group_number: string
  promotion_qrcode_url: string | null
  qrcode_details?: {
    exists: boolean
    id: number
    url: string
    collection: string
    disk: string
    file_name: string
    mime_type: string
    size: number
    storage_type: string
  }
  is_active: boolean
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
  return httpGet<CustomerServiceResponse>('/api/customer-service', null, options);
} 