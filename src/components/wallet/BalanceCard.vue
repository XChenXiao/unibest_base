<template>
  <!-- 余额卡片 -->
  <view class="balance-card">
    <view class="balance-header">
      <text class="balance-title">账户余额</text>
      <view class="bank-card-link" @click="handleNavToBankCard">
        <text>银行卡</text>
        <text class="arrow-icon">></text>
      </view>
    </view>
    <view class="balance-amount">
      <text class="amount-symbol">¥</text>
      <text class="amount-value">{{ displayBalance }}</text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { computed, onMounted, watch } from 'vue';
import { useUserStore } from '@/store/user';
import { usePlatformStore } from '@/store/platform';

// 使用用户store
const userStore = useUserStore();
// 使用平台设置store
const platformStore = usePlatformStore();

// 定义props
const props = defineProps<{
  balance: number | string
}>();

// 定义事件
const emit = defineEmits(['navigateToBankCard']);

// 处理跳转到银行卡管理页面
const handleNavToBankCard = () => {
  // 检查银行卡功能是否开放
  if (!platformStore.enableBankAccount) {
    uni.showToast({
      title: '银行卡功能暂未开放',
      icon: 'none'
    });
    return;
  }
  
  // 触发事件，由父组件处理跳转逻辑
  emit('navigateToBankCard');
};

// 创建计算属性，结合Pinia的用户余额和传入的余额
const displayBalance = computed(() => {
  // 优先使用传入的balance参数
  if (props.balance !== undefined && props.balance !== null) {
    return formatBalance(props.balance);
  }
  
  // 如果传入的balance无效，尝试使用Pinia中的用户余额
  if (userStore.userInfo && userStore.userInfo.balance !== undefined) {
    return formatBalance(userStore.userInfo.balance);
  }
  
  // 如果都没有，返回零
  return '0.00';
});

// 格式化余额显示
const formatBalance = (balance: number | string) => {
  // 处理undefined、null或空字符串的情况
  if (balance === undefined || balance === null || balance === '') {
    return '0.00';
  }
  
  // 确保余额是数字类型
  let numBalance: number;
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
  
  // 格式化为两位小数
  return numBalance.toFixed(2);
};

// 页面加载时尝试获取余额
onMounted(() => {
  console.log('BalanceCard组件加载, 传入余额:', props.balance, '商店余额:', userStore.userInfo.balance);
});

// 监听余额变化
watch(() => props.balance, (newVal) => {
  console.log('BalanceCard传入余额更新:', newVal);
}, { immediate: true });

// 监听Pinia中用户余额变化
watch(() => userStore.userInfo.balance, (newVal) => {
  console.log('Pinia用户余额更新:', newVal);
}, { immediate: true });
</script>

<style lang="scss" scoped>
/* 余额卡片 */
.balance-card {
  background-color: white;
  border-radius: 20rpx;
  margin: 0 30rpx 30rpx;
  padding: 30rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.balance-header {
  margin-bottom: 20rpx;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.balance-title {
  color: #333;
  font-size: 30rpx;
  font-weight: 500;
  text-align: left;
}

.balance-amount {
  display: flex;
  align-items: baseline;
  justify-content: flex-start;
  padding-left: 20rpx;
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

.bank-card-link {
  color: #666;
  font-size: 26rpx;
  display: flex;
  align-items: center;
  padding: 5rpx 10rpx;
  border-radius: 8rpx;
}

.bank-card-link:active {
  background-color: #f5f5f5;
}

.arrow-icon {
  margin-left: 8rpx;
  font-size: 22rpx;
  color: #999;
}
</style> 