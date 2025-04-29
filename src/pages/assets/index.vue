<route lang="json5">
{
  layout: 'tabbar',
  style: {
    navigationBarTitleText: '我的资产',
  },
}
</route>

<template>
  <view class="assets-container">
    <!-- 顶部波浪装饰 -->
    <view class="wave-decoration"></view>
    
    <!-- 页面标题 -->
    <view class="page-title">
      <text class="title-text">我的资产</text>
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
        @goto-trading="gotoTradingCenter"
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
import { ref, reactive, computed } from 'vue';
import AssetsOverview from './components/AssetsOverview.vue';
import EquityTab from './components/EquityTab.vue';
import CurrencyTab from './components/CurrencyTab.vue';
import SellEquityPopup from '@/components/equity/SellEquityPopup.vue';

// 获取弹窗组件实例
const sellEquityPopup = ref(null);

// 控制资产显示隐藏
const showAssets = ref(true);

// 当前激活的标签页
const activeTab = ref('equity');

// 资产信息
const assetsInfo = reactive({
  totalAssets: 26850.75,
  currencyAssets: 15850.75,
  equityAssets: 11000.00
});

// 股权信息
const equityInfo = reactive({
  holdAmount: 1000,
  price: 11.00,
  registerReward: 50,
  inviteReward: 100,
  isRegisterRewardReceived: true,
  inviteProgress: 3,
  inviteTarget: 5
});

// 货币列表
const currencyList = reactive([
  {
    id: 1,
    name: '黄金',
    symbol: 'GOLD',
    price: 380.25,
    holdAmount: 35.00,
    bgColor: 'rgba(243, 156, 18, 0.2)'
  },
  {
    id: 2,
    name: '白银',
    symbol: 'SILVER',
    price: 42.50,
    holdAmount: 78.50,
    bgColor: 'rgba(189, 195, 199, 0.2)'
  },
  {
    id: 3,
    name: '铂金',
    symbol: 'PLATINUM',
    price: 420.30,
    holdAmount: 5.25,
    bgColor: 'rgba(52, 152, 219, 0.2)'
  }
]);

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
  return amount.toFixed(2);
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
    
    // 这里替换为实际的API调用
    // const res = await api.sellEquity({ amount: sellQuantity });
    
    // 模拟出售处理
    setTimeout(() => {
      uni.hideLoading();
      
      // 更新股权持有量和总资产（实际应该由后端返回）
      const saleAmount = sellQuantity * equityInfo.price;
      equityInfo.holdAmount -= sellQuantity;
      assetsInfo.equityAssets -= saleAmount;
      assetsInfo.totalAssets -= saleAmount;
      
      // 出售成功提示
      uni.showToast({
        title: '出售成功',
        icon: 'success'
      });
    }, 1500);
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
  // 判断奖励类型和条件
  if (type === 'register' && equityInfo.isRegisterRewardReceived) {
    uni.showToast({
      title: '您已领取过该奖励',
      icon: 'none'
    });
    return;
  }
  
  if (type === 'invite' && equityInfo.inviteProgress < equityInfo.inviteTarget) {
    uni.showToast({
      title: `邀请进度未达标(${equityInfo.inviteProgress}/${equityInfo.inviteTarget})`,
      icon: 'none'
    });
    return;
  }
  
  try {
    // 显示加载状态
    uni.showLoading({
      title: '领取中...'
    });
    
    // 这里替换为实际的API调用
    // const res = await api.claimReward({ type });
    
    // 模拟领取处理
    setTimeout(() => {
      uni.hideLoading();
      
      if (type === 'register') {
        // 更新注册奖励状态和股权数量
        equityInfo.isRegisterRewardReceived = true;
        equityInfo.holdAmount += equityInfo.registerReward;
        assetsInfo.equityAssets += equityInfo.registerReward * equityInfo.price;
        assetsInfo.totalAssets += equityInfo.registerReward * equityInfo.price;
      } else if (type === 'invite') {
        // 更新邀请奖励和股权数量
        equityInfo.inviteProgress = 0; // 重置进度
        equityInfo.holdAmount += equityInfo.inviteReward;
        assetsInfo.equityAssets += equityInfo.inviteReward * equityInfo.price;
        assetsInfo.totalAssets += equityInfo.inviteReward * equityInfo.price;
      }
      
      // 领取成功提示
      uni.showToast({
        title: '领取成功',
        icon: 'success'
      });
    }, 1500);
  } catch (error) {
    uni.hideLoading();
    uni.showToast({
      title: '领取失败，请重试',
      icon: 'none'
    });
  }
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