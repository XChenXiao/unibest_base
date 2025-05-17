import { defineStore } from 'pinia';
import { ref } from 'vue';
import { getPlatformFrontendSettings } from '@/service/index/platform';

export const usePlatformStore = defineStore('platform', () => {
  // 平台功能开关状态
  const enableBankAccount = ref(true); // 默认开启
  const enableExchange = ref(true); // 默认开启
  
  // 加载状态
  const isLoading = ref(false);
  const isLoaded = ref(false);
  
  /**
   * 获取平台前端功能开关设置
   */
  const fetchPlatformSettings = async () => {
    if (isLoading.value) return;
    
    isLoading.value = true;
    try {
      console.log('开始获取平台功能开关设置...');
      const response = await getPlatformFrontendSettings();
      console.log('获取平台功能开关设置响应:', response);
      
      if (response.status === 'success' && response.data) {
        // 明确使用类型断言处理响应数据
        const settings = response.data as {
          enable_bank_account: boolean;
          enable_exchange: boolean;
        };
        
        console.log('平台功能开关设置:', settings);
        enableBankAccount.value = settings.enable_bank_account;
        enableExchange.value = settings.enable_exchange;
        isLoaded.value = true;
        
        console.log('平台功能开关状态已更新: 银行卡=', enableBankAccount.value, '交易所=', enableExchange.value);
      } else {
        console.warn('获取平台功能开关设置失败或返回数据为空:', response);
      }
    } catch (error) {
      console.error('获取平台设置失败:', error);
    } finally {
      isLoading.value = false;
    }
  };
  
  return {
    enableBankAccount,
    enableExchange,
    isLoading,
    isLoaded,
    fetchPlatformSettings
  };
}); 