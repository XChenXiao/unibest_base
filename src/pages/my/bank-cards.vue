<route lang="json5" type="page">
{
  style: {
    navigationBarTitleText: '银行卡管理',
    navigationBarBackgroundColor: '#f5f5f5',
    navigationBarTextStyle: 'black',
    'app-plus': {
      titleNView: {
        titleSize: '32rpx',
        titleWeight: 'bold',
        titleAlign: 'center',
      },
    },
  },
}
</route>

<template>
  <view class="container">
    <!-- 顶部卡片 -->
    <!-- <view class="card-top">
      <view class="card-top-title">
        网商银行卡
        <text class="activation-status" :class="{'status-processing': isProcessing}">
          {{ isActivated ? '已激活' : isProcessing ? '审核中' : '未激活' }}
        </text>
      </view>
      
      <view class="card-balance">
        <view class="balance-label">当前余额</view>
        <view class="balance-amount">{{ balance }}</view>
        <view class="balance-card-info" v-if="defaultCard">{{ defaultCard.bank_name }} **** {{ defaultCard.masked_card_number.slice(-4) }}</view>
      </view>
    </view>
     -->
    <!-- 激活区域 - 未激活且未申请中 -->
    <!-- 删除激活区域 -->

    <!-- 审核中状态提示 -->
    <view class="review-status" v-if="isProcessing">
      <view class="review-icon">
        <text class="iconfont icon-time"></text>
      </view>
      <view class="review-title">申请审核中</view>
      <view class="review-desc">
        您的银行卡开户申请已提交，正在审核中
        <text class="review-time">预计审核时间：1-3个工作日</text>
      </view>
    </view>

    <!-- 卡片管理区域 -->
    <view class="card-container">
      <!-- 添加卡片表单 -->
      <view class="card-form" v-if="showAddCardForm">
        <view class="form-title">添加银行卡</view>
        <view class="form-group">
          <text class="form-label">持卡人姓名</text>
          <input
            type="text"
            class="form-input"
            v-model="newCard.card_holder"
            placeholder="请输入持卡人姓名"
            placeholder-class="input-placeholder"
          />
        </view>
        <view class="form-group">
          <text class="form-label">银行名称</text>
          <view class="bank-selector">
            <view class="bank-search-input">
          <input
            class="form-input"
                v-model="bankSearchKeyword"
            placeholder="请输入银行名称"
            placeholder-class="input-placeholder"
                @input="filterBanks"
                @focus="showBankDropdown = true"
                @blur="handleBankInputBlur"
              />
              <text class="search-icon uni-icons uniui-search"></text>
            </view>
            <view class="bank-dropdown" v-if="showBankDropdown">
              <scroll-view scroll-y style="max-height: 300rpx;">
                <view 
                  class="bank-item" 
                  v-for="bank in filteredBanks" 
                  :key="bank.key"
                  @click="selectBank(bank)"
                >
                  <image class="bank-icon" :src="`/static/images/bank/${bank.key}.png`" mode="aspectFit" @error="handleImageError"></image>
                  <text class="bank-name">{{ bank.value }}</text>
                </view>
                <view class="empty-tip" v-if="filteredBanks.length === 0">
                  <text>未找到匹配的银行</text>
                </view>
              </scroll-view>
            </view>
          </view>
        </view>
        <view class="form-group">
          <text class="form-label">银行卡号</text>
          <input
            type="text"
            class="form-input"
            v-model="newCard.card_number"
            placeholder="请输入完整的银行卡号"
            placeholder-class="input-placeholder"
          />
        </view>
        <!-- <view class="form-group">
          <text class="form-label">支行名称(可选)</text>
          <input type="text" class="form-input" v-model="newCard.branch_name" placeholder="请输入支行名称" placeholder-class="input-placeholder" />
        </view> -->
        <view class="form-actions">
          <button class="btn-cancel" @click="cancelAddCard">取消</button>
          <button class="btn-save" @click="saveCard">保存</button>
        </view>
      </view>

      <!-- 添加卡片按钮 -->
      <button class="add-card-btn" @click="showAddCardForm = true" v-else>+ 添加银行卡</button>

      <!-- 卡片列表区域 -->
      <view class="bank-card-list" v-if="cards.length > 0">
        <view class="card-list">
          <view 
            class="visa-card" 
            v-for="card in cards" 
            :key="card.id" 
            @click="selectCardForWithdraw(card)"
            :style="{ background: getBankCardGradient(card.bank_name) }"
            :class="{
              'selected-card': selectedCardId === card.id
            }"
          >
          <view class="card-watermark">
            <image 
            :src="getBankIconByName(card.bank_name) ? `/static/images/bank/${getBankIconByName(card.bank_name)}.png` : '/static/images/bank-icon.png'" mode="widthFix" 
            :style="getBankIconByName(card.bank_name)  !== 'default-card' ? 'width: 30%;position: absolute;top: 0;right: 300rpx;' : 'width: 20%;position: absolute;top: 70rpx;right: 340rpx;'">
            </image>
          </view>
          <view class="card-bank-name">
            {{ card.bank_name }}
          </view>
            <view class="visa-number">
              <text>•••• •••• •••• {{ card.masked_card_number.slice(-4) }}</text>
            </view>
            <view class="card-icon" style="display: flex; align-items: center; justify-content: center;">
              <image :src="getBankIconByName(card.bank_name) ? `/static/images/bank/${getBankIconByName(card.bank_name)}.png` : '/static/images/bank-icon.png'" mode="widthFix" :style="getBankIconByName(card.bank_name) !== 'default-card' ? 'width: 80%;' : 'width: 60%;'"></image>
             </view>
            
            <!-- 卡片操作区域 - 仅在非提现模式下显示 -->
            <view class="card-actions" v-if="!isFromWithdraw">
              <view class="normal-actions full-width">
                <button class="btn-default" @click.stop="setAsDefault(card.id)" :disabled="card.is_default">
                  设为默认
                </button>
                <button class="btn-delete" @click.stop="confirmDeleteCard(card.id)">删除</button>
              </view>
            </view>
          </view>
        </view>
      </view>
      
      <!-- 页面内容占位，确保底部按钮不会覆盖内容 -->
      <view class="content-spacer"></view>
    </view>
    
    <!-- 底部固定按钮区域 -->
    <view class="fixed-bottom-buttons">
      <!-- 返回按钮 - 仅在从提现页面进入时显示 -->
      <button v-if="isFromWithdraw" class="return-btn" @click="goBack">
        返回提现页面
      </button>
      
      <!-- 调试按钮 - 仅在开发环境显示 -->
      <!-- #ifdef H5 -->
      <button v-if="!isFromWithdraw" class="debug-btn" @click="toggleSelectMode">
        {{ isFromWithdraw ? '关闭' : '开启' }}选择模式(调试用)
      </button>
      <!-- #endif -->
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted, reactive, onUnmounted } from 'vue'
import { useUserStore } from '@/store'
import {
  checkBankCardStatusAPI as getBankCardStatusAPI,
  getBankCardsAPI,
  addBankCardAPI,
  deleteBankCardAPI,
  setDefaultBankCardAPI,
  IBankCard,
} from '@/service/index/bankcard'
import { useBankCardStore } from '@/store'
import { BankEnum } from '@/enums/BankEnum'

// 用户数据
const userStore = useUserStore()
const bankCardStore = useBankCardStore()

// 银行卡数据状态
const loading = ref(false)
const cards = ref<IBankCard[]>([])
const bankCardStatus = reactive({
  has_bank_card: false,
  bank_card_opened_at: null as string | null,
  latest_application: null as null | {
    id: number
    status: string
    status_text: string
    created_at: string
    reviewed_at: string | null
    remarks: string | null
  },
  open_fee: 0,
  can_apply: false,
})

// 是否从提现页面进入，用于判断是选择银行卡还是管理银行卡
const isFromWithdraw = ref(false)
// 当前选中的银行卡ID
const selectedCardId = ref<number | null>(null)

// 计算属性
const isActivated = computed(() => bankCardStatus.has_bank_card)
const isProcessing = computed(() => {
  return (
    bankCardStatus.latest_application !== null &&
    bankCardStatus.latest_application.status === 'pending'
  )
})
const defaultCard = computed(() => {
  return cards.value.find((card) => card.is_default)
})

// 余额信息 - 实际项目中应从用户信息获取
const balance = computed(() => {
  if (!userStore.userInfo.balance) return '¥ 0.00'
  return `¥ ${userStore.userInfo.balance.toFixed(2)}`
})

// 新卡表单数据
const showAddCardForm = ref(false)
const newCard = ref({
  bank_name: '',
  card_number: '',
  card_holder: '',
  branch_name: '',
})

// 银行搜索和选择相关
const bankSearchKeyword = ref('')
const showBankDropdown = ref(false)
const selectedBankKey = ref<keyof typeof BankEnum | null>(null)

// 银行列表
interface BankItem {
  key: keyof typeof BankEnum;
  value: string;
}

// 将BankEnum转换为数组以便于处理
const bankList = computed<BankItem[]>(() => {
  return Object.entries(BankEnum)
    .filter(([key]) => isNaN(Number(key))) // 过滤掉枚举的数字键
    .map(([key, value]) => ({
      key: key as keyof typeof BankEnum,
      value: value as string
    }))
})

// 根据搜索关键词过滤银行列表
const filteredBanks = ref<BankItem[]>([] as BankItem[])

// 处理图片加载错误
const handleImageError = (e: any) => {
  // 当图片加载失败时，将src替换为中国银行图标
  const target = e.target || e.currentTarget
  if (target) {
    target.src = '/static/images/bank-icon.png'
  }
}

// 过滤银行列表
const filterBanks = () => {
  if (!bankSearchKeyword.value) {
    filteredBanks.value = bankList.value
    return
  }
  
  filteredBanks.value = bankList.value.filter(bank => 
    bank.value.toLowerCase().includes(bankSearchKeyword.value.toLowerCase())
  )
}

// 选择银行
const selectBank = (bank: BankItem) => {
  bankSearchKeyword.value = bank.value
  newCard.value.bank_name = bank.value
  selectedBankKey.value = bank.key
  showBankDropdown.value = false
}

// 处理银行输入框失去焦点事件
const handleBankInputBlur = () => {
  // 使用setTimeout延迟关闭下拉框，以便点击事件能够先触发
  setTimeout(() => {
    showBankDropdown.value = false
  }, 200)
}

// 根据银行名称获取对应的BankEnum枚举键
const getBankEnumKeyByName = (bankName: string): keyof typeof BankEnum | null => {
  // 遍历BankEnum查找匹配的银行名称
  const entry = Object.entries(BankEnum).find(([_, value]) => value === bankName)
  return entry ? entry[0] as keyof typeof BankEnum : null
}

// 根据银行名称获取图标文件名
const getBankIconByName = (bankName: string): string => {
  const bankKey = getBankEnumKeyByName(bankName)
  // 如果找不到对应的银行枚举，直接返回空字符串，让@error事件触发
  return bankKey ? bankKey : 'default-card'
}

// 根据银行名称获取卡片渐变色
const getBankCardGradient = (bankName: string): string => {
  // 根据银行类型分类设置渐变色
  const bankKey = getBankEnumKeyByName(bankName)
  if (!bankKey) return 'linear-gradient(135deg, #467bec 0%, #214da5 100%)' // 默认蓝色渐变
  
  // 根据银行图标的主色调设置渐变色
  switch (bankKey) {
    // 国有银行
    case 'BANK_OF_CHINA': // 中国银行 - 红色
      return 'linear-gradient(135deg, #e74c3c 0%, #c0392b 100%)'
    case 'ICBC': // 工商银行 - 红色
      return 'linear-gradient(135deg, #e53935 0%, #c62828 100%)'
    case 'CCB': // 建设银行 - 蓝色
      return 'linear-gradient(135deg, #1976d2 0%, #0d47a1 100%)'
    case 'ABC': // 农业银行 - 绿色
      return 'linear-gradient(135deg, #43a047 0%, #2e7d32 100%)'
    case 'BOCOM': // 交通银行 - 蓝色
      return 'linear-gradient(135deg, #0288d1 0%, #01579b 100%)'
    case 'PSBC': // 邮储银行 - 绿色
      return 'linear-gradient(135deg, #00897b 0%, #004d40 100%)'
    
    // 股份制商业银行
    case 'CMB': // 招商银行 - 红色
      return 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)'
    case 'CITIC': // 中信银行 - 红色
      return 'linear-gradient(135deg, #c62828 0%, #8e0000 100%)'
    case 'SPDB': // 浦发银行 - 蓝色
      return 'linear-gradient(135deg, #1565c0 0%, #0d47a1 100%)'
    case 'CIB': // 兴业银行 - 蓝色
      return 'linear-gradient(135deg, #0277bd 0%, #01579b 100%)'
    case 'CMBC': // 民生银行 - 绿色
      return 'linear-gradient(135deg, #2e7d32 0%, #1b5e20 100%)'
    case 'CEB': // 光大银行 - 黄色
      return 'linear-gradient(135deg, #fdd835 0%, #f57f17 100%)'
    case 'PAB': // 平安银行 - 橙色
      return 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)'
    case 'GDB': // 广发银行 - 红色
      return 'linear-gradient(135deg, #d32f2f 0%, #b71c1c 100%)'
    case 'HXB': // 华夏银行 - 红色
      return 'linear-gradient(135deg, #c62828 0%, #8e0000 100%)'
    
    // 其他银行分类
    default:
      // 城市商业银行 - 多为绿色系
      if (bankKey.startsWith('BO') && !['BOCOM'].includes(bankKey)) {
        return 'linear-gradient(135deg, #388e3c 0%, #1b5e20 100%)'
      }
      
      // 农商行/农信社/农合行 - 多为橙色或绿色系
      if (bankKey.includes('RCB') || bankKey.endsWith('RCB')) {
        return 'linear-gradient(135deg, #f57c00 0%, #e65100 100%)'
      }
      
      // 其他银行 - 默认蓝紫色系
      return 'linear-gradient(135deg, #5e35b1 0%, #4527a0 100%)'
  }
}

// 在页面加载时获取银行卡状态和卡片列表
onMounted(async () => {
  // 初始化过滤后的银行列表
  filteredBanks.value = bankList.value
  
  // 检查是否从提现页面进入
  const pages = getCurrentPages()
  console.log('当前页面栈:', pages.map(p => p.route || '未知路由'))
  
  // 默认设置为false
  isFromWithdraw.value = false
  
  // 获取当前页面
  const currentPage = pages[pages.length - 1]
  
  // 检查URL参数
  if (currentPage && currentPage.$vm) {
    // @ts-ignore
    const query = currentPage.options || {}
    console.log('页面参数:', query)
    
    if (query.from === 'withdraw') {
      isFromWithdraw.value = true
      console.log('通过URL参数检测到来自提现页面，启用选择模式')
    }
  }
  
  // 如果URL参数检测失败，尝试通过页面栈检测
  if (!isFromWithdraw.value) {
    // 获取上一个页面
    const prevPage = pages.length > 1 ? pages[pages.length - 2] : null
    
    if (prevPage) {
      const prevRoute = prevPage.route || ''
      console.log('上一页面路由:', prevRoute)
      
      // 更全面的检测逻辑
      if (
        prevRoute.includes('withdraw') || 
        prevRoute.includes('my/withdraw') || 
        (prevPage.$vm && prevPage.$vm.$options && 
         prevPage.$vm.$options.name === 'withdraw')
      ) {
        isFromWithdraw.value = true
        console.log('通过页面栈检测到来自提现页面，启用选择模式')
      } else {
        console.log('非来自提现页面，路由:', prevRoute)
      }
    } else {
      console.log('无法获取上一页面信息或直接进入本页面')
    }
  }
  
  // 临时调试：强制启用选择模式
  if (!isFromWithdraw.value) {
    // isFromWithdraw.value = true
    // console.log('强制启用选择模式(测试用)')
  }

  await fetchBankCardStatus()
  // 无论是否已激活，都获取银行卡列表
    await fetchBankCards()
    
    // 如果是从提现页面进入，检查是否有默认选中的银行卡
    if (isFromWithdraw.value && cards.value.length > 0) {
      // 获取当前页面栈
      const pages = getCurrentPages()
      const prevPage = pages.length > 1 ? pages[pages.length - 2] : null
      
      if (prevPage && prevPage.$vm) {
        // 尝试获取提现页面的选中银行卡ID
        try {
          // @ts-ignore
          const withdrawBankCardId = prevPage.$vm.bankCardId
          if (withdrawBankCardId) {
            selectedCardId.value = withdrawBankCardId
            console.log('从提现页面获取到选中的银行卡ID:', withdrawBankCardId)
          } else {
            // 如果没有选中的银行卡，默认选中默认卡或第一张卡
            const defaultCard = cards.value.find(card => card.is_default)
            if (defaultCard) {
              selectedCardId.value = defaultCard.id
              console.log('默认选中默认银行卡:', defaultCard.id)
            } else {
              selectedCardId.value = cards.value[0].id
              console.log('默认选中第一张银行卡:', cards.value[0].id)
            }
          }
        } catch (error) {
          console.error('获取提现页面选中银行卡ID失败:', error)
          // 默认选中默认卡或第一张卡
          const defaultCard = cards.value.find(card => card.is_default)
          if (defaultCard) {
            selectedCardId.value = defaultCard.id
          } else if (cards.value.length > 0) {
            selectedCardId.value = cards.value[0].id
        }
      }
    }
  }

  // 添加事件监听器，用于从申请页面返回时刷新数据
  uni.$on('refresh-bank-cards', refreshData)
})

// 在页面卸载时移除事件监听器
onUnmounted(() => {
  uni.$off('refresh-bank-cards', refreshData)
})

// 选择银行卡并返回提现页面
const selectCardForWithdraw = (card: IBankCard) => {
  try {
    console.log('选择银行卡:', card)
    
    // 更新选中的银行卡ID
    selectedCardId.value = card.id
    
    // 使用Pinia store存储选中的银行卡
    bankCardStore.setSelectedBankCard(card)
    
    // 如果是从提现页面进入，显示提示并返回
    if (isFromWithdraw.value) {
      uni.showToast({
        title: '已选择银行卡',
        icon: 'success',
        duration: 1500
      })
      
      // 延迟返回，让用户看到提示
      setTimeout(() => {
        // 构建URL参数，包含必要的银行卡信息
        const params = {
          selectedCardId: card.id,
          withdrawType: 'bank', // 明确指定提现类型为银行卡
          isBankBalance: 'false', // 明确指定不是银行余额
          timestamp: new Date().getTime() // 添加时间戳避免缓存问题
        }
        
        // 将参数对象转换为URL查询字符串
        const queryString = Object.entries(params)
          .map(([key, value]) => `${key}=${encodeURIComponent(value)}`)
          .join('&')
        
        // 使用重定向方式返回提现页面，并携带参数
        uni.redirectTo({
          url: `/pages/my/withdraw?${queryString}`,
          success: () => {
            console.log('成功跳转到提现页面，并传递了参数:', params)
          },
          fail: (err) => {
            console.error('跳转提现页面失败:', err)
            // 如果跳转失败，尝试使用reLaunch
            uni.reLaunch({
              url: `/pages/my/withdraw?${queryString}`
            })
          }
        })
      }, 1500)
    } else {
      // 如果不是从提现页面进入，只显示选择成功提示
      uni.showToast({
        title: '已选择银行卡',
        icon: 'success',
        duration: 1500
      })
    }
  } catch (error) {
    console.error('选择银行卡失败:', error)
    uni.showToast({
      title: '选择失败',
      icon: 'none'
    })
  }
}

// 刷新数据函数
const refreshData = async () => {
  console.log('正在刷新银行卡数据...')
  await fetchBankCardStatus()
  // 无论是否已激活，都获取银行卡列表
    await fetchBankCards()
}

// 返回上一页
const goBack = () => {
  uni.navigateBack()
}

// 获取银行卡状态
const fetchBankCardStatus = async () => {
  loading.value = true
  try {
    const res = await getBankCardStatusAPI()
    if (res.status === 'success' && res.data) {
      // 获取响应中的data字段内容
      const statusData = res.data

      // 类型断言处理，因为实际返回的数据结构与接口定义不同
      const bankCardData = statusData as unknown as {
        has_bank_card: boolean
        bank_card_opened_at: string | null
        latest_application: null | {
          id: number
          status: string
          status_text: string
          created_at: string
          reviewed_at: string | null
          remarks: string | null
        }
        open_fee: string | number
        can_apply: boolean
      }

      // 确保从后端获取的open_fee是数字类型
      if (typeof bankCardData.open_fee === 'string') {
        bankCardData.open_fee = parseFloat(bankCardData.open_fee)
      }

      Object.assign(bankCardStatus, bankCardData)
      console.log('获取银行卡状态成功:', bankCardStatus)
    }
  } catch (error) {
    console.error('获取银行卡状态失败:', error)
    uni.showToast({
      title: '获取状态失败',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

// 获取银行卡列表
const fetchBankCards = async () => {
  loading.value = true
  try {
    const res = await getBankCardsAPI()
    if (res.status === 'success' && Array.isArray(res.data)) {
      cards.value = res.data
      console.log('获取银行卡列表成功:', cards.value)
    }
  } catch (error) {
    console.error('获取银行卡列表失败:', error)
    uni.showToast({
      title: '获取卡片失败',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

// 取消添加卡片
const cancelAddCard = () => {
  showAddCardForm.value = false
  // 清空表单
  newCard.value = {
    bank_name: '',
    card_number: '',
    card_holder: '',
    branch_name: '',
  }
}

// 保存卡片
const saveCard = async () => {
  // 表单验证
  if (!newCard.value.bank_name) {
    uni.showToast({
      title: '请输入银行名称',
      icon: 'none',
    })
    return
  }

  if (!newCard.value.card_holder) {
    uni.showToast({
      title: '请输入持卡人姓名',
      icon: 'none',
    })
    return
  }

  if (!newCard.value.card_number) {
    uni.showToast({
      title: '请输入银行卡号',
      icon: 'none',
    })
    return
  }

  if (newCard.value.card_number.length < 12) {
    uni.showToast({
      title: '银行卡号格式不正确',
      icon: 'none',
    })
    return
  }

  loading.value = true
  try {
    const res = await addBankCardAPI(newCard.value)
    console.log('添加银行卡响应:', res)

    // 添加成功
    uni.showToast({
      title: '添加成功',
      icon: 'success',
    })

    // 刷新卡片列表
    await fetchBankCards()

    // 清空表单并隐藏
    cancelAddCard()
  } catch (error: any) {
    console.error('添加银行卡失败:', error)

    // HTTP模块已经处理了错误提示，此处不需要额外显示错误信息
    // 在某些情况下，如果错误没有被拦截器处理，则显示默认错误信息
    if (error.hideErrorToast) {
      uni.showToast({
        title: '添加失败，请检查输入信息',
        icon: 'none',
      })
    }
  } finally {
    loading.value = false
  }
}

// 设置默认卡
const setAsDefault = async (id: number) => {
  loading.value = true
  try {
    const res = await setDefaultBankCardAPI(id)
    if (res.status === 'success') {
      uni.showToast({
        title: '已设为默认卡',
        icon: 'success',
      })

      // 刷新卡片列表
      await fetchBankCards()
    } else {
      uni.showToast({
        title: res.message || '设置失败',
        icon: 'none',
      })
    }
  } catch (error: any) {
    console.error('设置默认卡失败:', error)
    uni.showToast({
      title: error.message || '设置失败',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

// 确认删除卡片
const confirmDeleteCard = (id: number) => {
  uni.showModal({
    title: '确认删除',
    content: '确定要删除这张银行卡吗？',
    success: (res) => {
      if (res.confirm) {
        deleteCard(id)
      }
    },
  })
}

// 删除卡片
const deleteCard = async (id: number) => {
  loading.value = true
  try {
    const res = await deleteBankCardAPI(id)
    if (res.status === 'success') {
      uni.showToast({
        title: '删除成功',
        icon: 'success',
      })

      // 刷新卡片列表
      await fetchBankCards()
    } else {
      uni.showToast({
        title: res.message || '删除失败',
        icon: 'none',
      })
    }
  } catch (error: any) {
    console.error('删除银行卡失败:', error)
    uni.showToast({
      title: error.message || '删除失败',
      icon: 'none',
    })
  } finally {
    loading.value = false
  }
}

// 切换选择模式
const toggleSelectMode = () => {
  isFromWithdraw.value = !isFromWithdraw.value
}
</script>

<style lang="scss" scoped>
.container {
  width: 100%;
  background-color: #f5f5f5;
  min-height: 100vh;
  padding: 30rpx;
  padding-bottom: 160rpx; /* 为底部固定按钮留出空间 */
  box-sizing: border-box;
  position: relative; /* 为固定定位的元素提供参考 */
}

.card-top {
  width: 100%;
  border-radius: 20rpx;
  background-color: #6b7280;
  color: white;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-sizing: border-box;
}

.card-top-title {
  font-size: 32rpx;
  margin-bottom: 16rpx;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.card-balance {
  background-color: rgba(255, 255, 255, 0.2);
  padding: 20rpx;
  border-radius: 12rpx;
}

.balance-label {
  font-size: 24rpx;
  opacity: 0.8;
}

.balance-amount {
  font-size: 48rpx;
  margin-top: 4rpx;
  font-weight: 500;
}

.balance-card-info {
  margin-top: 12rpx;
  font-size: 24rpx;
}

.card-container {
  width: 100%;
}

/* 银行卡列表样式 */
.bank-card-list {
  margin-top: 40rpx;
  // padding: 0 30rpx;
}

.section-title {
  font-size: 32rpx;
  font-weight: 500;
  margin-bottom: 20rpx;
  color: #333;
}

.card-list {
  background-color: #fff;
  border-radius: 20rpx;
  padding: 20rpx 0;
  margin-bottom: 30rpx;
}

.empty-tip {
  padding: 60rpx 0;
  text-align: center;
  color: #999;
  font-size: 28rpx;
}

/* 银行卡样式 */
.visa-card {
  border-radius: 20rpx;
  padding: 40rpx;
  margin: 30rpx;
  color: #fff;
  box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.1);
  position: relative;
  height: 160rpx;
  display: flex;
  flex-direction: column;
  justify-content: space-between;
  overflow: hidden;
}

.card-watermark {
  position: absolute;
  top: 0;
  right: 0;
  width: 100%;
  height: 100%;
  opacity: 0.07;
  overflow: hidden;
  border-radius: 20rpx;
  pointer-events: none;
  z-index: 1;
  display: flex;
  justify-content: flex-end;
  align-items: center;
}

.card-watermark image {
  width: 120%;
  height: auto;
  transform: scale(2.2);
  filter: brightness(0) invert(1);
  margin-right: -25%;
  margin-bottom: -15%;
}

.card-bank-name {
  padding-left: 60rpx;
  vertical-align: middle;
  height: 40rpx;
  line-height: 40rpx;
  font-size: 30rpx;
  color: #ffffff;
  font-weight: bold;
  position: relative;
  z-index: 2;
}

.visa-number {
  padding-left: 60rpx;
  font-size: 40rpx;
  letter-spacing: 3rpx;
  color: #ffffff;
  position: relative;
  z-index: 2;
}

.card-icon {
  position: absolute;
  top: 30rpx;
  left: 30rpx;
  width: 60rpx;
  height: 60rpx;
  background-color: rgb(255, 255, 255, 0.5);
  border-radius: 50%;
  z-index: 2;
}

.selected-card {
  border: 3rpx solid #ffffff;
  box-shadow: 0 4rpx 16rpx rgba(255, 255, 255, 0.3);
  position: relative;
}

.selected-card::after {
  content: "✓";
  position: absolute;
  top: 15rpx;
  right: 15rpx;
  width: 40rpx;
  height: 40rpx;
  background-color: #ffffff;
  color: #3b82f6;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-weight: bold;
  font-size: 24rpx;
  z-index: 3;
}

.card-actions {
  display: flex;
  flex-direction: column;
  gap: 10rpx;
  position: relative;
  z-index: 2;
  margin-top: 20rpx;
}

.normal-actions {
  display: flex;
  justify-content: space-between;
  width: 100%;
}

.full-width {
  width: 100%;
}

.btn-default {
  width: 48%;
  padding: 10rpx 0;
  border-radius: 8rpx;
  border: none;
  background-color: rgba(255, 255, 255, 0.8);
  color: #3b82f6;
  font-size: 24rpx;
  text-align: center;
}

.btn-default:disabled {
  background-color: rgba(255, 255, 255, 0.5);
  color: #9ca3af;
}

.btn-delete {
  width: 48%;
  padding: 10rpx 0;
  border-radius: 8rpx;
  border: none;
  background-color: rgba(255, 255, 255, 0.8);
  color: #ef4444;
  font-size: 24rpx;
  text-align: center;
}

.add-card-btn {
  display: flex;
  align-items: center;
  background-color: #fff;
  padding: 30rpx;
  border-radius: 20rpx;
  position: relative;
  margin-top: 40rpx;
  width: 100%;
  justify-content: center;
  border: none;
  font-size: 32rpx;
  color: #6b7280;
}

.card-form {
  background-color: white;
  border-radius: 16rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
}

.form-title {
  font-size: 32rpx;
  text-align: center;
  margin-bottom: 20rpx;
  font-weight: bold;
}

.form-group {
  margin-bottom: 20rpx;
}

.form-label {
  display: block;
  color: #4b5563;
  margin-bottom: 6rpx;
  font-size: 24rpx;
}

.form-input {
  width: 100%;
  border: 2rpx solid #e5e7eb;
  border-radius: 8rpx;
  padding: 12rpx 16rpx;
  background-color: #ffffff;
  font-size: 28rpx;
  box-sizing: border-box;
  height: 80rpx;
  color: #333333;
}

.input-placeholder {
  color: #9ca3af;
  font-size: 28rpx;
}

.form-actions {
  display: flex;
  justify-content: space-between;
  margin-top: 30rpx;
}

.btn-cancel {
  width: 45%;
  padding: 12rpx 0;
  background-color: #e5e7eb;
  border: none;
  border-radius: 12rpx;
  color: #4b5563;
  font-size: 28rpx;
  text-align: center;
}

.btn-save {
  width: 45%;
  padding: 12rpx 0;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
  text-align: center;
}

.activation-status {
  font-size: 24rpx;
  opacity: 0.8;
}

.status-processing {
  color: #f59e0b;
}

/* 审核中状态提示样式 */
.review-status {
  width: 100%;
  background-color: white;
  border-radius: 20rpx;
  padding: 30rpx;
  margin-bottom: 30rpx;
  box-sizing: border-box;
  text-align: center;
}

.review-icon {
  font-size: 60rpx;
  color: #f59e0b;
  margin-bottom: 16rpx;
}

.review-title {
  font-size: 32rpx;
  font-weight: bold;
  margin-bottom: 16rpx;
}

.review-desc {
  font-size: 26rpx;
  color: #6b7280;
  line-height: 1.6;
}

.review-time {
  display: block;
  color: #f59e0b;
  margin-top: 8rpx;
}

/* 图标字体 */
.iconfont {
  font-family: 'iconfont' !important;
}
.icon-time:before {
  content: '\e65f';
}

/* 底部固定按钮区域 */
.fixed-bottom-buttons {
  position: fixed;
  bottom: 0;
  left: 0;
  width: 100%;
  padding: 30rpx;
  background-color: #f5f5f5;
  box-sizing: border-box;
  z-index: 100;
  box-shadow: 0 -2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.return-btn {
  width: 100%;
  padding: 12rpx 0;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
  text-align: center;
}

.debug-btn {
  width: 100%;
  padding: 12rpx 0;
  background-color: #3b82f6;
  color: white;
  border: none;
  border-radius: 12rpx;
  font-size: 28rpx;
  text-align: center;
}

/* 内容占位，确保底部按钮不会覆盖内容 */
.content-spacer {
  height: 100rpx; /* 与底部按钮高度匹配 */
}

/* 银行选择器样式 */
.bank-selector {
  position: relative;
  width: 100%;
}

.bank-search-input {
  position: relative;
  width: 100%;
}

.search-icon {
  position: absolute;
  right: 20rpx;
  top: 50%;
  transform: translateY(-50%);
  color: #999;
  font-size: 28rpx;
}

.bank-dropdown {
  position: absolute;
  top: 100%;
  left: 0;
  width: 100%;
  background-color: #fff;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.1);
  z-index: 999;
  margin-top: 8rpx;
  max-height: 300rpx;
  overflow-y: auto;
}

.bank-item {
  display: flex;
  align-items: center;
  padding: 20rpx;
  border-bottom: 2rpx solid #f5f5f5;
}

.bank-item:last-child {
  border-bottom: none;
}

.bank-item:active {
  background-color: #f9f9f9;
}

.bank-icon {
  width: 40rpx;
  height: 40rpx;
  margin-right: 16rpx;
}

.bank-name {
  font-size: 28rpx;
  color: #333;
}

.empty-tip {
  padding: 30rpx;
  text-align: center;
  color: #999;
  font-size: 28rpx;
}
</style>
