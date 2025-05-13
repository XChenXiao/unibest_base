<route lang="json5">
{
  style: {
    navigationBarTitleText: '转账',
  },
}
</route>

<template>
  <view class="container">
    <!-- 顶部蓝色背景和标题 -->
    <view class="header">
      <text class="header-title">转账 安全免费·到账快</text>
    </view>
    
    <!-- 主要转账选项 -->
    <view class="main-options-card">
      <view class="main-options">
        <view class="option-item" @click="navigateTo('/pages/transfer/bank')">
          <view class="option-icon">
            <image class="icon-image" src="@/static/images/tran1-1.png" mode="aspectFit"></image>
          </view>
          <text class="option-text">转到银行账户</text>
        </view>
        
        <view class="option-item" @click="showComingSoon">
          <view class="option-icon">
            <image class="icon-image" src="@/static/images/tran1-2.png" mode="aspectFit"></image>
          </view>
          <text class="option-text">转到支付宝</text>
        </view>

        <view class="option-item" @click="showComingSoon">
          <view class="option-icon">
            <image class="icon-image" src="@/static/images/tran1-3.png" mode="aspectFit"></image>
          </view>
          <text class="option-text">转到微信</text>
        </view>
      </view>
    </view>
    
    <!-- 底部其他选项 -->
    <view class="bottom-card">
      <view class="bottom-options">
        <view class="option-small" @click="showComingSoon">
          <view class="option-small-icon">
            <image class="small-icon-image" src="@/static/images/tran2-1.png" mode="aspectFit"></image>
          </view>
          <text class="option-small-text">还信用卡</text>
        </view>
        
        <view class="option-small" @click="handleRecharge">
          <view class="option-small-icon">
            <image class="small-icon-image" src="@/static/images/tran2-2.png" mode="aspectFit"></image>
          </view>
          <text class="option-small-text">转入资金</text>
        </view>
        
        <view class="option-small" @click="showComingSoon">
          <view class="option-small-icon">
            <image class="small-icon-image" src="@/static/images/tran2-3.png" mode="aspectFit"></image>
          </view>
          <text class="option-small-text">手机号收款</text>
        </view>
      </view>
    </view>
    
    <!-- 充值弹窗 -->
    <wd-popup v-model="showRechargePopup" round position="center">
      <view class="popup-content">
        <view class="popup-header">
          <text class="popup-title">转入预存金</text>
          <text class="popup-close" @click="closeRechargePopup">×</text>
        </view>
        <view class="popup-body">
          <view class="amount-input-container">
            <text class="amount-label">预存金额</text>
            <view class="amount-input-wrapper">
              <text class="amount-prefix">¥</text>
              <input 
                class="amount-input" 
                type="digit" 
                v-model="rechargeAmount" 
                placeholder="请输入预存金额"
              />
            </view>
          </view>
          
          <!-- 银行卡开户预存金提示 -->
          <view class="open-fee-tip">
            <text class="tip-title">温馨提示</text>
            <text class="tip-content">激活银行卡需要缴纳 {{ appStore.bankCardOpenFee }} 人民币作为预存金</text>
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
          <button class="confirm-recharge-btn" @click="confirmRecharge">确认转入</button>
        </view>
      </view>
    </wd-popup>
  </view>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { useUserStore } from '@/store/user';
import { useAppStore } from '@/store/app';
import { checkBankCardStatusAPI } from '@/service/index/bankcard';

const userStore = useUserStore();
const appStore = useAppStore();

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 充值相关
const rechargeAmount = ref('');
const showRechargePopup = ref(false);
const quickAmounts = ['100', '500', '1000', '5000', '10000', '20000'];

// 处理充值/转入
const handleRecharge = () => {
  rechargeAmount.value = '';
  showRechargePopup.value = true;
  
  // 如果用户没有开通银行卡且没有获取预存金金额，则获取预存金金额
  if (!userStore.userInfo.has_bank_card && !appStore.hasFetchedBankCardOpenFee) {
    appStore.fetchBankCardOpenFee();
  }
};

// 关闭充值弹窗
const closeRechargePopup = () => {
  showRechargePopup.value = false;
};

// 选择快捷金额
const selectAmount = (amount: string) => {
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

// 页面跳转
const navigateTo = async (url: string) => {
  // 特殊处理转到银行账户功能
  if (url === '/pages/transfer/bank') {
    // 显示加载状态
    uni.showLoading({
      title: '正在检查...'
    });
    
    try {
      // 从API获取最新的银行卡状态
      const res = await checkBankCardStatusAPI();
      uni.hideLoading();
      
      // 如果成功获取到银行卡状态
      if (res.status === 'success' && res.data) {
        // 使用类型断言处理响应数据
        const statusData = res.data as any;
        // 更新用户的银行卡状态
        const hasBankCard = statusData.has_bank_card;
        
        // 更新本地存储的用户银行卡状态
        userStore.setUserInfo({
          ...userStore.userInfo,
          has_bank_card: hasBankCard
        });
        
        // 如果用户没有开通银行卡，则提示用户先开通
        if (!hasBankCard) {
          // 显示提示对话框
          uni.showModal({
            title: '提示',
            content: '转到银行账户需要先开通银行卡，是否立即前往开通？',
            confirmText: '去开通',
            success: (res) => {
              if (res.confirm) {
                // 跳转到银行卡管理页面
                uni.navigateTo({
                  url: '/pages/my/bank-cards'
                });
              }
            }
          });
          return;
        }
      } else {
        // 如果获取失败，降级到使用本地存储的状态
        if (!userStore.userInfo.has_bank_card) {
          uni.showModal({
            title: '提示',
            content: '转到银行账户需要先开通银行卡，是否立即前往开通？',
            confirmText: '去开通',
            success: (res) => {
              if (res.confirm) {
                // 跳转到银行卡管理页面
                uni.navigateTo({
                  url: '/pages/my/bank-cards'
                });
              }
            }
          });
          return;
        }
      }
    } catch (error) {
      uni.hideLoading();
      console.error('获取银行卡状态失败:', error);
      
      // 发生错误时也降级使用本地状态
      if (!userStore.userInfo.has_bank_card) {
        uni.showModal({
          title: '提示',
          content: '转到银行账户需要先开通银行卡，是否立即前往开通？',
          confirmText: '去开通',
          success: (res) => {
            if (res.confirm) {
              // 跳转到银行卡管理页面
              uni.navigateTo({
                url: '/pages/my/bank-cards'
              });
            }
          }
        });
        return;
      }
    }
  }
  
  // 其他页面正常跳转或银行卡已开通的情况
  uni.navigateTo({ url });
};

// 显示"敬请期待"提示
const showComingSoon = () => {
  uni.showToast({
    title: '敬请期待',
    icon: 'none',
    duration: 2000
  });
};

// 页面加载
onMounted(() => {
  console.log('转账页面已加载');
});
</script>

<style lang="scss">
page {
  background-color: #f5f5f5;
  min-height: 100%;
  width: 100%;
  overflow-x: hidden;
}

.container {
  min-height: 100vh;
  background: linear-gradient(to bottom, #1296db 0%, #1296db 50%, #ffffff 100%);
  padding: 40rpx;
  box-sizing: border-box;
  width: 100%;
}

.header {
  padding: 60rpx 0 40rpx;
}

.header-title {
  font-size: 42rpx;
  color: #ffffff;
  font-weight: bold;
}

.main-options-card {
  background-color: #ffffff;
  border-radius: 16rpx;
  width: 100%;
  padding: 20rpx;
  margin-bottom: 40rpx;
  box-sizing: border-box;
}

.main-options {
  display: flex;
  justify-content: space-around;
  width: 100%;
}

.option-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  padding: 20rpx 0;
  width: 45%;
}

.option-icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 30rpx;
  background-color: #ffffff;
  overflow: hidden;
}

.icon-image {
  width: 100%;
  height: 100%;
}

.option-text {
  font-size: 32rpx;
  color: #333333;
  font-weight: bold;
}

.bottom-card {
  width: 100%;
  background: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx 20rpx;
  box-sizing: border-box;
}

.bottom-options {
  display: flex;
  justify-content: space-around;
  width: 100%;
}

.option-small {
  width: 30%;
  display: flex;
  flex-direction: column;
  align-items: center;
}

.option-small-icon {
  width: 80rpx;
  height: 80rpx;
  border-radius: 10rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-bottom: 20rpx;
  background-color: #ffffff;
  overflow: hidden;
}

.small-icon-image {
  width: 100%;
  height: 100%;
}

.option-small-text {
  font-size: 28rpx;
  color: #333333;
}

/* 充值弹窗样式 */
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

/* 金额输入 */
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

/* 快捷金额选择 */
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
  background-color: rgba(18, 150, 219, 0.2);
  color: #1296db;
  font-weight: 500;
}

/* 开户预存金提示 */
.open-fee-tip {
  background-color: rgba(18, 150, 219, 0.1);
  border-radius: 8rpx;
  padding: 20rpx;
  margin-bottom: 30rpx;
}

.tip-title {
  font-size: 28rpx;
  font-weight: 500;
  color: #1296db;
  margin-bottom: 10rpx;
  display: block;
}

.tip-content {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
}

/* 确认按钮 */
.confirm-recharge-btn {
  width: 100%;
  height: 90rpx;
  border: none;
  border-radius: 45rpx;
  background: linear-gradient(to right, #1296db, #0e85c3);
  color: white;
  font-size: 32rpx;
  font-weight: 500;
}
</style> 