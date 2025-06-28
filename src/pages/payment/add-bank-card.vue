<route lang="json5" type="page">
  {
    style: {
      navigationStyle: "custom"
    }
  }
</route> 
<template>
  <view class="add-bank-card-container">
    <!-- 顶部导航栏 -->
    <view class="header">
      <view class="back-icon" @click="goBack">
        <text class="iconfont icon-left"></text>
      </view>
      <view class="title">添加银行卡</view>
    </view>
    
    <!-- 添加银行卡表单 -->
    <view class="form-container">
      <view class="form-group">
        <view class="form-item">
          <view class="label">持卡人</view>
          <input 
            class="input" 
            v-model="cardForm.holderName" 
            placeholder="请输入持卡人姓名" 
            placeholder-class="placeholder"
          />
        </view>
        
        <view class="form-item">
          <view class="label">卡号</view>
          <input 
            class="input" 
            v-model="cardForm.cardNumber" 
            type="text" 
            placeholder="请输入银行卡号" 
            placeholder-class="placeholder"
            maxlength="19"
          />
        </view>
        
        <view class="form-item">
          <view class="label">开户银行</view>
          <picker 
            class="picker" 
            :range="bankList" 
            range-key="name" 
            @change="onBankChange"
          >
            <view class="picker-value" :class="{ 'placeholder': !cardForm.bankName }">
              {{ cardForm.bankName || '请选择开户银行' }}
            </view>
          </picker>
          <text class="iconfont icon-right"></text>
        </view>
        
        <view class="form-item">
          <view class="label">预留手机号</view>
          <input 
            class="input" 
            v-model="cardForm.phone" 
            type="text" 
            placeholder="请输入银行预留手机号" 
            placeholder-class="placeholder"
            maxlength="11"
          />
        </view>
      </view>
      
      <view class="tips">
        <text class="tips-text">* 请确保所填信息准确无误，银行卡需为储蓄卡</text>
      </view>
      
      <button class="submit-btn" @click="submitForm">确认添加</button>
    </view>
  </view>
</template>

<script setup lang="ts">
import { reactive } from 'vue'
import { useBankCardStore } from '@/stores/bankCard'

// 获取银行卡store
const bankCardStore = useBankCardStore()

// 银行卡表单数据
const cardForm = reactive({
  holderName: '',
  cardNumber: '',
  bankName: '',
  bankCode: '',
  phone: ''
})

// 银行列表
const bankList = [
  { code: 'BOC', name: '中国银行' },
  { code: 'ICBC', name: '中国工商银行' },
  { code: 'CCB', name: '中国建设银行' },
  { code: 'ABC', name: '中国农业银行' },
  { code: 'CMBC', name: '中国民生银行' },
  { code: 'CMB', name: '招商银行' },
  { code: 'SPDB', name: '浦发银行' },
  { code: 'CIB', name: '兴业银行' }
]

// 银行选择变更
const onBankChange = (e: any) => {
  const index = e.detail.value
  cardForm.bankName = bankList[index].name
  cardForm.bankCode = bankList[index].code
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 提交表单
const submitForm = () => {
  // 表单验证
  if (!cardForm.holderName) {
    return uni.showToast({
      title: '请输入持卡人姓名',
      icon: 'none'
    })
  }
  
  if (!cardForm.cardNumber || cardForm.cardNumber.length < 16) {
    return uni.showToast({
      title: '请输入正确的银行卡号',
      icon: 'none'
    })
  }
  
  if (!cardForm.bankName) {
    return uni.showToast({
      title: '请选择开户银行',
      icon: 'none'
    })
  }
  
  if (!cardForm.phone || cardForm.phone.length !== 11) {
    return uni.showToast({
      title: '请输入正确的手机号',
      icon: 'none'
    })
  }
  
  // 提交表单
  uni.showLoading({
    title: '提交中...'
  })
  
  // 添加到store
  try {
    bankCardStore.addBankCard({
      holderName: cardForm.holderName,
      cardNumber: cardForm.cardNumber,
      bankName: cardForm.bankName,
      bankCode: cardForm.bankCode,
      phone: cardForm.phone
    })
    
    uni.hideLoading()
    uni.showToast({
      title: '添加成功',
      icon: 'success',
      duration: 2000,
      success: () => {
        // 延迟返回上一页
        setTimeout(() => {
          uni.navigateBack()
        }, 2000)
      }
    })
  } catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: '添加失败，请重试',
      icon: 'none'
    })
    console.error('添加银行卡失败', error)
  }
}
</script>

<style lang="scss" scoped>
.add-bank-card-container {
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

.form-container {
  padding: 15px;
}

.form-group {
  background-color: #fff;
  border-radius: 12px;
  margin-bottom: 15px;
}

.form-item {
  display: flex;
  align-items: center;
  padding: 15px;
  border-bottom: 1px solid #f0f0f0;
  position: relative;
  
  &:last-child {
    border-bottom: none;
  }
}

.label {
  width: 90px;
  font-size: 15px;
  color: #333;
}

.input {
  flex: 1;
  font-size: 15px;
  color: #333;
}

.picker {
  flex: 1;
}

.picker-value {
  font-size: 15px;
  color: #333;
}

.placeholder {
  color: #999;
}

.icon-right {
  position: absolute;
  right: 15px;
  color: #999;
  font-size: 14px;
}

.tips {
  padding: 0 15px;
  margin-bottom: 30px;
}

.tips-text {
  font-size: 12px;
  color: #999;
}

.submit-btn {
  background: linear-gradient(90deg, #ff9500, #ff5e3a);
  color: #fff;
  border-radius: 25px;
  font-size: 16px;
  height: 50px;
  line-height: 50px;
  margin: 0 15px;
}
</style>

