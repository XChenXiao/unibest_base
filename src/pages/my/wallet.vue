<!-- 理财应用钱包页面 -->
<template>
  <view class="wallet-container">
    <!-- 顶部波浪装饰 -->
    <view class="wave-decoration"></view>
    
    <!-- 返回按钮 -->
    <view class="back-button" @click="goBack">
      <text class="uni-icons uniui-arrow-left"></text>
    </view>
    
    <!-- 页面标题 -->
    <view class="page-title">
      <text class="title-text">我的钱包</text>
    </view>
    
    <!-- 余额卡片组件 -->
    <balance-card 
      :balance="walletInfo.balance"
      @withdraw="handleWithdraw"
      @recharge="handleRecharge"
    />
    
    <!-- 交易记录组件 -->
    <transaction-list 
      :transactions="transactions"
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
import { ref, reactive } from 'vue';
import BalanceCard from '@/components/wallet/BalanceCard.vue';
import TransactionList from '@/components/wallet/TransactionList.vue';
import WithdrawPopup from '@/components/wallet/WithdrawPopup.vue';
import RechargePopup from '@/components/wallet/RechargePopup.vue';

// 提现和充值弹窗引用
const withdrawPopupRef = ref(null);
const rechargePopupRef = ref(null);

// 钱包信息
const walletInfo = reactive({
  balance: 5280.75,
  bankName: '中国建设银行',
  bankNumber: '6217002940106887766'
});

// 交易记录数据
const transactions = [
  {
    id: 1,
    title: '购买黄金',
    type: 'expense',
    isIncome: false,
    amount: '1000.00',
    time: '2025-04-28 15:30'
  },
  {
    id: 2,
    title: '卖出股权',
    type: 'income',
    isIncome: true,
    amount: '2580.75',
    time: '2025-04-26 10:15'
  },
  {
    id: 3,
    title: '账户充值',
    type: 'income',
    isIncome: true,
    amount: '5000.00',
    time: '2025-04-25 09:45'
  },
  {
    id: 4,
    title: '提现',
    type: 'withdraw',
    isIncome: false,
    amount: '3000.00',
    time: '2025-04-20 14:20'
  },
  {
    id: 5,
    title: '签到奖励',
    type: 'income',
    isIncome: true,
    amount: '10.00',
    time: '2025-04-19 08:30'
  }
];

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 查看全部交易记录
const viewAllTransactions = () => {
  uni.navigateTo({
    url: '/pages/my/transactions'
  });
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
      withdrawPopupRef.value.handleClose();
      
      // 提现申请提交成功
      uni.showModal({
        title: '提现申请已提交',
        content: `您的提现申请已成功提交，金额: ¥${amount.toFixed(2)}，将在1-3个工作日内到账。`,
        showCancel: false
      });
      
      // 更新余额（实际应该由后端返回）
      walletInfo.balance -= amount;
      
      // 添加新的提现记录（实际应该由后端返回）
      transactions.unshift({
        id: transactions.length + 1,
        title: '提现',
        type: 'withdraw',
        isIncome: false,
        amount: amount.toFixed(2),
        time: new Date().toLocaleString('zh-CN', {
          year: 'numeric',
          month: '2-digit',
          day: '2-digit',
          hour: '2-digit',
          minute: '2-digit'
        }).replace(/\//g, '-')
      });
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
      rechargePopupRef.value.handleClose();
      
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