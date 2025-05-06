<route lang="json5" type="page">
{
  style: {
    navigationBarTitleText: '银行卡开户申请',
    navigationBarBackgroundColor: '#f5f5f5',
    navigationBarTextStyle: 'black',
    'app-plus': {
      titleNView: {
        titleSize: '16px',
        titleWeight: 'bold',
        titleAlign: 'center'
      }
    }
  },
}
</route>

<template>
  <view class="container">
    <!-- 申请表单 -->
    <view class="form-container" v-if="currentStep === 'form'">
      <view class="form-header">
        <view class="form-title">开户申请</view>
        <view class="form-subtitle">请填写以下信息完成开户申请</view>
      </view>
      
      <view class="fee-info">
        <view class="fee-label">开户手续费</view>
        <view class="fee-amount">{{ openFee }} USDT</view>
        <view class="fee-message">{{ openFeeMessage }}</view>
        <view class="balance-info" :class="{ 'insufficient': !canApply }">
          当前余额: {{ userStore.userInfo.balance || 0 }} USDT
          <text v-if="!canApply" class="balance-warning">余额不足，请先充值</text>
        </view>
      </view>
      
      <view class="form-group">
        <text class="form-label">真实姓名</text>
        <input 
          type="text" 
          class="form-input" 
          v-model="formData.name" 
          placeholder="请输入真实姓名" 
          placeholder-class="input-placeholder" 
        />
      </view>
      
      <view class="form-group">
        <text class="form-label">身份证号码</text>
        <input 
          type="idcard" 
          class="form-input" 
          v-model="formData.id_card" 
          placeholder="请输入身份证号码" 
          placeholder-class="input-placeholder" 
        />
      </view>
      
      <view class="form-group">
        <text class="form-label">联系地址</text>
        <input 
          type="text" 
          class="form-input" 
          v-model="formData.address" 
          placeholder="请输入详细联系地址" 
          placeholder-class="input-placeholder" 
        />
      </view>
      
      <view class="form-group">
        <text class="form-label">手机号码</text>
        <input 
          type="number" 
          class="form-input" 
          v-model="formData.phone" 
          placeholder="请输入手机号码" 
          placeholder-class="input-placeholder" 
        />
      </view>
      
      <button class="btn-submit" @click="processSubmit" :disabled="!canApply || loading">{{ loading ? '提交中...' : '提交申请' }}</button>
      <view class="submit-hint">提交申请将直接从您的余额中扣除 {{ openFee.toFixed(2) }} USDT 手续费</view>
    </view>
    
    <!-- 审核中状态 -->
    <view class="review-container" v-if="currentStep === 'review'">
      <view class="review-icon">
        <text class="iconfont icon-time"></text>
      </view>
      <view class="review-title">申请审核中</view>
      <view class="review-desc">
        您的银行卡开户申请已提交，正在审核中。
        <text class="review-time">预计审核时间：1-3个工作日</text>
      </view>
      <view class="review-tips">
        <view class="tip-item">
          <text class="tip-dot"></text>
          <text class="tip-text">审核通过后，您将收到短信通知</text>
        </view>
        <view class="tip-item">
          <text class="tip-dot"></text>
          <text class="tip-text">审核通过后，您可以进行银行卡充值和提现</text>
        </view>
      </view>
      <button class="btn-back" @click="backToCards">返回银行卡管理</button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue';
import { 
  getBankCardOpenFeeAPI, 
  openBankCardAPI, 
  getBankCardOpenRecordsAPI,
  IBankCardOpenRecord 
} from '@/service/index/bankcard';
import { useUserStore } from '@/store/user';

// 用户数据
const userStore = useUserStore();

// 申请步骤：form-表单填写，review-审核中
const currentStep = ref('form');

// 加载状态
const loading = ref(false);

// 开户费用
const openFee = ref(0);

// 开户说明信息
const openFeeMessage = ref('开通银行卡需要支付手续费，将从您的账户余额中扣除');

// 是否有足够余额支付开户费用
const canApply = ref(false);

// 表单数据
const formData = reactive({
  name: '',
  id_card: '',
  address: '',
  phone: ''
});

// 在页面加载时获取开户费用和检查是否有申请记录
onMounted(async () => {
  // 从页面参数获取开户费用
  const params = (uni as any).getLaunchOptionsSync().query;
  if (params && params.fee) {
    openFee.value = Number(params.fee);
  } else {
    // 如果没有传递费用参数，则从API获取
    await fetchOpenFee();
  }
  
  // 检查用户是否有足够的余额
  updateCanApply();
  
  // 获取用户的开户申请记录
  await checkApplicationStatus();
});

// 更新是否可申请状态
const updateCanApply = () => {
  canApply.value = userStore.userInfo.balance >= openFee.value;
};

// 获取开户费用
const fetchOpenFee = async () => {
  loading.value = true;
  try {
    const res = await getBankCardOpenFeeAPI();
    console.log('获取开户费用响应:', res);
    
    // 通过安全的方式访问返回数据
    const data = res as any;
    
    if (data && data.open_fee) {
      // 正确获取开户费用，注意返回的是字符串，需要转换为数字
      openFee.value = parseFloat(data.open_fee) || 0;
      console.log('获取开户费用成功:', openFee.value, data);
      
      // 获取开户说明信息
      if (data.message) {
        openFeeMessage.value = data.message;
      }
      
      // 如果后端有返回额外的表单字段要求，可以在这里处理
      if (data.required_fields) {
        console.log('后端要求的字段:', data.required_fields);
      }
      
      updateCanApply();
    } else if (data && data.message && data.message.includes('暂未开放')) {
      // 银行卡开通功能暂未开放
      uni.showModal({
        title: '提示',
        content: '银行卡开通功能暂未开放',
        showCancel: false,
        success: () => {
          uni.navigateBack();
        }
      });
    } else if (data && data.status === 'success' && data.data) {
      // 旧格式响应处理（带有status和data的嵌套结构）
      const responseData = data.data;
      if (responseData.open_fee) {
        openFee.value = parseFloat(responseData.open_fee) || 0;
        console.log('获取开户费用成功(嵌套格式):', openFee.value, responseData);
        
        if (responseData.message) {
          openFeeMessage.value = responseData.message;
        }
        
        updateCanApply();
      }
    } else {
      throw new Error('获取开户费用失败');
    }
  } catch (error) {
    console.error('获取开户费用失败:', error);
    uni.showToast({
      title: '获取开户费用失败，请稍后再试',
      icon: 'none'
    });
  } finally {
    loading.value = false;
  }
};

// 检查用户是否有正在处理的申请
const checkApplicationStatus = async () => {
  loading.value = true;
  try {
    const res = await getBankCardOpenRecordsAPI();
    if (res.status === 'success' && res.data) {
      const openRecords = res.data.open_records as IBankCardOpenRecord[];
      
      // 检查是否有正在审核中的申请
      const pendingRecord = openRecords.find(record => record.status === 'pending');
      if (pendingRecord) {
        // 如果有正在审核的申请，直接跳到审核中状态
        currentStep.value = 'review';
      }
    }
  } catch (error) {
    console.error('获取开户记录失败:', error);
  } finally {
    loading.value = false;
  }
};

// 直接提交申请并扣款
const processSubmit = async () => {
  // 表单验证
  if (!formData.name) {
    uni.showToast({ title: '请输入真实姓名', icon: 'none' });
    return;
  }
  if (!formData.id_card) {
    uni.showToast({ title: '请输入身份证号码', icon: 'none' });
    return;
  }
  if (!formData.address) {
    uni.showToast({ title: '请输入联系地址', icon: 'none' });
    return;
  }
  if (!formData.phone) {
    uni.showToast({ title: '请输入手机号码', icon: 'none' });
    return;
  }
  
  // 验证身份证号码格式
  const idCardReg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/;
  if (!idCardReg.test(formData.id_card)) {
    uni.showToast({ title: '身份证号码格式不正确', icon: 'none' });
    return;
  }
  
  // 验证手机号码格式
  const phoneReg = /^1\d{10}$/;
  if (!phoneReg.test(formData.phone)) {
    uni.showToast({ title: '手机号码格式不正确', icon: 'none' });
    return;
  }
  
  // 检查余额是否足够
  if (userStore.userInfo.balance < openFee.value) {
    uni.showToast({ 
      title: '余额不足，请先充值', 
      icon: 'none' 
    });
    return;
  }
  
  // 二次确认
  uni.showModal({
    title: '确认提交申请',
    content: `提交申请将从您的余额中扣除 ${openFee.value.toFixed(2)} USDT 手续费，是否继续？`,
    success: async (res) => {
      if (res.confirm) {
        await submitBankCardOpen();
      }
    }
  });
};

// 处理提交
const submitBankCardOpen = async () => {
  loading.value = true;
  try {
    // 准备提交数据
    const submitData = {
      name: formData.name,
      phone: formData.phone,
      id_card: formData.id_card,
      address: formData.address
    };
    
    console.log('准备提交开户申请数据:', submitData);
    
    // 提交开户申请
    const res = await openBankCardAPI(submitData);
    
    console.log('开户申请响应:', res);
    
    if (res && res.status === 'success') {
      // 更新用户余额
      const newBalance = userStore.userInfo.balance - openFee.value;
      userStore.updateUserBalance(newBalance);
      
      uni.showToast({ 
        title: res.message || '申请提交成功', 
        icon: 'success' 
      });
      
      // 进入审核中步骤
      currentStep.value = 'review';
      
      // 再次检查申请状态，确保状态更新
      await checkApplicationStatus();
    } else {
      // 提取错误信息
      let errorMsg = '申请提交失败';
      if (res && res.message) {
        errorMsg = res.message;
      }
      
      uni.showToast({ 
        title: errorMsg, 
        icon: 'none' 
      });
    }
  } catch (error: any) {
    console.error('提交开户申请失败:', error);
    
    // 显示更详细的错误信息
    let errorMsg = '申请提交失败';
    
    if (error.response) {
      console.error('错误响应:', error.response);
      if (error.response.data && error.response.data.message) {
        errorMsg = error.response.data.message;
      } else if (error.response.status) {
        errorMsg = `请求失败 (${error.response.status})`;
      }
    } else if (error.message) {
      errorMsg = error.message;
    }
    
    // 尝试从网络错误中提取更多信息
    if (error.errMsg) {
      console.error('错误信息:', error.errMsg);
      errorMsg = error.errMsg;
    }
    
    uni.showToast({ 
      title: errorMsg, 
      icon: 'none' 
    });
  } finally {
    loading.value = false;
  }
};

// 返回银行卡管理页面
const backToCards = () => {
  // 返回上一页并刷新
  uni.navigateBack({
    delta: 1,
    success: () => {
      // 发送事件通知银行卡管理页面刷新状态
      uni.$emit('refresh-bank-cards');
    }
  });
};
</script>

<style lang="scss" scoped>
.container {
  width: 100%;
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 30rpx;
  box-sizing: border-box;
}

.form-container {
  width: 100%;
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 30rpx;
  box-sizing: border-box;
}

.form-header {
  margin-bottom: 30rpx;
}

.form-title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 10rpx;
}

.form-subtitle {
  font-size: 26rpx;
  color: #6b7280;
}

.fee-info {
  margin-bottom: 30rpx;
  padding: 20rpx;
  background-color: #f9fafb;
  border-radius: 12rpx;
}

.fee-label {
  font-size: 26rpx;
  color: #6b7280;
}

.fee-amount {
  font-size: 40rpx;
  font-weight: bold;
  color: #3b82f6;
  margin: 10rpx 0;
}

.fee-message {
  font-size: 24rpx;
  color: #6b7280;
  margin: 10rpx 0;
  line-height: 1.5;
}

.balance-info {
  font-size: 26rpx;
  color: #6b7280;
  margin-top: 10rpx;
}

.balance-warning {
  color: #f59e0b;
  display: block;
  margin-top: 10rpx;
  font-weight: bold;
}

.insufficient {
  color: #ef4444;
}

.form-group {
  margin-bottom: 25rpx;
}

.form-label {
  display: block;
  color: #374151;
  margin-bottom: 10rpx;
  font-size: 26rpx;
}

.form-input {
  width: 100%;
  border: 1rpx solid #e5e7eb;
  border-radius: 8rpx;
  padding: 20rpx 16rpx;
  background-color: #ffffff;
  font-size: 28rpx;
  box-sizing: border-box;
  height: 90rpx;
  color: #333333;
}

.input-placeholder {
  color: #9ca3af;
  font-size: 28rpx;
}

.btn-submit {
  width: 100%;
  background-color: #3b82f6;
  color: white;
  padding: 24rpx 0;
  border: none;
  border-radius: 12rpx;
  font-size: 30rpx;
  margin-top: 30rpx;
  box-shadow: 0 4rpx 6rpx rgba(59, 130, 246, 0.3);
}

.btn-submit:disabled {
  background-color: #d1d5db;
  color: #9ca3af;
  box-shadow: none;
}

.submit-hint {
  font-size: 24rpx;
  color: #6b7280;
  margin-top: 15rpx;
  text-align: center;
}

/* 审核中状态样式 */
.review-container {
  width: 100%;
  background-color: #ffffff;
  border-radius: 20rpx;
  padding: 40rpx 30rpx;
  box-sizing: border-box;
  text-align: center;
}

.review-icon {
  font-size: 80rpx;
  color: #f59e0b;
  margin-bottom: 20rpx;
}

.review-title {
  font-size: 36rpx;
  font-weight: bold;
  margin-bottom: 20rpx;
  color: #111827;
}

.review-desc {
  font-size: 28rpx;
  color: #4b5563;
  margin-bottom: 30rpx;
  line-height: 1.6;
}

.review-time {
  display: block;
  color: #f59e0b;
  margin-top: 10rpx;
}

.review-tips {
  margin-bottom: 40rpx;
  background-color: #f9fafb;
  padding: 20rpx;
  border-radius: 12rpx;
  text-align: left;
}

.tip-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15rpx;
}

.tip-item:last-child {
  margin-bottom: 0;
}

.tip-dot {
  width: 12rpx;
  height: 12rpx;
  background-color: #3b82f6;
  border-radius: 50%;
  margin-right: 15rpx;
  margin-top: 12rpx;
}

.tip-text {
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.5;
}

.btn-back {
  width: 100%;
  background-color: #3b82f6;
  color: white;
  padding: 24rpx 0;
  border: none;
  border-radius: 12rpx;
  font-size: 30rpx;
  box-shadow: 0 4rpx 6rpx rgba(59, 130, 246, 0.3);
}

/* 图标字体，需要在项目中引入相应的图标库 */
.iconfont {
  font-family: "iconfont" !important;
}
.icon-wallet:before {
  content: "\e6b1";
}
.icon-time:before {
  content: "\e65f";
}
</style> 