import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getDepositTipsAPI, IDepositTip } from '@/service/index/bankcard'

export const useDepositTipsStore = defineStore('depositTips', () => {
  // 预存金额提示数据
  const depositTips = ref<IDepositTip[]>([])

  // 是否已获取过数据
  const hasFetched = ref(false)

  // 是否正在加载
  const loading = ref(false)

  // 获取预存金额提示
  const fetchDepositTips = async (force = false) => {
    // 如果已经获取过且不强制刷新，直接返回
    if (hasFetched.value && !force) {
      return depositTips.value
    }

    // 如果正在加载，避免重复请求
    if (loading.value) {
      return depositTips.value
    }

    loading.value = true

    try {
      console.log('开始获取预存金额提示')
      const res = await getDepositTipsAPI()

      if (res && typeof res === 'object' && 'status' in res && res.status === 'success') {
        const data = res.data
        if (data && typeof data === 'object' && 'deposit_tips' in data) {
          depositTips.value = Array.isArray(data.deposit_tips) ? data.deposit_tips : []
          hasFetched.value = true
          console.log('获取预存金额提示成功:', depositTips.value.length, '条')
        }
      }
    } catch (error) {
      console.error('获取预存金额提示失败:', error)
      // 出错时确保数组为空
      depositTips.value = []
    } finally {
      loading.value = false
    }

    return depositTips.value
  }

  // 清除数据
  const clearDepositTips = () => {
    depositTips.value = []
    hasFetched.value = false
    loading.value = false
  }

  // 获取激活的提示（已排序）
  const getActiveDepositTips = () => {
    return depositTips.value
      .filter((tip) => tip.is_active)
      .sort((a, b) => a.sort_order - b.sort_order)
  }

  return {
    depositTips,
    hasFetched,
    loading,
    fetchDepositTips,
    clearDepositTips,
    getActiveDepositTips,
  }
})
