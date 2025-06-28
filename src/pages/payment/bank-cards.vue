<template>
  <view class="bank-cards-container">
    <!-- 顶部导航栏 -->
    <view class="header">
      <view class="back-icon" @click="goBack">
        <text class="iconfont icon-left"></text>
      </view>
      <view class="title">中国银行</view>
    </view>
    
    <!-- 银行卡展示区域 -->
    <view class="card-container">
      <!-- 银行卡余额显示 -->
      <view class="bank-card">
        <view class="bank-logo">
          <text class="iconfont icon-bank"></text>
          <text>中国银行</text>
        </view>
        <view class="balance-info">
          <view class="balance-label">可用余额(元)</view>
          <view class="balance-amount">{{ bankCardStore.balance }}</view>
        </view>
        <view class="card-actions">
          <view class="action-btn" @click="handleTransferIn">转入</view>
          <view class="action-btn" @click="handleTransferOut">转出</view>
        </view>
      </view>
      
      <!-- 已添加的银行卡列表 -->
      <view class="card-list">
        <view v-if="bankCardStore.bankCards.length === 0" class="empty-tip">
          <text>暂无银行卡，请添加</text>
        </view>
        <view class="card-item" v-for="card in bankCardStore.bankCards" :key="card.id">
          <view class="card-logo">
            <image :src="card.logo || '/static/images/bank-default.png'" class="bank-logo-img" mode="aspectFit"></image>
          </view>
          <view class="card-info">
            <view class="card-name">{{ card.bankName }}</view>
            <view class="card-number">**** **** **** {{ card.cardNumber.slice(-4) }}</view>
          </view>
        </view>
        
        <!-- 添加银行卡按钮 -->
        <view class="add-card" @click="goToAddCard">
          <view class="add-icon">+</view>
          <view class="add-text">添加银行卡</view>
          <view class="promotion-text">绑新卡送立减金</view>
        </view>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { onMounted } from 'vue'
import { useBankCardStore } from '@/stores/bankCard'

// 获取银行卡store
const bankCardStore = useBankCardStore()

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 跳转到添加银行卡页面
const goToAddCard = () => {
  uni.navigateTo({
    url: '/pages/payment/add-bank-card'
  })
}

// 处理转入
const handleTransferIn = () => {
  uni.showToast({
    title: '转入功能开发中',
    icon: 'none'
  })
}

// 处理转出
const handleTransferOut = () => {
  uni.showToast({
    title: '转出功能开发中',
    icon: 'none'
  })
}

onMounted(() => {
  // 从本地存储加载银行卡数据
  bankCardStore.loadBankCardsFromStorage()
})
</script>

<style lang="scss" scoped>
.bank-cards-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.header {
  display: flex;
  align-items: center;
  height: 44px;
  background: linear-gradient(90deg, #ff9500, #ff5e3a);
  color: #fff;
  padding: 0 15px;
  position: relative;
}

.back-icon {
  position: absolute;
  left: 15px;
}

.title {
  flex: 1;
  text-align: center;
  font-size: 18px;
  font-weight: 500;
}

.card-container {
  padding: 15px;
}

.bank-card {
  background: linear-gradient(135deg, #36d1dc, #5b86e5);
  border-radius: 12px;
  padding: 20px;
  color: #fff;
  margin-bottom: 20px;
}

.bank-logo {
  display: flex;
  align-items: center;
  margin-bottom: 15px;
  
  .iconfont {
    margin-right: 8px;
    font-size: 24px;
  }
}

.balance-info {
  margin-bottom: 20px;
}

.balance-label {
  font-size: 14px;
  opacity: 0.8;
}

.balance-amount {
  font-size: 32px;
  font-weight: bold;
  margin-top: 5px;
}

.card-actions {
  display: flex;
  justify-content: space-between;
  
  .action-btn {
    background-color: rgba(255, 255, 255, 0.2);
    padding: 8px 0;
    border-radius: 20px;
    text-align: center;
    width: 45%;
    font-size: 16px;
  }
}

.card-list {
  background-color: #fff;
  border-radius: 12px;
  padding: 10px 0;
}

.empty-tip {
  padding: 30px 0;
  text-align: center;
  color: #999;
  font-size: 14px;
}

.card-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
}

.card-logo {
  width: 40px;
  height: 40px;
  margin-right: 15px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.bank-logo-img {
  width: 40px;
  height: 40px;
}

.card-info {
  flex: 1;
}

.card-name {
  font-size: 16px;
  font-weight: 500;
  margin-bottom: 5px;
}

.card-number {
  font-size: 14px;
  color: #666;
}

.add-card {
  display: flex;
  align-items: center;
  padding: 15px;
  position: relative;
}

.add-icon {
  width: 40px;
  height: 40px;
  background-color: #f0f0f0;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24px;
  margin-right: 15px;
  color: #666;
}

.add-text {
  font-size: 16px;
  font-weight: 500;
}

.promotion-text {
  position: absolute;
  right: 15px;
  color: #ff6b00;
  font-size: 14px;
}
</style>

<route-block>
{
  "path": "/payment/bank-cards",
  "style": {
    "navigationStyle": "custom"
  }
}
</route-block> 