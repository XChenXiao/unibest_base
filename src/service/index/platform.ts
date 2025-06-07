import { http } from '@/utils/http';

/**
 * 平台设置接口响应类型
 */
export interface PlatformSettingsResponse {
  status: string;
  message: string;
  data: {
    enable_bank_account: boolean;
    enable_exchange: boolean;
    enable_gold_buy: boolean;
    enable_gold_sell: boolean;
    enable_usdt_buy: boolean;
  };
}

/**
 * 获取前端功能开关设置
 * @returns 功能开关设置
 */
export const getPlatformFrontendSettings = async () => {
  try {
    console.log('开始请求平台前端功能开关设置API...');
    const response = await http.get<PlatformSettingsResponse>('/api/platform-settings/frontend');
    console.log('平台设置API响应:', response);
    return response;
  } catch (error) {
    console.error('获取平台前端功能开关设置失败:', error);
    console.log('返回默认值');
    return {
      status: 'error',
      message: '获取平台前端功能开关设置失败',
      data: {
        enable_bank_account: true, // 默认开启
        enable_exchange: true, // 默认开启
        enable_gold_buy: true, // 默认开启
        enable_gold_sell: true, // 默认开启
        enable_usdt_buy: true // 默认开启
      }
    };
  }
}; 