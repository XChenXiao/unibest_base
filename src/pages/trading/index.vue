<route lang="json5" type="page">
{
  layout: 'tabbar',
  style: {
    navigationBarTitleText: '交易',
    navigationStyle: 'custom',
  },
}
</route>

<template>
  <view class="trading-container">
    <!-- 顶部波浪装饰 -->
    <view class="wave-decoration"></view>

    <!-- 顶部banner图片 -->
    <view class="banner-container">
      <image class="banner-image" src="/static/images/banner.png" mode="widthFix"></image>
    </view>

    <!-- 主要内容区 -->
    <view class="content-area">
      <!-- 资产总览卡片 -->
      <assets-overview
        :total-assets="assetsInfo.totalAssets"
        :currency-assets="assetsInfo.currencyAssets"
        :equity-assets="assetsInfo.equityAssets"
        :show-assets="showAssets"
        @toggle-visibility="toggleVisibility"
      />

      <!-- 去交易所按钮 -->
      <view class="exchange-btn-container">
        <button class="exchange-btn" @click="goToExchange">交易所</button>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted, onUnmounted } from 'vue'
import { onShow } from '@dcloudio/uni-app'
import { getUserAssets, getUserCurrencies } from '@/service/app/currency'
import { UserAssets } from '@/service/app/types'
import { useUserStore } from '@/store/user'
import { usePlatformStore } from '@/store/platform'
import AssetsOverview from '@/components/finance/AssetsOverview.vue'
import { getEquityInfo, getMyEquity } from '@/service/app'

// 控制资产显示隐藏
const showAssets = ref(true)

// 资产信息
const assetsInfo = reactive({
  totalAssets: 0,
  currencyAssets: 0,
  equityAssets: 0,
})

// 股权信息
const equityInfo = reactive({
  holdAmount: 0,
  price: 0,
  totalValue: 0,
})

// 用户存储
const userStore = useUserStore()
// 平台设置存储
const platformStore = usePlatformStore()

// 自动刷新定时器
let refreshTimer: ReturnType<typeof setInterval> | null = null

// 标记初始加载是否完成
const initialLoadCompleted = ref(false)

// 页面加载完成后的初始化
onMounted(async () => {
  // 显示加载状态
  uni.showLoading({
    title: '加载中...',
  })

  try {
    // 先确保用户信息已加载
    if (!userStore.userInfo.id) {
      await userStore.fetchUserInfo()
    }

    // 并行加载所有资产数据
    await Promise.all([loadUserCurrencies(), loadEquityInfo(), loadUserEquity()])

    // 计算总资产
    updateTotalAssets()

    // 标记初始加载已完成
    initialLoadCompleted.value = true
  } catch (error) {
    console.error('获取资产信息失败', error)
    resetAssetValues()
  } finally {
    // 隐藏加载状态
    uni.hideLoading()
  }

  // 设置定时刷新，每30秒刷新一次数据
  // 注释掉定时刷新功能
  /*
  refreshTimer = setInterval(() => {
    refreshData();
  }, 30000);
  */
})

// 每次页面显示时刷新数据
onShow(() => {
  // 仅在非首次加载时刷新数据，避免重复请求
  if (initialLoadCompleted.value) {
    refreshData()
  }
})

// 清理定时器
onUnmounted(() => {
  /*
  if (refreshTimer) {
    clearInterval(refreshTimer);
    refreshTimer = null;
  }
  */
})

// 刷新数据
const refreshData = async () => {
  try {
    // 并行加载所有资产数据
    await Promise.all([loadUserCurrencies(), loadEquityInfo(), loadUserEquity()])

    // 计算总资产
    updateTotalAssets()
  } catch (error) {
    console.error('刷新资产数据失败', error)
  }
}

// 加载股权基本信息
const loadEquityInfo = async () => {
  try {
    const res = await getEquityInfo()
    if (res.status === 'success' && res.data) {
      // 转换价格字符串为数字
      equityInfo.price = parseFloat(res.data.price)
    }
  } catch (error) {
    console.error('获取股权信息失败', error)
  }
}

// 加载用户持有的股权
const loadUserEquity = async () => {
  try {
    // 调用API获取用户股权
    const response = await getMyEquity()

    if (response.status === 'success' && response.data) {
      // 获取可用股权数量
      const availableAmount = response.data.available_amount || 0
      // 计算总价值
      equityInfo.holdAmount = availableAmount
      equityInfo.totalValue = equityInfo.holdAmount * equityInfo.price

      // 更新资产信息
      assetsInfo.equityAssets = equityInfo.totalValue
    }
  } catch (error) {
    console.error('获取用户股权失败', error)
  }
}

// 加载用户货币
const loadUserCurrencies = async () => {
  try {
    // 获取平台所有货币列表（包含用户余额信息）
    const currenciesRes = await getUserCurrencies()
    if (currenciesRes.status === 'success' && currenciesRes.data) {
      const currencies = currenciesRes.data as unknown as any[]

      // 计算货币总资产
      const currencyTotal = currencies.reduce((total, currency) => {
        // 优先使用API返回的user_current_value
        if ('user_current_value' in currency) {
          return total + parseFloat((currency.user_current_value as string) || '0')
        }

        // 其次尝试使用price和user_balance计算
        const price = parseFloat(
          typeof currency.price === 'string' ? currency.price : currency.price?.toString() || '0',
        )
        const balance = parseFloat(
          typeof currency.user_balance === 'string'
            ? currency.user_balance
            : currency.user_balance?.toString() || '0',
        )

        if (price && balance) {
          return total + price * balance
        }

        // 再次尝试使用之前的字段格式
        const oldPrice = currency.price || (currency.currency ? currency.currency.price : 0)
        const oldAmount = currency.user_balance || currency.amount || currency.holdAmount || 0

        return (
          total + parseFloat((oldPrice as string) || '0') * parseFloat((oldAmount as string) || '0')
        )
      }, 0)

      // 更新资产信息
      assetsInfo.currencyAssets = currencyTotal
    } else {
      // 如果获取货币列表失败，尝试获取资产概览
      try {
        const assetsRes = await getUserAssets()
        if (assetsRes.status === 'success' && assetsRes.data) {
          // 使用类型断言解决类型错误
          const userAssets = assetsRes.data as unknown as UserAssets
          assetsInfo.currencyAssets = Number(userAssets.currency_assets) || 0
        }
      } catch (error) {
        console.error('获取资产概览失败', error)
      }
    }
  } catch (error) {
    console.error('获取用户货币失败', error)
  }
}

// 更新总资产
const updateTotalAssets = () => {
  assetsInfo.totalAssets = assetsInfo.currencyAssets + assetsInfo.equityAssets
}

// 重置资产值
const resetAssetValues = () => {
  assetsInfo.totalAssets = 0
  assetsInfo.currencyAssets = 0
  assetsInfo.equityAssets = 0
  equityInfo.holdAmount = 0
  equityInfo.price = 0
  equityInfo.totalValue = 0
}

// 切换资产可见性
const toggleVisibility = () => {
  showAssets.value = !showAssets.value
}

// 去交易所
const goToExchange = () => {
  console.log('点击交易所按钮，检查功能开关状态...')
  console.log('当前平台设置状态：交易所功能开放=', platformStore.enableExchange)

  // 检查交易所功能是否开放
  if (!platformStore.enableExchange) {
    console.log('交易所功能未开放，显示提示')
    uni.showToast({
      title: '交易所功能暂未开放',
      icon: 'none',
      duration: 2000,
    })
    return
  }

  // 功能已开放，跳转到交易所页面
  console.log('交易所功能已开放，准备跳转到交易所页面')
  uni.navigateTo({
    url: '/pages/trading/exchange',
    success: () => {
      console.log('成功跳转到交易所页面')
    },
    fail: (err) => {
      console.error('跳转到交易所页面失败:', err)
    },
  })
}
</script>

<style lang="scss">
/* 全局重置 */
page {
  background-color: #f5f5f5;
  height: 100%;
  font-family: 'PingFang SC', 'Helvetica Neue', Arial, sans-serif;
}

/* 容器样式 */
.trading-container {
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
  z-index: 2;
}

/* 顶部banner图片 */
.banner-container {
  width: 100%;
  height: auto;
  overflow: hidden;
}

.banner-image {
  width: 100%;
  display: block;
}

/* 内容区域 */
.content-area {
  padding: 0;
  margin-top: -40rpx;
  position: relative;
  z-index: 1;
}

/* 去交易所按钮 */
.exchange-btn-container {
  margin: 0 0 40rpx;
  padding: 0 40rpx;
}

.exchange-btn {
  width: 100%;
  height: 100rpx;
  border: none;
  border-radius: 50rpx;
  background: linear-gradient(to right, #f39c12, #e74c3c);
  color: white;
  font-size: 32rpx;
  font-weight: 500;
  line-height: 100rpx;
  box-shadow: 0 8rpx 20rpx rgba(243, 156, 18, 0.3);
}
</style>
