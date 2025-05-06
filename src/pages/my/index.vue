<route lang="json5" type="page">
{
  layout: 'tabbar',
  style: {
    navigationBarTitleText: '我的',
    navigationStyle: 'custom',
  },
}
</route>

<template>
  <view class="my-container">
    <!-- 顶部波浪装饰 -->
    <view class="wave-decoration"></view>
    
    <!-- 顶部背景渐变 -->
    <view class="bg-gradient"></view>
    
    <!-- 个人信息卡片 -->
    <view class="user-card">
      <view class="avatar-container">
        <view class="avatar">
          <text class="avatar-text">{{ getUserInitial() }}</text>
        </view>
      </view>
      <view class="user-info">
        <text class="user-name">{{ getUserDisplayName() }}</text>
        <view class="user-detail">
          <text class="user-id">ID: {{ userStore.userInfo.id || '-' }}</text>
          <text class="divider">|</text>
          <text class="invite-code">邀请码: {{ userStore.userInfo.invite_code || '-' }}</text>
        </view>
      </view>
    </view>
    
    <!-- 余额展示 -->
    <view class="balance-card">
      <view class="balance-header">
        <text class="balance-title">我的余额</text>
        <view class="recharge-btn" @click="handleRecharge">
          <wd-icon name="recharge" size="28rpx" style="margin-right: 6rpx;"/>
          充值
        </view>
      </view>
      <view class="balance-amount">
        <text class="amount-symbol">¥</text>
        <text class="amount-value">{{ formatBalance(userStore.userInfo.balance) }}</text>
      </view>
    </view>
    
    <!-- 功能菜单 -->
    <view class="menu-list">
      <!-- 银行卡管理 -->
      <view class="menu-item" @click="navigateTo('/pages/my/bank-cards')">
        <view class="menu-icon bank-icon">
          <wd-icon name="creditcard" size="40rpx" />
        </view>
        <view class="menu-content">
          <text class="menu-title">银行卡管理</text>
          <text class="menu-desc">{{ userStore.userInfo.has_bank_card ? '已开通' : '未开通' }}</text>
        </view>
        <wd-icon name="arrow-right" class="menu-arrow" />
      </view>
      
      <!-- 平台公告 -->
      <view class="menu-item" @click="navigateTo('/pages/my/announcements')">
        <view class="menu-icon announcement-icon">
          <wd-icon name="notification-filled" size="40rpx" />
        </view>
        <view class="menu-content">
          <text class="menu-title">平台公告</text>
          <text class="menu-desc">{{ hasNewAnnouncement ? '有新公告' : '无新公告' }}</text>
        </view>
        <wd-icon name="arrow-right" class="menu-arrow" />
      </view>
      
      <!-- 个人信息 -->
      <view class="menu-item" @click="handleProfileClick">
        <view class="menu-icon profile-icon">
          <wd-icon name="user" size="40rpx" />
        </view>
        <view class="menu-content">
          <text class="menu-title">个人信息</text>
          <text class="menu-desc">{{ userStore.isVerified ? '已实名' : userStore.isPendingVerification ? '审核中' : userStore.isRejectedVerification ? '已拒绝' : '未实名' }}</text>
        </view>
        <wd-icon name="arrow-right" class="menu-arrow" />
      </view>
      
      <!-- 我的钱包 -->
      <view class="menu-item" @click="navigateTo('/pages/my/wallet')">
        <view class="menu-icon wallet-icon">
          <wd-icon name="wallet" size="40rpx" />
        </view>
        <view class="menu-content">
          <text class="menu-title">我的钱包</text>
          <text class="menu-desc">查看收支记录</text>
        </view>
        <wd-icon name="arrow-right" class="menu-arrow" />
      </view>
      
      <!-- 交易记录 -->
      <view class="menu-item" @click="navigateTo('/pages/my/transactions')">
        <view class="menu-icon transaction-icon">
          <wd-icon name="list" size="40rpx" />
        </view>
        <view class="menu-content">
          <text class="menu-title">交易记录</text>
          <text class="menu-desc">查看所有交易</text>
        </view>
        <wd-icon name="arrow-right" class="menu-arrow" />
      </view>
      
      <!-- 设置 -->
      <view class="menu-item" @click="navigateTo('/pages/my/settings')">
        <view class="menu-icon settings-icon">
          <wd-icon name="setting" size="40rpx" />
        </view>
        <view class="menu-content">
          <text class="menu-title">设置</text>
          <text class="menu-desc">修改密码等</text>
        </view>
        <wd-icon name="arrow-right" class="menu-arrow" />
      </view>
      
      <!-- 客服中心 -->
      <view class="menu-item" @click="navigateTo('/pages/my/customer-service')">
        <view class="menu-icon service-icon">
          <wd-icon name="service" size="40rpx" />
        </view>
        <view class="menu-content">
          <text class="menu-title">客服中心</text>
          <text class="menu-desc">联系客服</text>
        </view>
        <wd-icon name="arrow-right" class="menu-arrow" />
      </view>
    </view>
    
    <!-- 退出登录按钮 -->
    <button class="logout-btn" @click="handleLogout">
      <wd-icon name="power-off" size="32rpx" style="margin-right: 8rpx;"/>
      退出登录
    </button>
    
    <!-- 充值弹窗 -->
    <wd-popup v-model="showRechargePopup" round position="center">
      <view class="popup-content">
        <view class="popup-header">
          <text class="popup-title">账户充值</text>
          <text class="popup-close" @click="closeRechargePopup">×</text>
        </view>
        <view class="popup-body">
          <view class="amount-input-container">
            <text class="amount-label">充值金额</text>
            <view class="amount-input-wrapper">
              <text class="amount-prefix">¥</text>
              <input 
                class="amount-input" 
                type="digit" 
                v-model="rechargeAmount" 
                placeholder="请输入充值金额"
              />
            </view>
          </view>
          <view class="amount-buttons">
            <view 
              v-for="(amount, index) in quickAmounts" 
              :key="index" 
              class="amount-btn" 
              :class="{ 'amount-btn-active': rechargeAmount === amount }"
              @click="selectAmount(amount)"
            >
              <text>¥{{ amount }}</text>
            </view>
          </view>
          <button class="confirm-recharge-btn" @click="confirmRecharge">确认充值</button>
        </view>
      </view>
    </wd-popup>
    
    <!-- 版权信息 -->
    <view class="my-footer">
      <text>© 2025 理财管理平台 版权所有</text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '@/store/user';
import { useTabItemTap } from '@/hooks/useTabItemTap';
import { API_URL } from '@/config/api';

// 获取用户数据存储
const userStore = useUserStore();

// 是否有新公告
const hasNewAnnouncement = ref(false);

// 检查是否有未读公告
const checkAnnouncementStatus = async () => {
  try {
    // 使用Promise方式处理请求，避免使用解构赋值导致的问题
    const response = await new Promise((resolve, reject) => {
      uni.request({
        url: `${API_URL}/api/messages/unread-count`,
        method: 'GET',
        success: (res) => {
          resolve(res);
        },
        fail: (err) => {
          reject(err);
        }
      });
    });
    
    // 直接使用response的data属性
    const res = response as any;
    
    if (res?.data?.status === 'success') {
      hasNewAnnouncement.value = res.data.data.unread_count > 0;
    }
  } catch (error) {
    console.error('检查公告状态失败:', error);
  }
};

// 充值金额
const rechargeAmount = ref('');
// 是否显示充值弹窗
const showRechargePopup = ref(false);

// 快捷金额选项
const quickAmounts = ['100', '500', '1000', '5000', '10000', '20000'];

// 使用TabBar切换钩子，自动处理用户数据刷新
useTabItemTap({
  refreshUserInfo: true,
  pageName: '我的页面',
  onTabTap: () => {
    console.log('我的页面Tab被点击，可以在这里执行额外的业务逻辑');
  }
});

// 页面挂载时添加事件监听
onMounted(() => {
  // 监听余额更新事件
  uni.$on('user_balance_updated', handleBalanceUpdated);
  
  // 监听未读公告状态更新事件
  uni.$on('refresh_unread_announcements', checkAnnouncementStatus);
  
  // 初始检查用户数据和余额
  checkUserInfo();
  
  // 检查是否有未读公告
  checkAnnouncementStatus();
});

// 页面卸载时移除事件监听
onUnmounted(() => {
  // 移除事件监听
  uni.$off('user_balance_updated', handleBalanceUpdated);
  uni.$off('refresh_unread_announcements', checkAnnouncementStatus);
});

// 处理余额更新事件
const handleBalanceUpdated = (data) => {
  console.log('收到余额更新事件:', data);
  // 无需额外操作，因为Pinia中的数据已经更新，这里只记录日志
};

// 检查用户信息，确保数据是最新的
const checkUserInfo = async () => {
  // 如果用户已登录，尝试刷新用户信息
  if (userStore.isLogined) {
    // 获取上次更新时间
    const lastUpdateTime = uni.getStorageSync('userInfoUpdateTime') || 0;
    const currentTime = Date.now();
    const timeElapsed = currentTime - lastUpdateTime;
    
    // 如果距离上次更新超过5分钟，则重新获取用户信息
    if (timeElapsed > 5 * 60 * 1000) {
      console.log('用户数据已过期，重新获取');
      await userStore.fetchUserInfo();
    } else {
      console.log('用户数据在有效期内，无需重新获取');
    }
  }
};

// 获取用户名首字母或默认头像文字
const getUserInitial = () => {
  if (userStore.isVerified && userStore.userInfo.name) {
    return userStore.userInfo.name.charAt(0);
  }
  return '用';
};

// 获取用户显示名称
const getUserDisplayName = () => {
  // 已认证用户优先显示姓名（通过API已处理为实名信息中的真实姓名）
  if (userStore.isVerified && userStore.userInfo.name) {
    return userStore.userInfo.name;
  }
  // 未认证用户或姓名为空时显示手机号
  return userStore.userInfo.phone || '未登录';
};

// 格式化余额显示
const formatBalance = (balance) => {
  // 处理undefined、null或空字符串的情况
  if (balance === undefined || balance === null || balance === '') {
    return '0.00';
  }
  
  // 确保balance是数字类型
  let numBalance = 0;
  try {
    numBalance = typeof balance === 'string' ? parseFloat(balance) : Number(balance);
    // 处理NaN的情况
    if (isNaN(numBalance)) {
      numBalance = 0;
    }
  } catch (error) {
    console.error('余额格式化错误:', error);
    numBalance = 0;
  }
  
  return numBalance.toFixed(2);
};

// 页面导航
const navigateTo = (url) => {
  uni.navigateTo({ url });
};

// 处理个人信息点击
const handleProfileClick = () => {
  // 如果已经实名认证，显示简单提示
  if (userStore.isVerified) {
    uni.showToast({
      title: '您已完成实名认证',
      icon: 'success',
      duration: 1500
    });
    return;
  }
  
  // 如果实名认证审核中，显示提示
  if (userStore.isPendingVerification) {
    uni.showToast({
      title: '您的认证正在审核中',
      icon: 'none',
      duration: 1500
    });
    return;
  }
  
  // 未认证或认证被拒绝，跳转到认证页面
  navigateTo('/pages/my/identity-verify');
};

// 处理充值
const handleRecharge = () => {
  rechargeAmount.value = '';
  showRechargePopup.value = true;
};

// 关闭充值弹窗
const closeRechargePopup = () => {
  showRechargePopup.value = false;
};

// 选择快捷金额
const selectAmount = (amount) => {
  rechargeAmount.value = amount;
};

// 确认充值
const confirmRecharge = async () => {
  if (!rechargeAmount.value || parseFloat(rechargeAmount.value) <= 0) {
    uni.showToast({
      title: '请输入有效的充值金额',
      icon: 'none'
    });
    return;
  }
  
  try {
    // 显示加载状态
    uni.showLoading({
      title: '处理中...'
    });
    
    // 这里替换为实际的充值API调用
    // const res = await api.recharge({ amount: parseFloat(rechargeAmount.value) });
    
    // 模拟第三方支付跳转
    setTimeout(() => {
      uni.hideLoading();
      closeRechargePopup();
      
      // 模拟跳转到第三方支付
      uni.navigateTo({
        url: `/pages/payment/third-party?amount=${rechargeAmount.value}`
      });
    }, 1000);
  } catch (error) {
    uni.hideLoading();
    uni.showToast({
      title: '充值失败，请重试',
      icon: 'none'
    });
  }
};

// 处理退出登录
const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        // 清除登录信息
        userStore.clearUserInfo();
        
        // 返回登录页
        uni.reLaunch({
          url: '/pages/login/index'
        });
      }
    }
  });
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
.my-container {
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
  background: linear-gradient(to right, #ff9c00, #fa2c19);
  z-index: 2;
}

/* 顶部背景渐变 */
.bg-gradient {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 500rpx; /* 增加背景高度 */
  background: linear-gradient(to bottom, #3498db, rgba(250, 44, 25, 0.2), rgba(255, 255, 255, 0));
  z-index: 0;
}

/* 用户卡片 */
.user-card {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  padding: 40rpx 30rpx;
  margin-top: 40rpx;
}

.avatar-container {
  margin-right: 30rpx;
}

.avatar {
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  box-shadow: 0 8rpx 20rpx rgba(243, 156, 18, 0.3);
  border: 4rpx solid #ffffff;
}

.avatar-text {
  color: white;
  font-size: 60rpx;
  font-weight: bold;
}

.user-info {
  flex: 1;
}

.user-name {
  font-size: 40rpx;
  font-weight: 600;
  color: #ffffff;
  margin-bottom: 15rpx;
  display: block;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
}

.user-detail {
  display: flex;
  align-items: center;
}

.user-id, .invite-code {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.15);
}

.divider {
  color: rgba(255, 255, 255, 0.6);
  margin: 0 10rpx;
  font-size: 24rpx;
}

/* 余额卡片 */
.balance-card {
  position: relative;
  z-index: 1;
  background-color: white;
  border-radius: 20rpx;
  margin: 30rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.balance-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20rpx;
}

.balance-title {
  color: #333;
  font-size: 30rpx;
  font-weight: 500;
}

.recharge-btn {
  color: #3498db;
  font-size: 28rpx;
  background-color: rgba(52, 152, 219, 0.1);
  padding: 8rpx 20rpx;
  border-radius: 30rpx;
  display: flex;
  align-items: center;
}

.balance-amount {
  display: flex;
  align-items: baseline;
}

.amount-symbol {
  font-size: 36rpx;
  color: #333;
  margin-right: 8rpx;
}

.amount-value {
  font-size: 60rpx;
  font-weight: 600;
  color: #333;
}

/* 菜单列表 */
.menu-list {
  position: relative;
  z-index: 1;
  background-color: white;
  border-radius: 20rpx;
  margin: 0 30rpx 30rpx;
  padding: 10rpx 0;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.menu-item {
  display: flex;
  align-items: center;
  padding: 30rpx;
  position: relative;
}

.menu-item:not(:last-child)::after {
  content: '';
  position: absolute;
  left: 100rpx;
  right: 0;
  bottom: 0;
  height: 1px;
  background-color: #f0f0f0;
}

.menu-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 20rpx;
}

.bank-icon {
  background-color: rgba(52, 152, 219, 0.15);
}

.announcement-icon {
  background-color: rgba(243, 156, 18, 0.15);
}

.profile-icon {
  background-color: rgba(46, 204, 113, 0.15);
}

.wallet-icon {
  background-color: rgba(155, 89, 182, 0.15);
}

.transaction-icon {
  background-color: rgba(231, 76, 60, 0.15);
}

.settings-icon {
  background-color: rgba(52, 73, 94, 0.15);
}

.service-icon {
  background-color: rgba(26, 188, 156, 0.15);
}

.bank-icon .wd-icon {
  color: #3498db;
  font-size: 36rpx;
}

.announcement-icon .wd-icon {
  color: #f39c12;
  font-size: 36rpx;
}

.profile-icon .wd-icon {
  color: #2ecc71;
  font-size: 36rpx;
}

.wallet-icon .wd-icon {
  color: #9b59b6;
  font-size: 36rpx;
}

.transaction-icon .wd-icon {
  color: #e74c3c;
  font-size: 36rpx;
}

.settings-icon .wd-icon {
  color: #34495e;
  font-size: 36rpx;
}

.service-icon .wd-icon {
  color: #1abc9c;
  font-size: 36rpx;
}

.menu-content {
  flex: 1;
}

.menu-title {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 6rpx;
  display: block;
}

.menu-desc {
  font-size: 24rpx;
  color: #999;
}

.menu-arrow {
  color: #ccc;
  font-size: 28rpx;
}

/* 退出登录按钮 */
.logout-btn {
  width: calc(100% - 60rpx);
  height: 90rpx;
  margin: 0 auto 40rpx;
  border: none;
  border-radius: 45rpx;
  background: #ffffff;
  color: #e74c3c;
  font-size: 32rpx;
  font-weight: 500;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 充值弹窗 */
.popup-content {
  width: 600rpx;
  background-color: #ffffff;
  border-radius: 20rpx;
  overflow: hidden;
}

.popup-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 30rpx;
  border-bottom: 1px solid #f0f0f0;
}

.popup-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
}

.popup-close {
  font-size: 40rpx;
  color: #999;
  line-height: 1;
}

.popup-body {
  padding: 30rpx;
}

.amount-input-container {
  margin-bottom: 30rpx;
}

.amount-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
  display: block;
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 10rpx;
}

.amount-prefix {
  font-size: 40rpx;
  color: #333;
  margin-right: 10rpx;
}

.amount-input {
  flex: 1;
  height: 80rpx;
  font-size: 36rpx;
}

.amount-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 40rpx;
}

.amount-btn {
  width: 170rpx;
  height: 80rpx;
  background-color: #f5f5f5;
  border-radius: 8rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
  font-size: 28rpx;
  color: #666;
}

.amount-btn-active {
  background-color: rgba(243, 156, 18, 0.2);
  color: #f39c12;
  font-weight: 500;
}

.confirm-recharge-btn {
  width: 100%;
  height: 90rpx;
  border: none;
  border-radius: 45rpx;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  color: white;
  font-size: 32rpx;
  font-weight: 500;
}

/* 底部版权信息 */
.my-footer {
  text-align: center;
  padding: 30rpx 0;
  color: #999;
  font-size: 24rpx;
  margin-top: auto;
}
</style>
