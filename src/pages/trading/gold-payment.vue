<route lang="json5">
{
  style: {
    navigationBarTitleText: '黄金支付',
  },
}
</route>

<template>
  <view class="gold-payment-container">
    <!-- 支付信息卡片 -->
    <view class="payment-card">
      <view class="payment-header">
        <text class="payment-title">黄金购买支付</text>
        <view class="payment-amount">
          <text class="amount-label">支付金额</text>
          <text class="amount-value">¥{{ formatAmount(totalAmount) }}</text>
        </view>
      </view>

      <view class="payment-details">
        <view class="detail-item">
          <text class="detail-label">黄金单价</text>
          <text class="detail-value">¥{{ formatAmount(goldPrice) }}/克</text>
        </view>
        <view class="detail-item">
          <text class="detail-label">购买数量</text>
          <view class="input-container">
            <input
              class="amount-input"
              type="digit"
              v-model="amount"
              placeholder="请输入购买数量"
              @input="calculateTotal"
            />
            <text class="unit">克</text>
          </view>
        </view>
      </view>
    </view>

    <!-- 支付方式选择 -->
    <view class="payment-methods">
      <view class="method-title">选择支付方式</view>
      <view class="method-list">
        <view
          class="method-item"
          :class="{ active: selectedMethod === 'alipay' }"
          @click="selectPaymentMethod('alipay')"
        >
          <view class="method-icon">
            <image
              src="@/static/images/alipay.png"
              class="payment-icon-img"
              mode="aspectFit"
            ></image>
          </view>
          <text class="method-name">支付宝</text>
          <view class="method-radio">
            <view class="radio-dot" v-if="selectedMethod === 'alipay'"></view>
          </view>
        </view>

        <view
          class="method-item"
          :class="{ active: selectedMethod === 'wxpay' }"
          @click="selectPaymentMethod('wxpay')"
        >
          <view class="method-icon" style="width: 62rpx; height: 62rpx">
            <image
              src="@/static/images/wechat-pay.png"
              class="payment-icon-img"
              mode="aspectFit"
            ></image>
          </view>
          <text class="method-name">微信支付</text>
          <view class="method-radio">
            <view class="radio-dot" v-if="selectedMethod === 'wxpay'"></view>
          </view>
        </view>
      </view>
    </view>

    <!-- 支付按钮 -->
    <view class="payment-footer">
      <button class="pay-button" :disabled="!canSubmit || isProcessing" @click="handleSubmit">
        {{ isProcessing ? '处理中...' : `立即支付 ¥${formatAmount(totalAmount)}` }}
      </button>
    </view>

    <!-- 支付结果 -->
    <view class="payment-result" v-if="paymentStatus !== ''">
      <view class="result-icon" :class="paymentStatus === 'success' ? 'success-icon' : 'error-icon'"></view>
      <text class="result-text">{{ paymentStatusText }}</text>
      <view class="result-actions">
        <button class="action-button" @click="goBack">返回</button>
        <button class="action-button primary" @click="goToAssets" v-if="paymentStatus === 'success'">
          查看资产
        </button>
      </view>
    </view>

    <!-- 支付提示 -->
    <view class="payment-notice">
      <view class="notice-title">支付须知</view>
      <view class="notice-item">
        <text class="notice-text">1. 支付成功后，黄金将自动添加到您的账户中。</text>
      </view>
      <view class="notice-item">
        <text class="notice-text">2. 如遇支付问题，请联系客服处理。</text>
      </view>
      <view class="notice-item">
        <text class="notice-text">3. 支付过程中请勿关闭页面，以免影响交易结果。</text>
      </view>
    </view>
  </view>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted } from 'vue';
import { onLoad } from '@dcloudio/uni-app';
import { createGoldPaymentOrder, queryGoldPaymentOrder } from '@/service/app/currency';
import { useCurrencyStore } from '@/store';
import { getCurrencyList } from '@/service/app/currency';

// 引入货币store
const currencyStore = useCurrencyStore();

// 支付相关数据
const goldPrice = ref(0);
const amount = ref('');
const totalAmount = ref(0);
const selectedMethod = ref('alipay');
const paymentStatus = ref('');
const paymentStatusText = ref('');
const outTradeNo = ref('');
const queryTimer = ref<any>(null);
const isProcessing = ref(false);

// 计算属性：是否可以提交
const canSubmit = computed(() => {
  const amountValue = parseFloat(amount.value);
  return amountValue > 0 && selectedMethod.value !== '' && totalAmount.value > 0;
});

// 页面加载
onLoad(async (options) => {
  // 如果有传递的参数，获取黄金价格
  if (options.price) {
    goldPrice.value = parseFloat(options.price);
  } else {
    // 获取黄金价格
    try {
      const response = await getCurrencyList();
      if (response.status === 'success' && Array.isArray(response.data)) {
        const goldCurrency = response.data.find(c => c.symbol === 'GOLD');
        if (goldCurrency) {
          goldPrice.value = parseFloat(String(goldCurrency.price));
        } else {
          // 默认价格
          goldPrice.value = 380;
        }
      }
    } catch (error) {
      console.error('获取黄金价格失败:', error);
      goldPrice.value = 380; // 默认价格
    }
  }
  
  // 如果有传递的数量
  if (options.amount) {
    amount.value = options.amount;
    calculateTotal();
  }
});

// 计算总金额
const calculateTotal = () => {
  if (amount.value && !isNaN(parseFloat(amount.value))) {
    totalAmount.value = parseFloat(amount.value) * goldPrice.value;
  } else {
    totalAmount.value = 0;
  }
};

// 选择支付方式
const selectPaymentMethod = (method: string) => {
  selectedMethod.value = method;
};

// 格式化金额显示
const formatAmount = (value: number) => {
  return value.toFixed(2);
};

// 提交支付
const handleSubmit = async () => {
  if (!canSubmit.value) return;
  
  try {
    isProcessing.value = true;
    uni.showLoading({ title: '创建支付订单...' });
    
    // 调用API创建支付订单
    const amountValue = parseFloat(amount.value);
    const response = await createGoldPaymentOrder(amountValue, selectedMethod.value);
    
    uni.hideLoading();
    
    if (response.status === 'success' && response.data) {
      // 保存订单号，用于后续查询
      let orderNo = '';
      let payUrl = '';
      const responseData = response.data;
      
              // 处理不同结构的响应数据
        if ('data' in responseData && responseData.data) {
          // 嵌套结构 - 优先使用我们的订单号，而不是第三方平台的订单号
          orderNo = (responseData.data as any).out_trade_no || (responseData.data as any).order_no || (responseData.data as any).trade_no || '';
          payUrl = (responseData.data as any).pay_url || '';
        } else {
          // 直接结构 - 优先使用我们的订单号，而不是第三方平台的订单号
          orderNo = (responseData as any).out_trade_no || (responseData as any).order_no || (responseData as any).trade_no || '';
          payUrl = (responseData as any).pay_url || '';
        }
      
      outTradeNo.value = orderNo;
      
      if (payUrl) {
        // 跳转到支付页面
        uni.navigateTo({
          url: `/pages/payment/webview?url=${encodeURIComponent(payUrl)}`
        });
        
        // 开始轮询查询支付状态
        startQueryPaymentStatus();
      } else {
        // 处理其他支付信息
        uni.showModal({
          title: '支付提示',
          content: '请按照提示完成支付',
          showCancel: false,
          success: () => {
            startQueryPaymentStatus();
          }
        });
      }
    } else {
      uni.showToast({
        title: response.message || '创建支付订单失败',
        icon: 'none'
      });
    }
  } catch (error) {
    uni.hideLoading();
    uni.showToast({
      title: '创建支付订单失败，请稍后重试',
      icon: 'none'
    });
    console.error('支付订单创建失败:', error);
  } finally {
    isProcessing.value = false;
  }
};

// 开始查询支付状态
const startQueryPaymentStatus = () => {
  if (!outTradeNo.value) return;
  
  // 清除之前的定时器
  if (queryTimer.value) {
    clearInterval(queryTimer.value);
  }
  
  // 设置定时器，每3秒查询一次支付状态
  queryTimer.value = setInterval(async () => {
    try {
      const result = await queryGoldPaymentOrder(outTradeNo.value);
      
      if (result.status === 'success' && result.data) {
        const orderStatus = (result.data as any).order_status || (result.data as any).status || '';
        if (orderStatus === 'paid') {
          // 支付成功
          clearInterval(queryTimer.value);
          paymentStatus.value = 'success';
          paymentStatusText.value = '支付成功！黄金已添加到您的账户';
          
          // 刷新货币列表
          await currencyStore.forceRefreshUserCurrencies();
          
          uni.showToast({
            title: '支付成功',
            icon: 'success'
          });
        }
      }
    } catch (error) {
      console.error('查询支付状态失败:', error);
    }
  }, 3000);
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 跳转到资产页面
const goToAssets = () => {
  uni.switchTab({
    url: '/pages/assets/index'
  });
};

// 组件卸载时清除定时器
onUnmounted(() => {
  if (queryTimer.value) {
    clearInterval(queryTimer.value);
  }
});
</script>

<style lang="scss">
.gold-payment-container {
  min-height: 100vh;
  padding: 30rpx;
  background-color: #f5f5f5;
}

.payment-card {
  padding: 30rpx;
  margin-bottom: 30rpx;
  background-color: white;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.payment-header {
  padding-bottom: 20rpx;
  margin-bottom: 20rpx;
  border-bottom: 1px solid #f0f0f0;
}

.payment-title {
  display: block;
  margin-bottom: 20rpx;
  font-size: 32rpx;
  font-weight: 600;
  color: #333;
}

.payment-amount {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.amount-label {
  font-size: 28rpx;
  color: #666;
}

.amount-value {
  font-size: 36rpx;
  font-weight: 600;
  color: #ff4d4f;
}

.payment-details {
  .detail-item {
    display: flex;
    justify-content: space-between;
    align-items: center;
    margin-bottom: 15rpx;

    &:last-child {
      margin-bottom: 0;
    }
  }

  .detail-label {
    font-size: 26rpx;
    color: #666;
  }

  .detail-value {
    font-size: 26rpx;
    color: #333;
  }
}

.input-container {
  display: flex;
  align-items: center;
}

.amount-input {
  width: 150rpx;
  text-align: right;
  padding: 10rpx;
  font-size: 26rpx;
}

.unit {
  margin-left: 10rpx;
  color: #666;
  font-size: 26rpx;
}

.payment-methods {
  padding: 30rpx;
  margin-bottom: 30rpx;
  background-color: white;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.method-title {
  margin-bottom: 20rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.method-list {
  .method-item {
    display: flex;
    align-items: center;
    padding: 20rpx 0;
    border-bottom: 1px solid #f0f0f0;

    &:last-child {
      border-bottom: none;
    }

    &.active {
      background-color: #f8f8f8;
    }
  }
}

.method-icon {
  width: 60rpx;
  height: 60rpx;
  margin-right: 20rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  border-radius: 8rpx;
  overflow: hidden;
}

.payment-icon-img {
  width: 100%;
  height: 100%;
}

.method-name {
  flex: 1;
  font-size: 28rpx;
  color: #333;
}

.method-radio {
  width: 36rpx;
  height: 36rpx;
  border-radius: 50%;
  border: 2rpx solid #ddd;
  display: flex;
  align-items: center;
  justify-content: center;
  margin-right: 10rpx;
}

.radio-dot {
  width: 24rpx;
  height: 24rpx;
  border-radius: 50%;
  background-color: #fa2c19;
}

.payment-footer {
  margin: 40rpx 0;
}

.pay-button {
  width: 100%;
  height: 90rpx;
  line-height: 90rpx;
  text-align: center;
  background: linear-gradient(90deg, #ff9500, #ff5e3a);
  color: #fff;
  font-size: 32rpx;
  border-radius: 45rpx;
  font-weight: 500;
  
  &[disabled] {
    background: #cccccc;
    color: #ffffff;
  }
}

.payment-result {
  background-color: #fff;
  border-radius: 12rpx;
  padding: 40rpx;
  margin: 30rpx 0;
  display: flex;
  flex-direction: column;
  align-items: center;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.result-icon {
  width: 120rpx;
  height: 120rpx;
  border-radius: 60rpx;
  margin-bottom: 30rpx;
}

.success-icon {
  background-color: #52c41a;
}

.error-icon {
  background-color: #ff4d4f;
}

.result-text {
  font-size: 32rpx;
  color: #333;
  margin-bottom: 30rpx;
}

.result-actions {
  display: flex;
  justify-content: center;
  width: 100%;
}

.action-button {
  width: 240rpx;
  height: 80rpx;
  line-height: 80rpx;
  text-align: center;
  border: 1px solid #ddd;
  border-radius: 40rpx;
  font-size: 28rpx;
  margin: 0 15rpx;
}

.action-button.primary {
  background-color: #fa2c19;
  color: #fff;
  border: none;
}

.payment-notice {
  padding: 30rpx;
  background-color: white;
  border-radius: 20rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.notice-title {
  margin-bottom: 20rpx;
  font-size: 30rpx;
  font-weight: 600;
  color: #333;
}

.notice-item {
  padding: 10rpx 0;
}

.notice-text {
  font-size: 26rpx;
  color: #666;
  line-height: 1.5;
}
</style> 