<route lang="json5" type="page">
{
  layout: 'tabbar',
  style: {
    navigationBarTitleText: '我的',
    navigationStyle: 'custom',
  },
}
</route>

<template>
  <view class="my-container">
    <!-- 顶部波浪装饰 -->
    <view class="wave-decoration"></view>

    <!-- 顶部背景渐变 -->
    <view class="bg-gradient"></view>

    <!-- 个人信息卡片 -->
    <view class="user-card">
      <view class="avatar-container">
        <view class="avatar">
          <text class="avatar-text">{{ getUserInitial() }}</text>
        </view>
      </view>
      <view class="user-info">
        <text class="user-name">{{ getUserDisplayName() }}</text>
        <view class="user-detail">
          <!-- <text class="user-id">ID: {{ userStore.userInfo.id || '-' }}</text> -->
          <text class="divider">|</text>
          <text class="invite-code">邀请码: {{ userStore.userInfo.invite_code || '-' }}</text>
        </view>
      </view>
    </view>

    <!-- 余额展示 -->
    <view class="balance-card" @click="handleBankCardClick">
      <!-- 银行卡顶部 -->
      <view class="card-header">
        <view class="bank-logo">
          <image src="/static/images/bank-icon.png" mode="aspectFit"></image>
          <text>网商银行</text>
        </view>
        <!-- <view class="check-account">
          <button class="check-btn" @click="navigateTo('/pages/my/wallet')">查看账号</button>
        </view> -->
      </view>

      <!-- 余额部分 -->
      <view class="balance-section">
        <view class="balance-label">
          <text>可用余额(元)</text>
          <image
            class="eye-icon"
            :src="`/static/images/${showBalance ? 'show-icon' : 'hidden-icon'}.png`"
            mode="widthFix"
            @click.stop="toggleBalanceVisibility"
          ></image>
        </view>
        <view class="balance-amount">
          <text>{{ showBalance ? formatBalance(userStore.userInfo.balance) : '******' }}</text>
          <text class="arrow-icon" @click.stop="navigateTo('/pages/my/wallet')">></text>
        </view>
      </view>

      <!-- 操作按钮 -->
      <view class="action-buttons">
        <button class="action-btn transfer-in" @click.stop="handleTransferIn">转入</button>
        <button class="action-btn transfer-out" @click.stop="handleTransferOut">转出</button>
      </view>
    </view>

    <!-- 功能菜单 -->
    <view class="menu-list">
      <!-- 银行卡管理 -->
      <!-- <view class="menu-item" @click="navigateTo('/pages/my/bank-cards')">
        <view class="menu-icon bank-icon">
          <wd-icon name="creditcard" size="40rpx" />
        </view>
        <view class="menu-content">
          <text class="menu-title">银行卡管理</text>
          <text class="menu-desc">{{ userStore.userInfo.has_bank_card ? '已开通' : '未开通' }}</text>
        </view>
        <wd-icon name="arrow-right" class="menu-arrow" />
      </view> -->

      <!-- 平台公告 -->
      <view class="menu-item" @click="navigateTo('/pages/my/announcements')">
        <view class="menu-icon announcement-icon">
          <wd-icon name="notification-filled" size="40rpx" />
        </view>
        <view class="menu-content">
          <text class="menu-title">平台公告</text>
          <text class="menu-desc">{{ hasNewAnnouncement ? '有新公告' : '无新公告' }}</text>
        </view>
        <wd-icon name="arrow-right" class="menu-arrow" />
      </view>

      <!-- 个人信息 -->
      <view class="menu-item" @click="handleProfileClick">
        <view class="menu-icon profile-icon">
          <wd-icon name="user" size="40rpx" />
        </view>
        <view class="menu-content">
          <text class="menu-title">个人信息</text>
          <text class="menu-desc">
            {{
              userStore.isVerified
                ? '已实名'
                : userStore.isPendingVerification
                  ? '审核中'
                  : userStore.isRejectedVerification
                    ? '已拒绝'
                    : '未实名'
            }}
          </text>
        </view>
        <wd-icon name="arrow-right" class="menu-arrow" />
      </view>

      <!-- 我的钱包 -->
      <view class="menu-item" @click="navigateTo('/pages/my/wallet')">
        <view class="menu-icon wallet-icon">
          <wd-icon name="wallet" size="40rpx" />
        </view>
        <view class="menu-content">
          <text class="menu-title">我的钱包</text>
          <text class="menu-desc">查看收支记录</text>
        </view>
        <wd-icon name="arrow-right" class="menu-arrow" />
      </view>

      <!-- 交易记录 -->
      <view class="menu-item" @click="navigateTo('/pages/trading/records')">
        <view class="menu-icon transaction-icon">
          <wd-icon name="list" size="40rpx" />
        </view>
        <view class="menu-content">
          <text class="menu-title">交易记录</text>
          <text class="menu-desc">查看所有交易</text>
        </view>
        <wd-icon name="arrow-right" class="menu-arrow" />
      </view>

      <!-- 设置 -->
      <view class="menu-item" @click="navigateTo('/pages/my/settings')">
        <view class="menu-icon settings-icon">
          <wd-icon name="setting" size="40rpx" />
        </view>
        <view class="menu-content">
          <text class="menu-title">设置</text>
          <text class="menu-desc">修改密码等</text>
        </view>
        <wd-icon name="arrow-right" class="menu-arrow" />
      </view>

      <!-- 客服中心 -->
      <view class="menu-item" @click="navigateTo('/pages/my/customer-service')">
        <view class="menu-icon service-icon">
          <wd-icon name="service" size="40rpx" />
        </view>
        <view class="menu-content">
          <text class="menu-title">客服中心</text>
          <text class="menu-desc">联系客服</text>
        </view>
        <wd-icon name="arrow-right" class="menu-arrow" />
      </view>
    </view>

    <!-- 退出登录按钮 -->
    <button class="logout-btn" @click="handleLogout">
      <wd-icon name="power-off" size="32rpx" style="margin-right: 8rpx" />
      退出登录
    </button>

    <!-- 下载APP按钮，仅在浏览器环境显示 -->
    <!-- #ifdef H5 -->
    <button class="download-app-btn" @click="downloadApp">
      <wd-icon name="download" size="32rpx" style="margin-right: 8rpx" />
      下载中银易捷APP
    </button>
    <!-- #endif -->

    <!-- 充值弹窗 -->
    <wd-popup v-model="showRechargePopup" round position="center">
      <view class="popup-content">
        <view class="popup-header">
          <text class="popup-title">转入预存金</text>
          <text class="popup-close" @click="closeRechargePopup">×</text>
        </view>
        <view class="popup-body">
          <view class="amount-input-container">
            <text class="amount-label">预存金额</text>
            <view class="amount-input-wrapper">
              <text class="amount-prefix">¥</text>
              <input
                class="amount-input"
                type="digit"
                v-model="rechargeAmount"
                placeholder="请输入预存金额"
              />
            </view>
          </view>

          <!-- 银行卡开户预存金提示 -->
          <view class="open-fee-tip">
            <text class="tip-title">温馨提示</text>
            <view class="deposit-tips-list" v-if="depositTips.length > 0">
              <view class="deposit-tip-item" v-for="(tip, index) in depositTips" :key="index">
                <text class="tip-dot">•</text>
                <text class="tip-desc">{{ tip.description }}</text>
              </view>
            </view>
          </view>

          <view class="amount-buttons">
            <view
              v-for="(amount, index) in quickAmounts"
              :key="index"
              class="amount-btn"
              :class="{ 'amount-btn-active': rechargeAmount === amount }"
              @click="selectAmount(amount)"
            >
              <text>¥{{ amount }}</text>
            </view>
          </view>
          <button class="confirm-recharge-btn" @click="confirmRecharge">确认转入</button>
        </view>
      </view>
    </wd-popup>

    <!-- 版权信息 -->
    <view class="my-footer">
      <text>© 2025 理财管理平台 版权所有</text>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { useUserStore } from '@/store/user'
import { useAppStore } from '@/store/app'
import { useTabItemTap } from '@/hooks/useTabItemTap'
import { API_URL } from '@/config/api'
import { checkBankCardStatusAPI, getDepositTipsAPI, IDepositTip } from '@/service/index/bankcard'
import { usePlatformStore } from '@/store/platform'

// 定义接口类型
interface DepositTip {
  id: number
  description: string
  sort_order: number
  is_active: boolean
  created_at: string
  updated_at: string
}

// 获取用户数据存储
const userStore = useUserStore()
// 获取App数据存储
const appStore = useAppStore()
// 获取平台设置状态
const platformStore = usePlatformStore()

// 判断是否为浏览器环境
const isBrowser = ref(false)

// 是否有新公告
const hasNewAnnouncement = ref(false)

// 余额显示控制
const showBalance = ref(true)

// 充值相关
const rechargeAmount = ref('')
const showRechargePopup = ref(false)
const quickAmounts = ['100', '500', '1000', '5000', '10000', '20000']
// 预存服务提示列表
const depositTips = ref<DepositTip[]>([])

// 使用TabBar切换钩子，自动处理用户数据刷新
useTabItemTap({
  refreshUserInfo: true,
  pageName: '我的页面',
  onTabTap: () => {
    console.log('我的页面Tab被点击，可以在这里执行额外的业务逻辑')
  },
})

// 页面挂载时添加事件监听
onMounted(() => {
  // 监听余额更新事件
  uni.$on('user_balance_updated', handleBalanceUpdated)

  // 监听未读公告状态更新事件
  uni.$on('refresh_unread_announcements', checkAnnouncementStatus)

  // 初始检查用户数据和余额
  checkUserInfo()

  // 检查是否有未读公告
  checkAnnouncementStatus()

  // 获取预存金额提示
  fetchDepositTips()

  // 判断当前环境
  // #ifdef H5
  isBrowser.value = true
  // #endif
})

// 下载APP方法
const downloadApp = () => {
  // #ifdef H5
  window.open('https://boceasyapk.cn-nb1.rains3.com/boceasy.apk', '_blank')
  // #endif
}

// 页面卸载时移除事件监听
onUnmounted(() => {
  // 移除事件监听
  uni.$off('user_balance_updated', handleBalanceUpdated)
  uni.$off('refresh_unread_announcements', checkAnnouncementStatus)
})

// 处理余额更新事件
const handleBalanceUpdated = (data: any) => {
  console.log('收到余额更新事件:', data)
  // 无需额外操作，因为Pinia中的数据已经更新，这里只记录日志
}

// 检查用户信息，确保数据是最新的
const checkUserInfo = () => {
  // 如果用户已登录，尝试刷新用户信息
  if (userStore.isLogined) {
    // 获取上次更新时间
    const lastUpdateTime = uni.getStorageSync('userInfoUpdateTime') || 0
    const currentTime = Date.now()
    const timeElapsed = currentTime - lastUpdateTime

    // 如果距离上次更新超过5分钟，则重新获取用户信息
    if (timeElapsed > 5 * 60 * 1000) {
      console.log('用户数据已过期，重新获取')
      userStore.fetchUserInfo()
    } else {
      console.log('用户数据在有效期内，无需重新获取')
    }
  }
}

// 获取用户名首字母或默认头像文字
const getUserInitial = () => {
  if (userStore.isVerified && userStore.userInfo.name) {
    return userStore.userInfo.name.charAt(0)
  }
  return '用'
}

// 获取用户显示名称
const getUserDisplayName = () => {
  // 已认证用户优先显示姓名（通过API已处理为实名信息中的真实姓名）
  if (userStore.isVerified && userStore.userInfo.name) {
    return userStore.userInfo.name
  }
  // 未认证用户或姓名为空时显示手机号
  return userStore.userInfo.phone || '未登录'
}

// 格式化余额显示
const formatBalance = (balance) => {
  // 处理undefined、null或空字符串的情况
  if (balance === undefined || balance === null || balance === '') {
    return '0.00'
  }

  // 确保balance是数字类型
  let numBalance = 0
  try {
    numBalance = typeof balance === 'string' ? parseFloat(balance) : Number(balance)
    // 处理NaN的情况
    if (isNaN(numBalance)) {
      numBalance = 0
    }
  } catch (error) {
    console.error('余额格式化错误:', error)
    numBalance = 0
  }

  return numBalance.toFixed(2)
}

// 页面导航
const navigateTo = (url) => {
  uni.navigateTo({ url })
}

// 处理个人信息点击
const handleProfileClick = () => {
  // 如果已经实名认证，显示简单提示
  if (userStore.isVerified) {
    uni.showToast({
      title: '您已完成实名认证',
      icon: 'success',
      duration: 1500,
    })
    return
  }

  // 如果实名认证审核中，显示提示
  if (userStore.isPendingVerification) {
    uni.showToast({
      title: '您的认证正在审核中',
      icon: 'none',
      duration: 1500,
    })
    return
  }

  // 未认证或认证被拒绝，跳转到认证页面
  navigateTo('/pages/my/identity-verify')
}

// 处理转入
const handleTransferIn = async () => {
  // 检查银行卡功能是否开放
  if (!platformStore.enableBankAccount) {
    uni.showToast({
      title: '银行卡功能暂未开放',
      icon: 'none',
      duration: 2000,
    })
    return
  }

  try {
    // 显示加载状态
    uni.showLoading({
      title: '检查中...',
    })

    // 从API获取最新的银行卡状态
    const res = await checkBankCardStatusAPI()
    uni.hideLoading()

    if (res.status === 'success' && res.data) {
      // 使用类型断言处理响应数据
      const statusData = res.data as any
      const hasBankCard = statusData.has_bank_card

      // 更新本地存储的用户银行卡状态
      userStore.setUserInfo({
        ...userStore.userInfo,
        has_bank_card: hasBankCard,
      })

      // 如果用户没有开通银行卡，则提示用户先开通
      if (!hasBankCard) {
        uni.showModal({
          title: '提示',
          content: '转入需要先开通银行卡，是否立即前往开通？',
          confirmText: '去开通',
          success: (res) => {
            if (res.confirm) {
              // 跳转到银行卡开户申请页面
              uni.navigateTo({
                url: '/pages/my/bank-account-apply',
              })
            }
          },
        })
        return
      }

      // 如果已开通银行卡，显示转入弹窗
      rechargeAmount.value = ''
      showRechargePopup.value = true
    }
  } catch (error) {
    uni.hideLoading()
    console.error('获取银行卡状态失败:', error)

    // 发生错误时降级使用本地状态
    if (!userStore.userInfo.has_bank_card) {
      uni.showModal({
        title: '提示',
        content: '转入需要先开通银行卡，是否立即前往开通？',
        confirmText: '去开通',
        success: (res) => {
          if (res.confirm) {
            // 跳转到银行卡开户申请页面
            uni.navigateTo({
              url: '/pages/my/bank-account-apply',
            })
          }
        },
      })
      return
    }

    // 如果本地状态显示已开通，则显示转入弹窗
    rechargeAmount.value = ''
    showRechargePopup.value = true
  }
}

// 处理转出
const handleTransferOut = async () => {
  // 检查银行卡功能是否开放
  if (!platformStore.enableBankAccount) {
    uni.showToast({
      title: '银行卡功能暂未开放',
      icon: 'none',
      duration: 2000,
    })
    return
  }

  try {
    // 显示加载状态
    uni.showLoading({
      title: '检查中...',
    })

    // 从API获取最新的银行卡状态
    const res = await checkBankCardStatusAPI()
    uni.hideLoading()

    if (res.status === 'success' && res.data) {
      // 使用类型断言处理响应数据
      const statusData = res.data as any
      const hasBankCard = statusData.has_bank_card

      // 更新本地存储的用户银行卡状态
      userStore.setUserInfo({
        ...userStore.userInfo,
        has_bank_card: hasBankCard,
      })

      // 如果用户没有开通银行卡，则提示用户先开通
      if (!hasBankCard) {
        uni.showModal({
          title: '提示',
          content: '转出需要先开通银行卡，是否立即前往开通？',
          confirmText: '去开通',
          success: (res) => {
            if (res.confirm) {
              // 直接跳转到银行卡开户申请页面
              uni.navigateTo({
                url: '/pages/my/bank-account-apply',
              })
            }
          },
        })
        return
      }

      // 如果已开通银行卡，跳转到转出页面
      navigateTo('/pages/transfer/index')
    }
  } catch (error) {
    uni.hideLoading()
    console.error('获取银行卡状态失败:', error)

    // 发生错误时降级使用本地状态
    if (!userStore.userInfo.has_bank_card) {
      uni.showModal({
        title: '提示',
        content: '转出需要先开通银行卡，是否立即前往开通？',
        confirmText: '去开通',
        success: (res) => {
          if (res.confirm) {
            // 直接跳转到银行卡开户申请页面
            uni.navigateTo({
              url: '/pages/my/bank-account-apply',
            })
          }
        },
      })
      return
    }

    // 如果本地状态显示已开通，则跳转到转出页面
    navigateTo('/pages/transfer/index')
  }
}

// 关闭充值弹窗
const closeRechargePopup = () => {
  showRechargePopup.value = false
}

// 选择快捷金额
const selectAmount = (amount) => {
  rechargeAmount.value = amount
}

// 确认充值
const confirmRecharge = async () => {
  if (!rechargeAmount.value || parseFloat(rechargeAmount.value) <= 0) {
    uni.showToast({
      title: '请输入有效的充值金额',
      icon: 'none',
    })
    return
  }

  try {
    // 显示加载状态
    uni.showLoading({
      title: '处理中...',
    })

    // 这里替换为实际的充值API调用
    // const res = await api.recharge({ amount: parseFloat(rechargeAmount.value) });

    // 模拟第三方支付跳转
    setTimeout(() => {
      uni.hideLoading()
      closeRechargePopup()

      // 模拟跳转到第三方支付
      uni.navigateTo({
        url: `/pages/payment/third-party?amount=${rechargeAmount.value}`,
      })
    }, 1000)
  } catch (error) {
    uni.hideLoading()
    uni.showToast({
      title: '充值失败，请重试',
      icon: 'none',
    })
  }
}

// 处理退出登录
const handleLogout = () => {
  uni.showModal({
    title: '提示',
    content: '确定要退出登录吗？',
    success: (res) => {
      if (res.confirm) {
        // 清除登录信息
        userStore.clearUserInfo()

        // 返回登录页
        uni.reLaunch({
          url: '/pages/login/index',
        })
      }
    },
  })
}

// 切换余额可见性
const toggleBalanceVisibility = () => {
  showBalance.value = !showBalance.value
}

// 处理充值/转入
const handleRecharge = () => {
  rechargeAmount.value = ''
  showRechargePopup.value = true

  // 如果用户没有开通银行卡且没有获取预存金金额，则获取预存金金额
  if (!userStore.userInfo.has_bank_card && !appStore.hasFetchedBankCardOpenFee) {
    appStore.fetchBankCardOpenFee()
  }

  // 获取最新的预存金提示
  fetchDepositTips()
}

// 检查是否有未读公告
const checkAnnouncementStatus = async () => {
  // 不再调用API，默认为没有未读公告
  hasNewAnnouncement.value = false
}

// 获取预存服务提示
const fetchDepositTips = async () => {
  try {
    const res = await getDepositTipsAPI()
    console.log('预存服务提示响应:', res)

    // 使用安全的方式访问数据
    if (res && typeof res === 'object' && 'status' in res && res.status === 'success') {
      // 安全地访问data字段
      const data = res.data
      if (data && typeof data === 'object' && 'deposit_tips' in data) {
        depositTips.value = (data.deposit_tips as DepositTip[]) || []
        console.log('获取预存服务提示成功:', depositTips.value)
      }
    }
  } catch (error) {
    console.error('获取预存服务提示失败:', error)
    depositTips.value = [] // 确保始终有一个有效数组
  }
}

// 处理银行卡点击
const handleBankCardClick = () => {
  // 检查银行卡功能是否开放
  if (!platformStore.enableBankAccount) {
    uni.showToast({
      title: '银行卡功能暂未开放',
      icon: 'none',
    })
    return
  }

  // 功能已开放，跳转到钱包页面
  navigateTo('/pages/my/wallet')
}
</script>

<style lang="scss">
/* 全局重置 */
page {
  height: 100%;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
  background-color: #f5f5f5;
}
/* 容器样式 */
.my-container {
  position: relative;
  display: flex;
  flex-direction: column;
  min-height: 100vh;
}
/* 顶部波浪装饰 */
.wave-decoration {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 2;
  width: 100%;
  height: 16rpx;
  background: linear-gradient(to right, #ff9c00, #fa2c19);
}
/* 顶部背景渐变 */
.bg-gradient {
  position: absolute;
  top: 0;
  left: 0;
  z-index: 0;
  width: 100%;
  height: 500rpx; /* 增加背景高度 */
  background: linear-gradient(to bottom, #3498db, rgba(250, 44, 25, 0.2), rgba(255, 255, 255, 0));
}
/* 用户卡片 */
.user-card {
  position: relative;
  z-index: 1;
  display: flex;
  align-items: center;
  padding: 40rpx 30rpx;
  margin-top: 40rpx;
}

.avatar-container {
  margin-right: 30rpx;
}

.avatar {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 120rpx;
  height: 120rpx;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  border: 4rpx solid #ffffff;
  border-radius: 50%;
  box-shadow: 0 8rpx 20rpx rgba(243, 156, 18, 0.3);
}

.avatar-text {
  font-size: 60rpx;
  font-weight: bold;
  color: white;
}

.user-info {
  flex: 1;
}

.user-name {
  display: block;
  margin-bottom: 15rpx;
  font-size: 40rpx;
  font-weight: 600;
  color: #ffffff;
  text-shadow: 0 2rpx 4rpx rgba(0, 0, 0, 0.2);
}

.user-detail {
  display: flex;
  align-items: center;
}

.user-id,
.invite-code {
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.9);
  text-shadow: 0 1rpx 2rpx rgba(0, 0, 0, 0.15);
}

.divider {
  margin: 0 10rpx;
  font-size: 24rpx;
  color: rgba(255, 255, 255, 0.6);
}
/* 余额卡片 */
.balance-card {
  position: relative;
  z-index: 1;
  padding: 30rpx;
  margin: 30rpx;
  color: #ffffff;
  background: linear-gradient(to bottom right, #35c8e6, #17b8e0);
  border-radius: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
}

.card-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 30rpx;
}

.bank-logo {
  display: flex;
  align-items: center;
}

.bank-logo image {
  width: 40rpx;
  height: 40rpx;
  margin-right: 10rpx;
}

.bank-logo text {
  font-size: 32rpx;
  font-weight: bold;
}

.check-btn {
  padding: 8rpx 24rpx;
  font-size: 24rpx;
  line-height: 1.5;
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.3);
  border: none;
  border-radius: 30rpx;
}

.balance-section {
  margin-bottom: 30rpx;
}

.balance-label {
  display: flex;
  align-items: center;
  margin-bottom: 10rpx;
}

.balance-label text {
  font-size: 28rpx;
}

.eye-icon {
  width: 40rpx;
  height: 40rpx;
  margin-left: 10rpx;
}

.balance-amount {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.balance-amount text:first-child {
  font-size: 60rpx;
  font-weight: bold;
}

.arrow-icon {
  margin-left: 10rpx;
  font-size: 40rpx;
  opacity: 0.8;
}

.action-buttons {
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.action-btn {
  flex: 1;
  padding: 20rpx 0;
  margin-right: 20rpx;
  font-size: 32rpx;
  line-height: 1.5;
  text-align: center;
  border-radius: 10rpx;
}

.transfer-in {
  color: #17b8e0;
  background-color: #ffffff;
  border: none;
}

.transfer-out {
  color: #ffffff;
  background-color: rgba(255, 255, 255, 0.3);
  border: none;
}

.statement-btn {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  width: 100rpx;
}

.statement-btn text {
  font-size: 28rpx;
}
/* 菜单列表 */
.menu-list {
  position: relative;
  z-index: 1;
  padding: 10rpx 0;
  margin: 0 30rpx 30rpx;
  background-color: white;
  border-radius: 20rpx;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
}

.menu-item {
  position: relative;
  display: flex;
  align-items: center;
  padding: 30rpx;
}

.menu-item:not(:last-child)::after {
  position: absolute;
  right: 0;
  bottom: 0;
  left: 100rpx;
  height: 1px;
  content: '';
  background-color: #f0f0f0;
}

.menu-icon {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 80rpx;
  height: 80rpx;
  margin-right: 20rpx;
  border-radius: 50%;
}

.bank-icon {
  background-color: rgba(52, 152, 219, 0.15);
}

.announcement-icon {
  background-color: rgba(243, 156, 18, 0.15);
}

.profile-icon {
  background-color: rgba(46, 204, 113, 0.15);
}

.wallet-icon {
  background-color: rgba(155, 89, 182, 0.15);
}

.transaction-icon {
  background-color: rgba(231, 76, 60, 0.15);
}

.settings-icon {
  background-color: rgba(52, 73, 94, 0.15);
}

.service-icon {
  background-color: rgba(26, 188, 156, 0.15);
}

.bank-icon .wd-icon {
  font-size: 36rpx;
  color: #3498db;
}

.announcement-icon .wd-icon {
  font-size: 36rpx;
  color: #f39c12;
}

.profile-icon .wd-icon {
  font-size: 36rpx;
  color: #2ecc71;
}

.wallet-icon .wd-icon {
  font-size: 36rpx;
  color: #9b59b6;
}

.transaction-icon .wd-icon {
  font-size: 36rpx;
  color: #e74c3c;
}

.settings-icon .wd-icon {
  font-size: 36rpx;
  color: #34495e;
}

.service-icon .wd-icon {
  font-size: 36rpx;
  color: #1abc9c;
}

.menu-content {
  flex: 1;
}

.menu-title {
  display: block;
  margin-bottom: 6rpx;
  font-size: 30rpx;
  color: #333;
}

.menu-desc {
  font-size: 24rpx;
  color: #999;
}

.menu-arrow {
  font-size: 28rpx;
  color: #ccc;
}
/* 退出登录按钮 */
.logout-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(100% - 60rpx);
  height: 90rpx;
  margin: 0 auto 40rpx;
  font-size: 32rpx;
  font-weight: 500;
  color: #e74c3c;
  background: #ffffff;
  border: none;
  border-radius: 45rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

/* 下载APP按钮 */
.download-app-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: calc(100% - 60rpx);
  height: 90rpx;
  margin: 0 auto 40rpx;
  font-size: 32rpx;
  font-weight: 500;
  color: #ffffff;
  background: linear-gradient(45deg, #e67e22, #d35400);
  border: none;
  border-radius: 45rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

/* 充值弹窗 */
.popup-content {
  width: 600rpx;
  overflow: hidden;
  background-color: #ffffff;
  border-radius: 20rpx;
}

.popup-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  padding: 30rpx;
  border-bottom: 1px solid #f0f0f0;
}

.popup-title {
  font-size: 32rpx;
  font-weight: 500;
  color: #333;
}

.popup-close {
  font-size: 40rpx;
  line-height: 1;
  color: #999;
}

.popup-body {
  padding: 30rpx;
}

.amount-input-container {
  margin-bottom: 30rpx;
}

.amount-label {
  display: block;
  margin-bottom: 20rpx;
  font-size: 28rpx;
  color: #666;
}

.amount-input-wrapper {
  display: flex;
  align-items: center;
  padding-bottom: 10rpx;
  border-bottom: 1px solid #e0e0e0;
}

.amount-prefix {
  margin-right: 10rpx;
  font-size: 40rpx;
  color: #333;
}

.amount-input {
  flex: 1;
  height: 80rpx;
  font-size: 36rpx;
}

.amount-buttons {
  display: flex;
  flex-wrap: wrap;
  justify-content: space-between;
  margin-bottom: 40rpx;
}

.amount-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 170rpx;
  height: 80rpx;
  margin-bottom: 20rpx;
  font-size: 28rpx;
  color: #666;
  background-color: #f5f5f5;
  border-radius: 8rpx;
}

.amount-btn-active {
  font-weight: 500;
  color: #f39c12;
  background-color: rgba(243, 156, 18, 0.2);
}
/* 开户预存金提示 */
.open-fee-tip {
  padding: 20rpx;
  margin-bottom: 30rpx;
  background-color: rgba(243, 156, 18, 0.1);
  border-radius: 8rpx;
}

.tip-title {
  display: block;
  margin-bottom: 10rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: #f39c12;
}

.deposit-tips-list {
  margin-top: 16rpx;
}

.deposit-tip-item {
  display: flex;
  align-items: flex-start;
  margin-bottom: 8rpx;
}

.tip-dot {
  margin-right: 8rpx;
  font-size: 28rpx;
  line-height: 1.3;
  color: #ff9800;
}

.tip-desc {
  flex: 1;
  font-size: 24rpx;
  line-height: 1.5;
  color: #666;
}

.confirm-recharge-btn {
  width: 100%;
  height: 90rpx;
  font-size: 32rpx;
  font-weight: 500;
  color: white;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  border: none;
  border-radius: 45rpx;
}
/* 底部版权信息 */
.my-footer {
  padding: 30rpx 0;
  margin-top: auto;
  font-size: 24rpx;
  color: #999;
  text-align: center;
}
</style>
