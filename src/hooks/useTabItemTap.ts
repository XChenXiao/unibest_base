import { onLoad, onUnload, onShow, onHide, onTabItemTap } from '@dcloudio/uni-app';
import { ref } from 'vue';
import { useUserStore } from '@/store/user';
import { useUserInfoStore } from '@/store/userInfo';

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
  // 是否为首页
  isIndexPage?: boolean;
  // 切换到该页面时的回调
  onTabTap?: () => void;
}) {
  const {
    refreshUserInfo = true,
    pageName = '当前页面',
    isIndexPage = false,
    onTabTap
  } = options;
  
  // 是否从TabBar切换而来
  const fromTabSwitch = ref(false);
  // 页面是否可见
  const isVisible = ref(false);
  // 用户数据存储
  const userStore = useUserStore();
  // 增强版用户信息存储
  const userInfoStore = useUserInfoStore();
  
  // 检查用户信息
  const checkUserInfo = async () => {
    // 只在首页或明确要求刷新用户信息时才获取用户数据
    if (refreshUserInfo && userStore.isLogined && isIndexPage) {
      console.log(`[${pageName}] 首页加载，刷新用户数据`);
      // 使用增强版用户信息store获取用户数据，强制刷新
      await userInfoStore.getUserCompleteInfo(true);
      // 同时保持原有的userStore更新，确保兼容性
      await userStore.fetchUserInfo();
    }
  };
  
  // 监听页面加载
  onLoad(() => {
    console.log(`[${pageName}] 页面加载`);
    
    // 如果是首页，在页面首次加载时获取最新用户数据
    if (isIndexPage) {
      checkUserInfo();
    }
  });
  
  // 监听页面显示
  onShow(() => {
    isVisible.value = true;
    console.log(`[${pageName}] 页面显示`);
    
    // 如果是首页，在页面显示时刷新用户数据
    if (isIndexPage) {
      checkUserInfo();
    }
    
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
    
    // 仅当是首页时，在TabBar项被点击时刷新用户数据
    if (isVisible.value && isIndexPage) {
      checkUserInfo();
    }
  });
  
  return {
    fromTabSwitch,
    isVisible,
    checkUserInfo
  };
} 