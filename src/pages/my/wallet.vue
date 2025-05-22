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
      <text class="uni-icons uniui-back"></text>
    </view>

    <!-- 页面标题 -->
    <!-- <view class="page-title">
      <text class="title-text">我的钱包</text>
    </view> -->

    <!-- 余额卡片 -->
    <balance-card
      :balance="walletInfo.balance"
      @navigateToBankCard="handleNavToBankCard"
      style="margin-top: 60rpx"
    />

    <!-- 交易记录 -->
    <transaction-list
      ref="transactionListRef"
      :use-local-data="false"
      @viewAll="viewAllTransactions"
    />

    <!-- 底部版权信息 -->
    <view class="wallet-footer">
      <text></text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onUnmounted, computed } from 'vue'
import BalanceCard from '@/components/wallet/BalanceCard.vue'
import TransactionList from '@/components/wallet/TransactionList.vue'
import { getBalanceTransactions } from '@/service/app/wallet'
import { getBankCardsAPI } from '@/service/index/bankcard'
import { usePlatformStore } from '@/store/platform'
import { useUserStore } from '@/store/user'

// 交易记录组件引用
const transactionListRef = ref(null)

// 获取用户状态
const userStore = useUserStore()

// 钱包信息，从store中获取
const walletInfo = reactive({
  balance: computed(() => userStore.userInfo.balance || 0),
})

// 获取平台设置状态
const platformStore = usePlatformStore()

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 查看所有交易记录
const viewAllTransactions = () => {
  uni.navigateTo({
    url: '/pages/my/transactions?type=balance',
  })
}

// 处理前往银行卡相关页面的逻辑，添加功能开关检查
const handleNavToBankCard = () => {
  // 检查银行卡功能是否开放
  if (!platformStore.enableBankAccount) {
    uni.showToast({
      title: '银行卡功能暂未开放',
      icon: 'none',
    })
    return
  }

  // 功能已开放，跳转到银行卡管理页面
  uni.navigateTo({
    url: '/pages/my/bank-cards',
  })
}

// 页面加载时
onMounted(() => {
  // 不再主动请求用户信息，仅依赖store中已有的数据
  console.log('钱包页面加载，当前store中的余额:', userStore.userInfo.balance)

  // 监听余额更新事件
  uni.$on('user_balance_updated', (data) => {
    console.log('钱包页面收到余额更新:', data)
    if (data && data.balance !== undefined) {
      userStore.updateUserBalance(data.balance)
    }
  })
})

// 在页面卸载时移除事件监听
onUnmounted(() => {
  uni.$off('user_balance_updated')
})
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
