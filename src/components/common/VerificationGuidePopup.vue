<template>
  <wd-popup
    v-model="showPopup"
    round
    closeable
    position="center"
    :close-on-click-overlay="false"
    class="verification-guide-popup"
    :style="{ zIndex: 10000 }"
    modal-style="z-index: 10000;"
    :close-on-click-modal="false"
    custom-style="background-color: transparent;z-index: 10000;"
  >
    <view class="popup-content">
      <!-- 标题 -->
      <!-- <view class="popup-header">
        <text class="popup-title">实名认证指引</text>
      </view> -->

      <!-- 内容 -->
      <view class="popup-body">
        <!-- <view class="guide-icon">
          <text class="i-carbon-id-management text-6xl text-blue-500"></text>
        </view> -->
        <!-- <view class="guide-text">
          <text class="guide-main-text">您尚未完成实名认证</text>
          <text class="guide-sub-text">根据相关规定，使用我们的服务需要先完成实名认证</text>
        </view> -->

        <!-- 实名认证奖励列表 -->
        <view class="rewards-container">
          <view
            style="
              font-size: 48rpx;
              color: white;
              position: relative;
              top: 60rpx;
              font-weight: 700;
              left: 215rpx;
            "
          >
            实名奖励
          </view>
          <!-- <view class="rewards-title">实名认证可获得以下奖励：</view> -->
          <view v-if="loading" class="loading-text">
            <wd-loading color="#1989fa" size="24px" />
            <text>加载中...</text>
          </view>
          <view v-else-if="error" class="error-text">{{ error }}</view>
          <view v-else-if="!rewards.length" class="empty-text">暂无奖励</view>
          <view v-else class="rewards-list">
            <view v-for="(reward, index) in rewards" :key="reward.id" class="reward-item">
              <!-- <view class="reward-index">{{ index + 1 }}</view> -->
              <view class="reward-desc" style="line-height: 45rpx; color: #fc451d">
                {{ reward.description }}
              </view>
            </view>
          </view>
        </view>

        <!-- 实名认证按钮 -->
        <view class="auth-button-container">
          <button class="auth-button" @click.stop="goToVerificationPage">实名认证</button>
        </view>
      </view>

      <!-- 底部按钮 -->
      <!-- <view class="popup-footer">
        <button class="verify-btn" @click="goToVerificationPage">立即实名认证</button>
      </view> -->
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, watch } from 'vue'
import { useUserStore } from '@/store'
import {
  getRegisterRewardsAPI,
  type IRegisterReward,
  type IRegisterRewardsResponse,
} from '@/service/index/rewards'

// 定义属性
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
})

// 定义事件
const emit = defineEmits(['update:modelValue', 'close'])

// 内部状态
const showPopup = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// 用户状态
const userStore = useUserStore()

// 奖励列表状态
const rewards = ref<IRegisterReward[]>([])
const loading = ref(false)
const error = ref('')

// 关闭弹窗
const closePopup = () => {
  showPopup.value = false
  emit('close', { later: true })
}

// 跳转到实名认证页面 - 使用首页菜单中的实名认证页面
const goToVerificationPage = () => {
  uni.navigateTo({
    url: '/pages/my/identity-verify',
    success: () => {
      // 跳转成功后关闭弹窗
      showPopup.value = false
    },
  })
}

// 获取实名认证奖励列表
const fetchRegisterRewards = async () => {
  loading.value = true
  error.value = ''

  try {
    // 使用any临时解决类型问题
    const result: any = await getRegisterRewardsAPI()

    if (result.status === 'success' && result.data) {
      rewards.value = result.data
    } else {
      error.value = '获取奖励列表失败'
    }
  } catch (e) {
    console.error('获取注册奖励列表失败:', e)
    error.value = '获取奖励列表失败，请稍后再试'
  } finally {
    loading.value = false
  }
}

// 组件挂载时获取奖励列表
onMounted(() => {
  if (showPopup.value) {
    fetchRegisterRewards()
  }
})

// 监听弹窗显示状态
watch(
  () => showPopup.value,
  (newVal) => {
    if (newVal) {
      fetchRegisterRewards()
    }
  },
)
</script>

<style lang="scss" scoped>
.verification-guide-popup {
  max-height: 85vh;
  border-radius: 20rpx;
  overflow: hidden;
  z-index: 10000 !important; /* 确保弹窗在最顶层，高于公告弹窗 */
}

:deep(.wd-popup),
:deep(.wd-popup__content) {
  z-index: 10000 !important;
}

.popup-content {
  display: flex;
  flex-direction: column;
  width: 600rpx;
  max-height: 85vh;
  overflow: hidden;
}

.popup-header {
  padding: 30rpx 30rpx 20rpx;
  border-bottom: 1px solid #f0f0f0;
  width: 100%;
  box-sizing: border-box;
}

.popup-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  text-align: center;
  display: block;
}

.popup-body {
  padding: 30rpx;
  display: flex;
  flex-direction: column;
  align-items: center;
  flex: 1;
}

.guide-icon {
  margin-bottom: 20rpx;
}

.guide-text {
  display: flex;
  flex-direction: column;
  align-items: center;
  margin-bottom: 30rpx;
}

.guide-main-text {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 10rpx;
}

.guide-sub-text {
  font-size: 28rpx;
  color: #666;
  text-align: center;
  line-height: 1.5;
}

.rewards-container {
  width: 100%;
  height: 700rpx;
  padding: 20rpx;
  border-radius: 10rpx;
  background-image: url('@/static/images/bg/realName.png');
  background-size: contain;
  background-repeat: no-repeat;
}

.rewards-title {
  font-size: 28rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 15rpx;
}

.rewards-list {
  position: relative;
  top: 97rpx;
  // margin-top: 98rpx;
  padding-left: 85rpx;
  width: 100%;
}

.reward-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 15rpx;
  font-size: 26rpx;
  color: #333;
}

.reward-index {
  width: 40rpx;
  height: 40rpx;
  background-color: #007aff;
  color: white;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 24rpx;
  margin-right: 15rpx;
  flex-shrink: 0;
}

.reward-desc {
  flex: 1;
  line-height: 1.5;
  padding-top: 6rpx;
}

.loading-text,
.error-text,
.empty-text {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 30rpx 0;
  font-size: 26rpx;
  color: #999;
}

.loading-text {
  color: #666;
}

.error-text {
  color: #ff4d4f;
}

.popup-footer {
  padding: 20rpx 30rpx 40rpx;
  border-top: 1px solid #f0f0f0;
  width: 100%;
  box-sizing: border-box;
}

.verify-btn {
  height: 80rpx;
  line-height: 80rpx;
  font-size: 28rpx;
  margin: 0;
  padding: 0 30rpx;
  border-radius: 40rpx;
  width: 100%;
  background-color: #007aff;
  color: #fff;
}

.auth-button-container {
  margin-top: 30rpx;
  width: 100%;
  padding: 0 30rpx;
  display: flex;
  justify-content: center;
  position: relative;
  top: -290rpx;
}

.auth-button {
  height: 80rpx;
  line-height: 80rpx;
  font-size: 32rpx;
  font-weight: bold;
  margin: 0;
  padding: 0 60rpx;
  border-radius: 40rpx;
  background-color: #fc451d;
  color: #fff;
  box-shadow: 0 4rpx 10rpx rgba(252, 69, 29, 0.3);
}
</style>
