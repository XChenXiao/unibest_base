<route lang="json5">
{
  style: {
    navigationBarTitleText: '支付宝账户设置',
  },
}
</route>

<template>
  <view class="alipay-account-container">
    <!-- 表单内容 -->
    <view class="form-panel">
      <view class="form-item">
        <view class="form-label">支付宝账号</view>
        <input 
          class="form-input" 
          v-model="formData.account" 
          placeholder="请输入支付宝账号或手机号" 
        />
      </view>
      
      <view class="form-item">
        <view class="form-label">真实姓名</view>
        <input 
          class="form-input" 
          v-model="formData.real_name" 
          placeholder="请输入真实姓名" 
        />
      </view>
      
      <view class="form-item">
        <view class="form-label">收款二维码</view>
        <view class="upload-container">
          <view class="upload-box" @click="chooseQRCode" v-if="!formData.qrcode">
            <view class="upload-icon">+</view>
            <view class="upload-text">上传收款码</view>
          </view>
          <view class="qrcode-preview" v-else>
            <image :src="formData.qrcode" mode="aspectFit" class="qrcode-image"></image>
            <view class="delete-btn" @click.stop="deleteQRCode">
              <wd-icon name="delete" size="36rpx" color="#ff4d4f" />
            </view>
          </view>
        </view>
      </view>
    </view>
    
    <!-- 保存按钮 -->
    <view class="save-btn" @click="saveAccount">保存设置</view>
  </view>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { chooseAndUploadAlipayQRCode } from '@/utils/imageUpload';
import { 
  getAlipayAccounts, 
  getPaymentInfo, 
  updateAlipayAccount, 
  createAlipayAccount, 
  updatePaymentInfo,
  type AlipayAccount,
  type PaymentInfo
} from '@/service/app/alipay';

// 表单数据
const formData = ref<{
  id: number | null;
  account: string;
  real_name: string;
  qrcode: string;
}>({
  id: null,
  account: '',
  real_name: '',
  qrcode: ''
});

// 获取当前支付宝账户信息
const fetchAccountInfo = async () => {
  try {
    uni.showLoading({ title: '加载中...' });
    
    // 获取用户的支付宝账户列表
    const accountRes = await getAlipayAccounts();
    // 获取支付宝收款二维码信息
    const paymentInfoRes = await getPaymentInfo();
    
    uni.hideLoading();
    
    if (accountRes.status === 'success' && Array.isArray(accountRes.data) && accountRes.data.length > 0) {
      // 优先使用默认账户，如果没有默认账户则使用第一个
      const defaultAccount = accountRes.data.find((acc) => acc.is_default) || accountRes.data[0];
      formData.value.id = defaultAccount.id;
      formData.value.account = defaultAccount.account;
      formData.value.real_name = defaultAccount.real_name;
    }
    
    if (paymentInfoRes.status === 'success') {
      formData.value.qrcode = paymentInfoRes.data?.alipay_qrcode_url || '';
    }
  } catch (error) {
    uni.hideLoading();
    console.error('获取支付宝账户信息失败:', error);
    uni.showToast({
      title: '获取账户信息失败',
      icon: 'none'
    });
  }
};

// 选择二维码图片
const chooseQRCode = () => {
  chooseAndUploadAlipayQRCode()
    .then((res) => {
      if (res.status === 'success' && res.data?.url) {
        formData.value.qrcode = res.data.url;
        uni.showToast({
          title: '上传成功',
          icon: 'success'
        });
      } else {
        throw new Error(res.message || '上传失败');
      }
    })
    .catch((error) => {
      console.error('上传二维码失败:', error);
      uni.showToast({
        title: error.message || '上传失败，请重试',
        icon: 'none'
      });
    });
};

// 删除二维码
const deleteQRCode = () => {
  uni.showModal({
    title: '删除确认',
    content: '确定要删除该收款二维码吗？',
    success: (res) => {
      if (res.confirm) {
        formData.value.qrcode = '';
      }
    }
  });
};

// 保存账户信息
const saveAccount = async () => {
  if (!formData.value.account || !formData.value.real_name) {
    uni.showToast({
      title: '请填写完整账户信息',
      icon: 'none'
    });
    return;
  }
  
  try {
    uni.showLoading({ title: '保存中...' });
    
    // 保存支付宝账户信息
    let accountRes;
    if (formData.value.id) {
      // 更新现有账户
      accountRes = await updateAlipayAccount(formData.value.id, {
        account: formData.value.account,
        real_name: formData.value.real_name,
        is_default: true
      });
    } else {
      // 添加新账户
      accountRes = await createAlipayAccount({
        account: formData.value.account,
        real_name: formData.value.real_name,
        is_default: true
      });
    }
    
    // 保存二维码信息
    const qrcodeRes = await updatePaymentInfo({
      alipay_qrcode: formData.value.qrcode
    });
    
    uni.hideLoading();
    
    if (accountRes.status === 'success' && qrcodeRes.status === 'success') {
      uni.showToast({
        title: '设置已保存',
        icon: 'success'
      });
      
      // 通知提现页面刷新账户信息
      uni.$emit('refresh-alipay-accounts');
      
      // 如果是从提现页跳转过来的，则返回
      const pages = getCurrentPages();
      const prevPage = pages[pages.length - 2];
      
      if (prevPage && prevPage.route.includes('transfer/alipay')) {
        setTimeout(() => {
          uni.navigateBack();
        }, 1500);
      }
    } else {
      uni.showToast({
        title: accountRes.message || qrcodeRes.message || '保存失败',
        icon: 'none'
      });
    }
  } catch (error) {
    uni.hideLoading();
    console.error('保存支付宝账户信息失败:', error);
    uni.showToast({
      title: '保存失败，请重试',
      icon: 'none'
    });
  }
};

// 页面加载时获取账户信息
onMounted(() => {
  fetchAccountInfo();
});
</script>

<style lang="scss">
page {
  background-color: #f5f5f5;
}

.alipay-account-container {
  padding: 30rpx;
}

/* 表单面板 */
.form-panel {
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 30rpx;
  margin-bottom: 40rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.form-item {
  margin-bottom: 30rpx;
}

.form-label {
  font-size: 28rpx;
  color: #666;
  margin-bottom: 15rpx;
}

.form-input {
  background-color: #f5f5f5;
  height: 80rpx;
  border-radius: 8rpx;
  padding: 0 20rpx;
  font-size: 28rpx;
}

/* 二维码上传 */
.upload-container {
  display: flex;
  margin-top: 10rpx;
}

.upload-box {
  width: 200rpx;
  height: 200rpx;
  border: 1px dashed #ddd;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  border-radius: 8rpx;
  background-color: #f9f9f9;
}

.upload-icon {
  font-size: 60rpx;
  color: #999;
  margin-bottom: 10rpx;
}

.upload-text {
  font-size: 24rpx;
  color: #999;
}

.qrcode-preview {
  position: relative;
  width: 200rpx;
  height: 200rpx;
  border: 1px solid #eee;
  border-radius: 8rpx;
  overflow: hidden;
}

.qrcode-image {
  width: 100%;
  height: 100%;
}

.delete-btn {
  position: absolute;
  top: 10rpx;
  right: 10rpx;
  width: 40rpx;
  height: 40rpx;
  background-color: rgba(255, 255, 255, 0.8);
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
}

/* 保存按钮 */
.save-btn {
  background-color: #1BAEAE;
  height: 90rpx;
  border-radius: 45rpx;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 32rpx;
  color: #ffffff;
  box-shadow: 0 4rpx 12rpx rgba(27, 174, 174, 0.2);
  margin-top: 60rpx;
}
</style> 