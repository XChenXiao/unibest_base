<route lang="json5">
{
  style: {
    navigationBarTitleText: '银行卡提现',
  },
}
</route>

<template>
  <view class="bank-transfer-container">
    
    <!-- 提现表单 -->
    <view class="form-card">
      <view class="form-item">
        <view class="form-label">选择银行卡</view>
        <view class="bank-card-selector" @click="showBankCardList">
          <view class="selected-card" v-if="selectedCard">
            <view class="bank-name">{{ selectedCard.bankName }}</view>
            <view class="card-number">{{ maskCardNumber(selectedCard.cardNumber) }}</view>
          </view>
          <view class="no-card" v-else>
            <text>请选择收款银行卡</text>
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
        <!-- <view class="forgot-password" @click="navigateToResetPassword">忘记密码?</view> -->
      </view>
      
      <!-- 提交按钮 -->
      <button class="submit-button" :disabled="!isFormValid || isSubmitting" @click="handleSubmit">
        {{ isSubmitting ? '提交中...' : '确认提现' }}
      </button>
      
      <!-- 提现说明 -->
      <view class="transfer-notes">
        <!-- <view class="note-item">
          <text class="note-dot">•</text>
          <text class="note-text">1. 提现金额最低100元，每日限额50000元</text>
        </view> -->
        <!-- <view class="note-item">
          <text class="note-dot">•</text>
          <text class="note-text">2. 提现到账时间为1-2个工作日</text>
        </view> -->
        <!-- <view class="note-item">
          <text class="note-dot">•</text>
          <text class="note-text">3. 提现手续费为提现金额的0.5%</text>
        </view> -->
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { useUserStore } from '@/store/user';
import { getUserBankCards, withdraw } from '@/service/app';
import { checkBankCardStatusAPI } from '@/service/index/bankcard';
import { IWithdrawParams } from '@/service/index/withdraw';
import { http } from '@/utils/http';

// 用户store
const userStore = useUserStore();

// 账户余额
const accountBalance = ref(userStore.userInfo.balance || 0);

// 提现金额
const transferAmount = ref('');

// 选中的银行卡
const selectedCard = ref(null);

// 提现密码
const withdrawPassword = ref('');

// 银行卡列表是否显示
const bankCardListVisible = ref(false);

// 是否正在提交
const isSubmitting = ref(false);

// 判断表单是否有效
const isFormValid = computed(() => {
  const amount = Number(transferAmount.value);
  return (
    selectedCard.value &&
    // amount >= 100 &&
    // amount <= 50000 &&
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

// 遮蔽银行卡号
const maskCardNumber = (cardNumber: string) => {
  if (!cardNumber) return '';
  return `**** **** **** ${cardNumber.slice(-4)}`;
};

// 设置最大金额
const setMaxAmount = () => {
  transferAmount.value = formatBalance(accountBalance.value);
};

// 显示银行卡列表
const showBankCardList = async () => {
  console.log('准备获取银行卡列表');
  
  // 检查用户是否已开通银行卡
  if (!userStore.userInfo.has_bank_card) {
    // 用户未开通银行卡，提示用户去开户
    uni.showModal({
      title: '提示',
      content: '您还未开通银行卡，请先前往开通',
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

  uni.showLoading({
    title: '加载银行卡...'
  });

  try {
    console.log('开始获取银行卡列表');
    // 获取用户银行卡列表
    const res = await getUserBankCards();
    console.log('获取银行卡列表响应:', res);
    
    if (res.status === 'success' && res.data && Array.isArray(res.data) && res.data.length > 0) {
      console.log('获取到银行卡列表:', res.data);
      
      // 如果只有一张卡，直接选中
      if (res.data.length === 1) {
        const card = res.data[0];
        selectedCard.value = {
          id: card.id,
          bankName: card.bank_name,
          cardNumber: card.card_number
        };
        console.log('自动选中唯一的银行卡:', selectedCard.value);
        uni.hideLoading();
        return;
      }
      
      // 如果有多张卡，弹出选择界面
      const cardList = res.data.map(card => ({
        id: card.id,
        bankName: card.bank_name,
        cardNumber: card.card_number,
        isDefault: card.is_default
      }));
      
      // 获取默认的银行卡或第一张卡
      const defaultCard = cardList.find(card => card.isDefault) || cardList[0];
      selectedCard.value = {
        id: defaultCard.id,
        bankName: defaultCard.bankName,
        cardNumber: defaultCard.cardNumber
      };
      
      console.log('选中默认银行卡:', selectedCard.value);
      
      // 如果有多张卡，显示选择器
      if (cardList.length > 1) {
        uni.hideLoading();
        // 构建卡片选择项
        const cardItems = cardList.map(card => `${card.bankName} (${maskCardNumber(card.cardNumber)})`);
        
        uni.showActionSheet({
          itemList: cardItems,
          success: (res) => {
            const selectedIndex = res.tapIndex;
            selectedCard.value = {
              id: cardList[selectedIndex].id,
              bankName: cardList[selectedIndex].bankName,
              cardNumber: cardList[selectedIndex].cardNumber
            };
            console.log('用户选择了银行卡:', selectedCard.value);
          }
        });
      } else {
        uni.hideLoading();
      }
    } else {
      uni.hideLoading();
      console.error('银行卡列表为空或格式错误:', res);
      // 没有银行卡，提示用户添加银行卡
      uni.showModal({
        title: '提示',
        content: '您还未添加银行卡，请先添加',
        confirmText: '去添加',
        success: (res) => {
          if (res.confirm) {
            uni.navigateTo({
              url: '/pages/my/bank-cards'
            });
          }
        }
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error('获取银行卡列表失败:', error);
    uni.showToast({
      title: '获取银行卡失败',
      icon: 'none'
    });
  }
};

// 处理提交
const handleSubmit = () => {
  console.log('点击提交按钮，表单有效性:', isFormValid.value);
  
  if (!isFormValid.value) {
    let message = '';
    
    if (!selectedCard.value) {
      message = '请选择银行卡';
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
        bank_card_id: selectedCard.value.id,
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

// 提交提现申请不再需要这么复杂的实现，简化它
const submitWithdraw = async () => {
  // 这个方法不再需要，处理逻辑已移至handleSubmit
};

// 刷新用户银行卡状态
const refreshUserBankCardStatus = async () => {
  try {
    // 从API获取最新的银行卡状态
    const res = await checkBankCardStatusAPI();
    if (res.status === 'success' && res.data) {
      // 更新用户的银行卡状态 - 需要类型转换，因为接口定义的类型与实际返回的结构不同
      const statusData = res.data as any;
      const hasBankCard = statusData.has_bank_card;
      
      // 更新本地存储的用户银行卡状态
      userStore.setUserInfo({
        ...userStore.userInfo,
        has_bank_card: hasBankCard
      });
      
      // 如果已有银行卡，获取银行卡列表
      if (hasBankCard && !selectedCard.value) {
        showBankCardList();
      }
    }
  } catch (error) {
    console.error('刷新银行卡状态失败:', error);
  }
};

// 检查用户银行卡状态
onMounted(() => {
  // 刷新用户银行卡状态
  refreshUserBankCardStatus();
  
  // 添加页面显示事件监听
  uni.$on('refresh-bank-status', refreshUserBankCardStatus);
});

// 在组件卸载时清理
onUnmounted(() => {
  // 移除事件监听
  uni.$off('refresh-bank-status', refreshUserBankCardStatus);
});

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 页面相关方法
const navigateToResetPassword = () => {
  uni.navigateTo({ url: '/pages/my/reset-withdraw-password' });
};
</script>

<style lang="scss">
page {
  background-color: #f5f5f5;
  min-height: 100%;
}

.bank-transfer-container {
  padding: 30rpx;
}

/* 返回按钮 */
.back-button {
  margin-bottom: 30rpx;
  width: 60rpx;
  height: 60rpx;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 页面标题 */
.page-title {
  margin-bottom: 40rpx;
}

.title-text {
  font-size: 40rpx;
  font-weight: bold;
  color: #333;
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

/* 银行卡选择器 */
.bank-card-selector {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1px solid #e0e0e0;
}

.selected-card {
  flex: 1;
}

.bank-name {
  font-size: 30rpx;
  color: #333;
  margin-bottom: 8rpx;
}

.card-number {
  font-size: 26rpx;
  color: #999;
}

.no-card {
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

.amount-input {
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
  background: linear-gradient(to right, #2196f3, #03a9f4);
  margin: 40rpx 0;
}

.submit-button[disabled] {
  background: #cccccc;
  color: #ffffff;
}

/* 提现说明 */
.transfer-notes {
  margin-top: 20rpx;
}

/* 忘记密码 */
.forgot-password {
  position: absolute;
  right: 0;
  font-size: 26rpx;
  color: #2196f3;
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