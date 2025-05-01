<route lang="json5">
  {
    style: {
      navigationBarTitleText: '我的钱包',
    },
  }
</route>
<!-- 理财应用钱包页面 -->
<template>
  <view class="wallet-container">
    <!-- 顶部波浪装饰 -->
    <view class="wave-decoration"></view>
    
    <!-- 返回按钮 -->
    <view class="back-button" @click="goBack">
      <text class="uni-icons uniui-arrow-left"></text>
    </view>
    
    
    <!-- 余额卡片组件 -->
    <balance-card 
      :balance="walletInfo.balance"
      @withdraw="handleWithdraw"
      @recharge="handleRecharge"
      style="margin-top: 50rpx;"
    />
    
    <!-- 交易记录组件 -->
    <transaction-list 
      ref="transactionListRef"
      :use-local-data="false"
      @viewAll="viewAllTransactions"
    />
    
    <!-- 提现弹窗组件 -->
    <withdraw-popup
      ref="withdrawPopupRef"
      :balance="walletInfo.balance"
      :bank-name="walletInfo.bankName"
      :bank-number="walletInfo.bankNumber"
      @close="handleWithdrawClose"
      @confirm="confirmWithdraw"
    />
    
    <!-- 充值弹窗组件 -->
    <recharge-popup
      ref="rechargePopupRef"
      @close="handleRechargeClose"
      @confirm="confirmRecharge"
    />
    
    <!-- 底部版权信息 -->
    <view class="wallet-footer">
      <text>© 2025 理财管理平台 版权所有</text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import BalanceCard from '@/components/wallet/BalanceCard.vue';
import TransactionList from '@/components/wallet/TransactionList.vue';
import WithdrawPopup from '@/components/wallet/WithdrawPopup.vue';
import RechargePopup from '@/components/wallet/RechargePopup.vue';
import { getBalanceTransactions } from '@/service/app/wallet';
import { getUserInfo } from '@/service/app/user';

// 提现和充值弹窗引用
const withdrawPopupRef = ref(null);
const rechargePopupRef = ref(null);
const transactionListRef = ref(null);

// 钱包信息
const walletInfo = reactive({
  balance: 0, // 初始化为0，将从API获取
  bankName: '中国建设银行',
  bankNumber: '6217002940106887766'
});

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 处理提现
const handleWithdraw = () => {
  withdrawPopupRef.value.open();
};

// 关闭提现弹窗
const handleWithdrawClose = () => {
  // 不需要额外处理，组件内部已关闭弹窗
};

// 确认提现
const confirmWithdraw = async (amount: number, password: string) => {
  // 验证提现金额
  if (!amount || amount <= 0) {
    uni.showToast({
      title: '请输入有效的提现金额',
      icon: 'none'
    });
    return;
  }
  
  // 验证余额是否充足
  if (amount > walletInfo.balance) {
    uni.showToast({
      title: '余额不足',
      icon: 'none'
    });
    return;
  }
  
  // 验证提现密码
  if (!password || password.length !== 6) {
    uni.showToast({
      title: '请输入6位提现密码',
      icon: 'none'
    });
    return;
  }
  
  try {
    // 显示加载状态
    uni.showLoading({
      title: '处理中...'
    });
    
    // 这里替换为实际的提现API调用
    // const res = await api.withdraw({
    //   amount: amount,
    //   password: password
    // });
    
    // 模拟提现处理
    setTimeout(() => {
      uni.hideLoading();
      
      // 提现申请提交成功
      uni.showModal({
        title: '提现申请已提交',
        content: `您的提现申请已成功提交，金额: ¥${amount.toFixed(2)}，将在1-3个工作日内到账。`,
        showCancel: false
      });
      
      // 更新余额（实际应该由后端返回）
      walletInfo.balance -= amount;
      
      // 刷新交易记录
      refreshTransactions();
      
    }, 1500);
  } catch (error) {
    uni.hideLoading();
    uni.showToast({
      title: '提现申请失败，请重试',
      icon: 'none'
    });
  }
};

// 处理充值
const handleRecharge = () => {
  rechargePopupRef.value.open();
};

// 关闭充值弹窗
const handleRechargeClose = () => {
  // 不需要额外处理，组件内部已关闭弹窗
};

// 确认充值
const confirmRecharge = async (amount: number) => {
  if (!amount || amount <= 0) {
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
    // const res = await api.recharge({ amount: amount });
    
    // 模拟第三方支付跳转
    setTimeout(() => {
      uni.hideLoading();
      
      // 模拟跳转到第三方支付
      uni.navigateTo({
        url: `/pages/payment/third-party?amount=${amount.toFixed(2)}`
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

// 查看所有交易记录
const viewAllTransactions = () => {
  uni.navigateTo({
    url: '/pages/my/transactions?type=balance'
  });
};

// 刷新交易记录
const refreshTransactions = () => {
  if (transactionListRef.value) {
    transactionListRef.value.refreshTransactions();
  }
};

// 获取钱包信息
const fetchWalletInfo = async () => {
  try {
    // 调用获取用户信息API
    const response = await getUserInfo();
    
    if (response && response.data) {
      // 使用类型断言确保类型安全
      const responseData = response.data as any;
      
      // 根据网络请求结果结构，获取用户信息
      if (responseData.user && responseData.user.balance !== undefined) {
        // 用户信息在user对象中
        walletInfo.balance = parseFloat(responseData.user.balance);
        
        // 如果有银行卡信息，也可以更新
        if (responseData.user.bank_card) {
          walletInfo.bankName = responseData.user.bank_card.bank_name || walletInfo.bankName;
          walletInfo.bankNumber = responseData.user.bank_card.card_number || walletInfo.bankNumber;
        }
      } else if (responseData.balance !== undefined) {
        // 余额直接在数据对象中
        walletInfo.balance = parseFloat(responseData.balance);
      }
      
      console.log('获取到用户余额:', walletInfo.balance);
    } else {
      console.error('获取用户信息失败或返回数据格式不正确');
    }
  } catch (error) {
    console.error('获取用户信息失败:', error);
    uni.showToast({
      title: '获取用户信息失败',
      icon: 'none'
    });
  }
};

onMounted(() => {
  fetchWalletInfo();
});
</script>

<style lang="scss">
/* 全局重置 */
page {
  background-color: #f5f5f5;
  height: 100%;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

/* 容器样式 */
.wallet-container {
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
}

/* 返回按钮 */
.back-button {
  position: absolute;
  top: 60rpx;
  left: 20rpx;
  width: 80rpx;
  height: 80rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 40rpx;
  color: #333;
  z-index: 10;
}

/* 页面标题 */
.page-title {
  text-align: center;
  margin-top: 130rpx;
  margin-bottom: 40rpx;
}

.title-text {
  font-size: 40rpx;
  font-weight: 600;
  color: #333;
}

/* 底部版权信息 */
.wallet-footer {
  text-align: center;
  padding: 30rpx 0;
  color: #999;
  font-size: 24rpx;
  margin-top: auto;
}
</style> 