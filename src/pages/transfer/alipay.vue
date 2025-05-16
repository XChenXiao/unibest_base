<route lang="json5">
{
  style: {
    navigationBarTitleText: '支付宝提现',
  },
}
</route>

<template>
  <view class="alipay-transfer-container">
    
    <!-- 转账表单 -->
    <view class="form-card">
      <view class="form-item">
        <view class="form-label">选择支付宝账户</view>
        <view class="account-selector" @click="showAccountList">
          <view class="selected-account" v-if="selectedAccount">
            <view class="account-name">{{ selectedAccount.realName }}</view>
            <view class="account-number">{{ selectedAccount.account }}</view>
          </view>
          <view class="no-account" v-else>
            <text>请选择支付宝账户</text>
          </view>
          <wd-icon name="arrow-right" size="36rpx" color="#999" />
        </view>
      </view>
      
      <view class="form-item">
        <view class="form-label">提现金额</view>
        <view class="amount-input-container">
          <text class="amount-prefix">¥</text>
          <input
            class="amount-input"
            type="digit"
            v-model="transferAmount"
            placeholder="请输入提现金额"
          />
        </view>
        <view class="amount-info">
          <text>可用余额: ¥{{ formatBalance(accountBalance) }}</text>
          <text class="amount-all" @click="setMaxAmount">全部提现</text>
        </view>
      </view>
      
      <!-- 添加提现密码输入框 -->
      <view class="form-item">
        <view class="form-label">提现密码</view>
        <view class="amount-input-container">
          <input
            class="form-input"
            type="text"
            :password="true"
            v-model="withdrawPassword"
            placeholder="请输入提现密码"
          />
        </view>
      </view>
      
      <!-- 提交按钮 -->
      <button class="submit-button" :disabled="!isFormValid || isSubmitting" @click="handleSubmit">
        {{ isSubmitting ? '提交中...' : '确认提现' }}
      </button>
      
      <!-- 转账说明 -->
      <!-- <view class="transfer-notes">
        <view class="note-item">
          <text class="note-dot">•</text>
          <text class="note-text">1. 提现金额最低100元，每日限额50000元</text>
        </view>
        <view class="note-item">
          <text class="note-dot">•</text>
          <text class="note-text">2. 提现到账时间为1-2个工作日</text>
        </view>
        <view class="note-item">
          <text class="note-dot">•</text>
          <text class="note-text">3. 提现手续费为提现金额的0.5%</text>
        </view>
      </view> -->
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '@/store/user';
import { withdraw } from '@/service/app';
import { IWithdrawParams } from '@/service/index/withdraw';
import { http } from '@/utils/http';

// 用户store
const userStore = useUserStore();

// 账户余额
const accountBalance = ref(userStore.userInfo.balance || 0);

// 提现金额
const transferAmount = ref('');

// 选中的支付宝账户
const selectedAccount = ref(null);

// 提现密码
const withdrawPassword = ref('');

// 是否正在提交
const isSubmitting = ref(false);

// 判断表单是否有效
const isFormValid = computed(() => {
  const amount = Number(transferAmount.value);
  return (
    selectedAccount.value &&
    amount <= accountBalance.value &&
    withdrawPassword.value.length > 0
  );
});

// 格式化金额显示
const formatBalance = (balance: number | string) => {
  if (!balance) return '0.00';
  const num = typeof balance === 'string' ? parseFloat(balance) : balance;
  return num.toFixed(2);
};

// 设置最大金额
const setMaxAmount = () => {
  transferAmount.value = formatBalance(accountBalance.value);
};

// 获取支付宝账户列表
const getAlipayAccounts = async () => {
  try {
    const res = await http.get('/api/alipay-accounts');
    if (res.status === 'success' && res.data && Array.isArray(res.data) && res.data.length > 0) {
      // 获取默认账户或第一个账户
      const defaultAccount = res.data.find((account) => account.is_default) || res.data[0];
      selectedAccount.value = {
        id: defaultAccount.id,
        account: defaultAccount.account,
        realName: defaultAccount.real_name
      };
    } else {
      selectedAccount.value = null;
    }
  } catch (error) {
    console.error('获取支付宝账户列表失败:', error);
    selectedAccount.value = null;
  }
};

// 显示支付宝账户列表
const showAccountList = async () => {
  try {
    // 跳转到支付宝账户管理页面
    uni.navigateTo({
      url: '/pages/my/alipay-accounts'
    });
  } catch (error) {
    console.error('跳转支付宝账户管理页面失败:', error);
    uni.showToast({
      title: '操作失败，请重试',
      icon: 'none'
    });
  }
};

// 处理提交
const handleSubmit = () => {
  if (!isFormValid.value) {
    let message = '';

    if (!selectedAccount.value) {
      message = '请选择支付宝账户';
    } else if (Number(transferAmount.value) < 100) {
      message = '提现金额不能低于100元';
    } else if (Number(transferAmount.value) > 50000) {
      message = '单笔提现不能超过50000元';
    } else if (Number(transferAmount.value) > accountBalance.value) {
      message = '余额不足';
    } else if (!withdrawPassword.value) {
      message = '请输入提现密码';
    }

    uni.showToast({
      title: message || '表单信息有误',
      icon: 'none'
    });
    return;
  }

  // 设置提交状态
  isSubmitting.value = true;

  // 使用普通函数包装异步操作
  const processWithdraw = async () => {
    try {
      uni.showLoading({
        title: '处理中...'
      });

      // 构建提现参数
      const params: IWithdrawParams = {
        amount: Number(transferAmount.value),
        withdraw_type: 'alipay',
        alipay_account_id: selectedAccount.value.id,
        withdraw_password: withdrawPassword.value
      };

      // 调用提现API
      const response = await withdraw(params);

      uni.hideLoading();

      if (response.status === 'success') {
        uni.showToast({
          title: '提现申请已提交',
          icon: 'success'
        });

        // 刷新用户信息（余额）
        await userStore.fetchUserInfo();

        // 返回上一页
        setTimeout(() => {
          goBack();
        }, 1500);
      } else {
        uni.showToast({
          title: response.message || '提现失败',
          icon: 'none'
        });
      }
    } catch (error) {
      uni.hideLoading();
      console.error('提现请求失败:', error);
      uni.showToast({
        title: '提现失败，请重试',
        icon: 'none'
      });
    } finally {
      isSubmitting.value = false;
    }
  };

  // 调用异步函数
  processWithdraw();
};

// 页面加载时获取支付宝账户
onMounted(async () => {
  await getAlipayAccounts();
  
  // 添加页面显示事件监听
  uni.$on('refresh-alipay-accounts', getAlipayAccounts);
  
  // 添加选择账户事件监听
  uni.$on('select-alipay-account', (account) => {
    selectedAccount.value = account;
  });
});

// 在组件卸载时清理
onUnmounted(() => {
  // 移除事件监听
  uni.$off('refresh-alipay-accounts', getAlipayAccounts);
  uni.$off('select-alipay-account');
});

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};
</script>

<style lang="scss">
page {
  background-color: #f5f5f5;
  min-height: 100%;
}

.alipay-transfer-container {
  padding: 30rpx;
}

/* 表单卡片 */
.form-card {
  background-color: #ffffff;
  border-radius: 16rpx;
  padding: 30rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.form-item {
  margin-bottom: 40rpx;
}

.form-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 20rpx;
}

/* 支付宝账户选择器 */
.account-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1px solid #e0e0e0;
}

.selected-account {
  flex: 1;
}

.account-name {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.account-number {
  font-size: 26rpx;
  color: #999;
}

.no-account {
  color: #999;
  font-size: 28rpx;
}

/* 金额输入 */
.amount-input-container {
  display: flex;
  align-items: center;
  border-bottom: 1px solid #e0e0e0;
  padding-bottom: 15rpx;
  margin-bottom: 10rpx;
}

.amount-prefix {
  font-size: 40rpx;
  color: #333;
  margin-right: 10rpx;
}

.amount-input, .form-input {
  flex: 1;
  height: 80rpx;
  font-size: 34rpx;
}

.amount-info {
  display: flex;
  justify-content: space-between;
  font-size: 24rpx;
  color: #999;
}

.amount-all {
  color: #2196f3;
}

/* 提交按钮 */
.submit-button {
  width: 100%;
  height: 90rpx;
  border-radius: 45rpx;
  color: #ffffff;
  font-size: 32rpx;
  font-weight: 500;
  background: linear-gradient(to right, #1BAEAE, #00b3f4);
  margin: 40rpx 0;
}

.submit-button[disabled] {
  background: #cccccc;
  color: #ffffff;
}

/* 转账说明 */
.transfer-notes {
  margin-top: 20rpx;
}

.note-item {
  display: flex;
  margin-bottom: 10rpx;
}

.note-dot {
  margin-right: 10rpx;
  color: #999;
}

.note-text {
  font-size: 24rpx;
  color: #999;
  flex: 1;
}
</style> 