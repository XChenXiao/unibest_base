import { onLoad, onUnload, onShow, onHide, onTabItemTap } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { useUserStore } from '@/store/user';

/**
 * TabBar页面切换监听钩子
 * 当用户点击TabBar切换到该页面时，可以触发数据刷新
 * @param options 配置选项
 * @returns TabBar页面状态
 */
export function useTabItemTap(options: {
  // 是否自动刷新用户信息
  refreshUserInfo?: boolean;
  // 当前页面名称，用于日志
  pageName?: string;
  // 切换到该页面时的回调
  onTabTap?: () => void;
}) {
  const {
    refreshUserInfo = true,
    pageName = '当前页面',
    onTabTap
  } = options;
  
  // 是否从TabBar切换而来
  const fromTabSwitch = ref(false);
  // 页面是否可见
  const isVisible = ref(false);
  // 用户数据存储
  const userStore = useUserStore();
  
  // 检查用户信息
  const checkUserInfo = async () => {
    // 只有当配置了刷新用户信息且用户已登录时才执行
    if (refreshUserInfo && userStore.isLogined) {
      // 获取上次更新时间
      const lastUpdateTime = uni.getStorageSync('userInfoUpdateTime') || 0;
      const currentTime = Date.now();
      const timeElapsed = currentTime - lastUpdateTime;
      
      // 如果距离上次更新超过1分钟，则重新获取用户信息
      if (timeElapsed > 1 * 60 * 1000) {
        console.log(`[${pageName}] 用户数据需要刷新`);
        await userStore.fetchUserInfo();
      } else {
        console.log(`[${pageName}] 用户数据在有效期内，无需刷新`);
      }
    }
  };
  
  // 监听页面加载
  onLoad(() => {
    console.log(`[${pageName}] 页面加载`);
  });
  
  // 监听页面显示
  onShow(() => {
    isVisible.value = true;
    console.log(`[${pageName}] 页面显示`);
    
    // 判断是否需要刷新用户数据
    checkUserInfo();
    
    // 执行用户自定义回调
    if (onTabTap) {
      onTabTap();
    }
  });
  
  // 监听页面隐藏
  onHide(() => {
    isVisible.value = false;
    console.log(`[${pageName}] 页面隐藏`);
  });
  
  // 监听页面卸载
  onUnload(() => {
    console.log(`[${pageName}] 页面卸载`);
  });
  
  // 额外监听TabBar项点击事件
  onTabItemTap((item) => {
    console.log(`[${pageName}] TabItem被点击:`, item);
    fromTabSwitch.value = true;
    
    // TabBar项被点击时，也检查刷新用户数据
    if (isVisible.value) {
      checkUserInfo();
    }
  });
  
  return {
    fromTabSwitch,
    isVisible,
    checkUserInfo
  };
} 