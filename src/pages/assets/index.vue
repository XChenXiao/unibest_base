<route lang="json5">
{
  layout: 'tabbar',
  style: {
    navigationStyle: 'custom',
  },
}
</route>

<template>
  <view class="assets-container">
    <!-- 顶部波浪装饰 -->
    <view class="wave-decoration"></view>
    
    <!-- 页面标题 -->
    <view class="page-title">
      
    </view>
    
    <!-- 资产总览卡片 -->
    <assets-overview 
      :total-assets="assetsInfo.totalAssets"
      :currency-assets="assetsInfo.currencyAssets"
      :equity-assets="assetsInfo.equityAssets"
      :show-assets="showAssets"
      @toggle-visibility="toggleAssetsVisibility"
    />
    
    <!-- 资产类型 Tab 切换 -->
    <view class="assets-tabs">
      <view 
        class="tab-item" 
        :class="{ 'tab-active': activeTab === 'equity' }"
        @click="switchTab('equity')"
      >
        <text>股权</text>
      </view>
      <view 
        class="tab-item" 
        :class="{ 'tab-active': activeTab === 'currency' }"
        @click="switchTab('currency')"
      >
        <text>货币</text>
      </view>
    </view>
    
    <!-- 股权内容 -->
    <view class="tab-content" v-if="activeTab === 'equity'">
      <equity-tab 
        :equity-info="equityInfo"
        @open-sell-equity="openSellEquityPopup"
        @claim-reward="claimReward"
      />
    </view>
    
    <!-- 货币内容 -->
    <view class="tab-content" v-if="activeTab === 'currency'">
      <currency-tab 
        :currency-list="currencyList"
        :userBalance="userBalance"
        @goto-trading="gotoTradingCenter"
        @buy-success="handleCurrencyBuySuccess"
      />
    </view>
    
    <!-- 出售股权弹窗（使用新组件） -->
    <sell-equity-popup
      ref="sellEquityPopup"
      :equity-info="equityInfo"
      @close="closeSellEquityPopup"
      @confirm="confirmSellEquity"
    />
    
    <!-- 底部版权信息 -->
    <view class="assets-footer">
      <text>© 2025 理财管理平台 版权所有</text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, computed, onMounted, onUnmounted } from 'vue';
import AssetsOverview from '@/components/finance/AssetsOverview.vue';
import EquityTab from './components/EquityTab.vue';
import CurrencyTab from './components/CurrencyTab.vue';
import SellEquityPopup from '@/components/equity/SellEquityPopup.vue';
import { 
  getEquityInfo, 
  getMyEquity, 
  sellEquity, 
  getRewardConfigs, 
  claimReward as claimRewardById,
  claimEquityReward,
  getUserAssets, 
  getUserCurrencies, 
  getCurrencyList,
  getUserBalance
} from '@/service/app';
import { useUserStore } from '@/store/user';

// 获取弹窗组件实例
const sellEquityPopup = ref(null);

// 控制资产显示隐藏
const showAssets = ref(true);

// 当前激活的标签页
const activeTab = ref('equity');

// 资产信息
const assetsInfo = reactive({
  totalAssets: 0,
  currencyAssets: 0,
  equityAssets: 0
});

// 股权信息
const equityInfo = reactive({
  holdAmount: 0,
  price: 0,
  registerReward: 0,
  inviteReward: 0,
  isRegisterRewardReceived: false,
  hasClaimableRegistration: false,
  isVerified: false,
  inviteProgress: 0,
  inviteTarget: 1,
  invitationRewardClaimed: false,
  hasClaimableInvitation: false,
  invitationRewards: [],
  // 注册奖励配置详情
  registrationReward: {
    id: 0,
    amount: 0,
    description: ''
  },
  // 用于计算总资产等额外数据
  totalValue: 0,
  todayIncrease: 0,
  totalIncrease: 0,
  changePercent: 0
});

// 货币列表
const currencyList = ref<any[]>([]);

// 用户余额信息
const userBalance = ref(0);

// 用户存储
const userStore = useUserStore();

// 自动刷新定时器
let refreshTimer: ReturnType<typeof setInterval> | null = null;

// 刷新数据
const refreshData = async () => {
  try {
    console.log('刷新资产页面数据');
    // 刷新股权数据
    try {
      await loadEquityInfo();
      await loadUserEquity();
      console.log('股权数据刷新完成:', equityInfo);
    } catch (error) {
      console.error('刷新股权数据失败:', error);
    }
    
    // 刷新其他数据
    try {
      await Promise.all([
        loadRewardConfigs(),
        loadUserCurrencies()
      ]);
    } catch (error) {
      console.error('刷新其他数据失败:', error);
    }
    
    // 刷新余额信息
    loadUserBalance();
    
    // 更新总资产
    updateTotalAssets();
    console.log('资产数据刷新完成');
  } catch (error) {
    console.error('刷新数据失败', error);
  }
};

// 页面加载完成后的初始化
onMounted(async () => {
  console.log('资产页面挂载，开始初始化数据');
  await initializeData();
  
  // 设置定时刷新，每20秒刷新一次数据
  // 注释掉定时刷新功能
  /*
  refreshTimer = setInterval(() => {
    console.log('定时刷新数据');
    refreshData();
  }, 20000);
  */
});

// 清理定时器
onUnmounted(() => {
  /*
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  */
});

// 初始化数据
const initializeData = async () => {
  // 显示加载状态
  uni.showLoading({
    title: '加载中...'
  });
  
  try {
    console.log('开始初始化资产页面数据');
    
    // 先确保用户信息已加载
    if (!userStore.userInfo.id) {
      await userStore.fetchUserInfo();
    }
    
    // 单独加载股权数据，确保不受其他请求影响
    try {
      await loadEquityInfo();
      await loadUserEquity();
      console.log('股权数据加载完成:', equityInfo);
    } catch (error) {
      console.error('加载股权数据失败:', error);
    }
    
    // 加载其他数据
    try {
      await Promise.all([
        loadRewardConfigs(),
        loadUserCurrencies()
      ]);
    } catch (error) {
      console.error('加载其他数据失败:', error);
    }
    
    // 从用户存储获取余额信息
    loadUserBalance();
    
    // 更新总资产数据
    updateTotalAssets();
    console.log('资产数据初始化完成:', { 
      总资产: assetsInfo.totalAssets,
      股权资产: assetsInfo.equityAssets,
      货币资产: assetsInfo.currencyAssets
    });
  } catch (error) {
    console.error('资产页面初始化失败', error);
  } finally {
    // 隐藏加载状态
    uni.hideLoading();
  }
};

// 加载股权基本信息
const loadEquityInfo = async () => {
  try {
    const res = await getEquityInfo();
    if (res.status === 'success' && res.data) {
      // 转换价格字符串为数字
      equityInfo.price = parseFloat(res.data.price);
    }
  } catch (error) {
    console.error('获取股权信息失败', error);
  }
};

// 获取用户持有的股权
const loadUserEquity = async () => {
  console.log('开始加载用户股权数据');
  try {
    // 调用API获取用户股权
    const response = await getMyEquity();
    console.log('获取用户股权响应:', response);
    
    if (response.status === 'success' && response.data) {
      // 记录原始响应数据
      console.log('股权API原始响应数据:', JSON.stringify(response.data));
      
      // 使用类型断言处理数据
      const responseData = response.data as any;
      
      // 安全地访问用户股权数据
      if (responseData.user_equity) {
        // 处理API返回的新结构
        const userEquity = responseData.user_equity;
        // 确保转换字符串为数字
        equityInfo.holdAmount = parseFloat(userEquity.share_amount || '0');
        
        // 如果API没有直接提供价格，使用之前获取的价格信息
        if (equityInfo.price <= 0) {
          await loadEquityInfo();
        }
        
        // 计算总价值
        equityInfo.totalValue = equityInfo.holdAmount * equityInfo.price;
        
        // 默认增长值为0
        equityInfo.todayIncrease = 0;
        equityInfo.totalIncrease = 0;
        equityInfo.changePercent = 0;
        
        // 更新资产信息
        assetsInfo.equityAssets = equityInfo.totalValue;
        
        console.log('股权数据解析完成:', {
          持有数量: equityInfo.holdAmount,
          单价: equityInfo.price,
          总价值: equityInfo.totalValue
        });
      } else if (responseData.equity_info) {
        // 兼容旧版数据结构
        const equityData = responseData.equity_info;
        equityInfo.holdAmount = parseFloat(equityData.share_amount || '0');
        equityInfo.price = parseFloat(equityData.price || '0');
        equityInfo.totalValue = equityInfo.holdAmount * equityInfo.price;
        equityInfo.todayIncrease = parseFloat(equityData.today_increase || '0');
        equityInfo.totalIncrease = parseFloat(equityData.total_increase || '0');
        equityInfo.changePercent = parseFloat(equityData.change_percent || '0');
        
        // 更新资产信息
        assetsInfo.equityAssets = equityInfo.totalValue;
      } else {
        console.warn('未找到有效的股权数据结构', responseData);
      }
      
      // 处理推广奖励配置
      if (responseData.invitation_rewards) {
        const rewards = Array.isArray(responseData.invitation_rewards) 
          ? responseData.invitation_rewards 
          : [];
          
        const invitationRewards = rewards.map((reward: any) => {
          return {
            id: reward.id,
            amount: Number(reward.amount || 0),
            requiredInvites: reward.required_invites,
            inviteCount: reward.invite_count,
            description: reward.description,
            hasClaimed: reward.has_claimed || false,
            hasClaimable: reward.has_claimable || false,
            currentInvites: reward.current_invites || 0,
            claimInfo: reward.claim_info || ''
          };
        });
        
        // 将所有邀请奖励配置存储到响应式对象中，以便于在组件中使用
        equityInfo.invitationRewards = invitationRewards;
      }
      
      // 不从这个API获取认证状态，而是使用userStore中的状态
      // 从用户Store获取认证状态
      equityInfo.isVerified = userStore.isVerified;
    }
  } catch (error) {
    console.error('获取奖励配置失败', error);
  }
};

// 加载奖励配置
const loadRewardConfigs = async () => {
  try {
    const res = await getRewardConfigs();
    if (res.status === 'success') {
      // 使用类型断言将返回的数据转换为任意类型
      const apiResponse = res.data as any;
      
      if (apiResponse && apiResponse.data) {
        const responseData = apiResponse.data;
        
        // 获取注册奖励配置
        if (responseData.registration && responseData.registration.length > 0) {
          const registrationReward = responseData.registration[0];
          equityInfo.registerReward = parseFloat(registrationReward.amount);
          
          // 修正字段映射：has_claimed=是否可领取，has_claimable=是否已领取
          equityInfo.hasClaimableRegistration = registrationReward.has_claimable; // 是否可领取
          equityInfo.isRegisterRewardReceived = registrationReward.has_claimed; // 是否已领取
          
          // 调试日志
          console.log('注册奖励状态 - 修正映射:', {
            '原始has_claimed': registrationReward.has_claimed,
            '原始has_claimable': registrationReward.has_claimable,
            'hasClaimableRegistration(是否可领取)': equityInfo.hasClaimableRegistration,
            'isRegisterRewardReceived(是否已领取)': equityInfo.isRegisterRewardReceived
          });
          
          // 保存注册奖励的完整信息
          equityInfo.registrationReward = {
            id: registrationReward.id,
            amount: parseFloat(registrationReward.amount),
            description: registrationReward.description || '注册实名领取奖励'
          };
        }
        
        // 获取邀请奖励配置（选择第一个邀请奖励配置）
        if (responseData.invitation && responseData.invitation.length > 0) {
          // 找到需要邀请人数最少的奖励
          const sortedInvitations = [...responseData.invitation].sort((a, b) => a.invite_count - b.invite_count);
          const firstInvitation = sortedInvitations[0];
          
          equityInfo.inviteReward = parseFloat(firstInvitation.amount);
          equityInfo.inviteTarget = firstInvitation.invite_count || 1;
          // 修正映射：has_claimable=是否可领取，has_claimed=是否已领取
          equityInfo.hasClaimableInvitation = firstInvitation.has_claimable || false; // 是否可领取
          equityInfo.invitationRewardClaimed = firstInvitation.has_claimed || false; // 是否已领取
          equityInfo.inviteProgress = firstInvitation.current_invites || 0;
          
          // 记录所有可用的邀请奖励配置
          const invitationRewards = responseData.invitation.map((reward: any) => ({
            id: reward.id,
            amount: parseFloat(reward.amount),
            inviteCount: reward.invite_count,
            description: reward.description,
            // 修正映射：has_claimable=是否可领取，has_claimed=是否已领取
            hasClaimable: reward.has_claimable || false, // 是否可领取
            hasClaimed: reward.has_claimed || false, // 是否已领取
            currentInvites: reward.current_invites || 0,
            claimInfo: reward.claim_info || ''
          }));
          
          // 将所有邀请奖励配置存储到响应式对象中，以便于在组件中使用
          equityInfo.invitationRewards = invitationRewards;
        }
        
        // 不从其他API获取用户认证状态，而是从userStore中获取
        equityInfo.isVerified = userStore.isVerified;
      }
    }
  } catch (error) {
    console.error('获取奖励配置失败', error);
  }
};

// 加载用户持有的货币
const loadUserCurrencies = async () => {
  try {
    // 直接获取平台所有货币列表（包含用户余额信息）
    const currenciesRes = await getUserCurrencies();
    if (currenciesRes.status === 'success' && currenciesRes.data) {
      const currencies = currenciesRes.data as unknown as any[];
      currencyList.value = currencies;
      
      // 计算货币总资产
      const currencyTotal = currencies.reduce((total, currency) => {
        // 优先使用API返回的user_current_value
        if ('user_current_value' in currency) {
          return total + parseFloat(currency.user_current_value as string || '0');
        }
        
        // 其次尝试使用price和user_balance计算
        const price = parseFloat(typeof currency.price === 'string' ? currency.price : (currency.price?.toString() || '0'));
        const balance = parseFloat(typeof currency.user_balance === 'string' ? currency.user_balance : (currency.user_balance?.toString() || '0'));
        
        if (price && balance) {
          return total + (price * balance);
        }
        
        // 再次尝试使用之前的字段格式
        const oldPrice = currency.price || (currency.currency ? currency.currency.price : 0);
        const oldAmount = currency.user_balance || currency.amount || currency.holdAmount || 0;
        
        return total + (parseFloat(oldPrice as string || '0') * parseFloat(oldAmount as string || '0'));
      }, 0);
      
      // 更新资产信息
      assetsInfo.currencyAssets = currencyTotal;
      assetsInfo.totalAssets = assetsInfo.currencyAssets + assetsInfo.equityAssets;
    } else {
      // 如果获取失败，再尝试获取资产概览
      const assetsRes = await getUserAssets();
      if (assetsRes.status === 'success' && assetsRes.data) {
        const userAssets = assetsRes.data as any;
        
        // 更新总资产数据
        assetsInfo.totalAssets = Number(userAssets.total_assets);
        assetsInfo.currencyAssets = Number(userAssets.currency_assets);
        assetsInfo.equityAssets = Number(userAssets.equity_assets);
        
        // 如果包含货币数据，更新货币列表
        if (userAssets.currencies && userAssets.currencies.length > 0) {
          currencyList.value = userAssets.currencies;
        }
      }
    }
  } catch (error) {
    console.error('获取用户货币失败', error);
    // 异常情况下，尝试获取所有货币列表
    try {
      const allCurrenciesRes = await getCurrencyList();
      if (allCurrenciesRes.status === 'success' && allCurrenciesRes.data) {
        // 转换为前端可用格式
        const currencies = allCurrenciesRes.data as unknown as any[];
        currencyList.value = currencies.map((currency: any) => ({
          ...currency,
          user_balance: 0,
          user_frozen_amount: 0,
          user_available_balance: 0
        }));
      }
    } catch (innerError) {
      console.error('获取货币列表失败', innerError);
    }
  }
};

// 加载用户余额
const loadUserBalance = async () => {
  // 直接从用户存储中获取余额信息，避免重复请求
  userBalance.value = Number(userStore.userInfo.balance || 0);
};

// 更新总资产
const updateTotalAssets = () => {
  // 如果已经从API获取到了总资产数据，就不需要重新计算
  if (assetsInfo.totalAssets > 0) {
    return;
  }
  
  // 计算货币总资产（如果API中没有提供）
  const currencyTotal = currencyList.value.reduce((total, currency) => {
    // 优先使用API返回的user_current_value
    if ('user_current_value' in currency) {
      return total + parseFloat(currency.user_current_value as string || '0');
    }
    
    // 其次尝试使用price和user_balance计算
    const price = parseFloat(typeof currency.price === 'string' ? currency.price : (currency.price?.toString() || '0'));
    const balance = parseFloat(typeof currency.user_balance === 'string' ? currency.user_balance : (currency.user_balance?.toString() || '0'));
    
    if (price && balance) {
      return total + (price * balance);
    }
    
    // 再次尝试使用之前的字段格式
    const oldPrice = currency.price || (currency.currency ? currency.currency.price : 0);
    const oldAmount = currency.user_balance || currency.amount || currency.holdAmount || 0;
    
    return total + (parseFloat(oldPrice as string || '0') * parseFloat(oldAmount as string || '0'));
  }, 0);
  
  assetsInfo.currencyAssets = currencyTotal;
  assetsInfo.totalAssets = assetsInfo.currencyAssets + assetsInfo.equityAssets;
};

// 切换资产可见性
const toggleAssetsVisibility = () => {
  showAssets.value = !showAssets.value;
};

// 切换标签页
const switchTab = (tab: string) => {
  activeTab.value = tab;
};

// 格式化金额显示
const formatAmount = (amount: number) => {
  return Number(amount).toFixed(2);
};

// 前往交易所
const gotoTradingCenter = (currency?: any) => {
  let url = '/pages/trading/index';
  if (currency) {
    url += `?id=${currency.id}&type=currency`;
  }
  uni.navigateTo({ url });
};

// 打开出售股权弹窗
const openSellEquityPopup = () => {
  // 在打开弹窗前刷新数据
  refreshData();
  sellEquityPopup.value.open();
};

// 关闭出售股权弹窗
const closeSellEquityPopup = () => {
  // 无需额外处理，组件内部已关闭弹窗
};

// 确认出售股权
const confirmSellEquity = async (sellQuantity: number) => {
  try {
    // 显示加载状态
    uni.showLoading({
      title: '处理中...'
    });
    
    // 调用API出售股权
    const res = await sellEquity(sellQuantity);
    
    if (res.status === 'success') {
      // 刷新所有数据
      await refreshData();
      
      // 出售成功提示
      uni.showToast({
        title: '出售成功',
        icon: 'success'
      });
    } else {
      uni.showToast({
        title: res.message || '出售失败',
        icon: 'none'
      });
    }
    
    uni.hideLoading();
  } catch (error) {
    uni.hideLoading();
    uni.showToast({
      title: '出售失败，请重试',
      icon: 'none'
    });
  }
};

// 领取奖励
const claimReward = async (type: string) => {
  // 处理注册奖励
  if (type === 'register') {
    // 已领取过奖励
    if (equityInfo.isRegisterRewardReceived) {
      uni.showToast({
        title: '您已领取过该奖励',
        icon: 'none'
      });
      return;
    }
    
    // 无可领取的奖励
    if (!equityInfo.hasClaimableRegistration) {
      uni.showToast({
        title: '暂无可领取的注册奖励',
        icon: 'none'
      });
      return;
    }
    
    // 未完成实名认证
    if (!equityInfo.isVerified) {
      uni.showToast({
        title: '请先完成实名认证',
        icon: 'none'
      });
      return;
    }
  }
  
  // 处理基本邀请奖励（旧版本兼容性）
  if (type === 'invite') {
    if (equityInfo.invitationRewardClaimed) {
      uni.showToast({
        title: '您已领取过该奖励',
        icon: 'none'
      });
      return;
    }
    
    if (!equityInfo.hasClaimableInvitation) {
      uni.showToast({
        title: `邀请进度未达标(${equityInfo.inviteProgress}/${equityInfo.inviteTarget})`,
        icon: 'none'
      });
      return;
    }
  }
  
  // 处理特定ID的邀请奖励
  if (type.startsWith('invite_')) {
    const rewardId = parseInt(type.substring(7));
    if (isNaN(rewardId)) {
      console.error('无效的奖励ID');
      return;
    }
    
    // 在所有奖励中查找指定ID的奖励
    const reward = equityInfo.invitationRewards.find(r => r.id === rewardId);
    if (!reward) {
      console.error('找不到指定ID的奖励', rewardId);
      return;
    }
    
    if (reward.hasClaimed) {
      uni.showToast({
        title: '您已领取过该奖励',
        icon: 'none'
      });
      return;
    }
    
    if (!reward.hasClaimable) {
      uni.showToast({
        title: reward.claimInfo || `邀请进度未达标(${reward.currentInvites}/${reward.inviteCount})`,
        icon: 'none'
      });
      return;
    }
    
    try {
      // 显示加载状态
      uni.showLoading({
        title: '领取中...'
      });
      
      // 调用领取奖励API，传入奖励ID而不是类型
      const res = await claimRewardById(rewardId);
      
      if (res.status === 'success') {
        // 刷新所有数据
        await refreshData();
        
        // 领取成功提示
        uni.showToast({
          title: '领取成功',
          icon: 'success'
        });
      } else {
        uni.showToast({
          title: res.message || '领取失败',
          icon: 'none'
        });
      }
      
      uni.hideLoading();
    } catch (error) {
      uni.hideLoading();
      uni.showToast({
        title: '领取失败，请重试',
        icon: 'none'
      });
    }
    
    return;
  }
  
  try {
    // 显示加载状态
    uni.showLoading({
      title: '领取中...'
    });
    
    // 调用领取奖励API
    const res = await claimEquityReward(type as any);
    
    if (res.status === 'success') {
      // 刷新所有数据
      await refreshData();
      
      // 领取成功提示
      uni.showToast({
        title: '领取成功',
        icon: 'success'
      });
    } else {
      uni.showToast({
        title: res.message || '领取失败',
        icon: 'none'
      });
    }
    
    uni.hideLoading();
  } catch (error) {
    uni.hideLoading();
    uni.showToast({
      title: '领取失败，请重试',
      icon: 'none'
    });
  }
};

// 处理货币购买成功
const handleCurrencyBuySuccess = async () => {
  // 刷新所有数据
  await refreshData();
};
</script>

<style lang="scss">
/* 全局重置 */
page {
  background-color: #f5f5f5;
  height: 100%;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

/* 容器样式 */
.assets-container {
  display: flex;
  flex-direction: column;
  min-height: 100vh;
  position: relative;
}

/* 顶部波浪装饰 */
.wave-decoration {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 16rpx;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  z-index: 2;
}

/* 页面标题 */
.page-title {
  text-align: center;
  margin-top: 80rpx;
  margin-bottom: 40rpx;
}

.title-text {
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
}

/* 资产类型切换 */
.assets-tabs {
  display: flex;
  background-color: white;
  margin: 0 30rpx 30rpx;
  border-radius: 20rpx;
  overflow: hidden;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.tab-item {
  flex: 1;
  height: 100rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #666;
  position: relative;
}

.tab-active {
  color: #f39c12;
  font-weight: 500;
}

.tab-active::after {
  content: '';
  position: absolute;
  bottom: 0;
  left: 0;
  width: 100%;
  height: 6rpx;
  background: linear-gradient(to right, #f39c12, #e74c3c);
}

/* 内容区域 */
.tab-content {
  background-color: white;
  border-radius: 20rpx;
  margin: 0 30rpx 30rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

/* 底部版权信息 */
.assets-footer {
  text-align: center;
  padding: 30rpx 0;
  color: #999;
  font-size: 24rpx;
  margin-top: auto;
}
</style> 