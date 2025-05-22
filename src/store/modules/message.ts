import { defineStore } from 'pinia'
import { ref } from 'vue'
import { useUserStore } from './user'

// 消息通知接口
export interface IMessageInfo {
  unread_count: number
  personal_unread: number
  global_unread: number
}

// 初始消息信息状态
const initMessageInfo: IMessageInfo = {
  unread_count: 0,
  personal_unread: 0,
  global_unread: 0,
}

export const useMessageStore = defineStore(
  'message',
  () => {
    // 消息信息
    const messageInfo = ref<IMessageInfo>({ ...initMessageInfo })

    // 清除消息信息
    const clearMessageInfo = () => {
      messageInfo.value = { ...initMessageInfo }
    }

    // 获取未读消息数量 - 由于简化处理，这里只设置默认值
    const fetchUnreadMessageCount = async () => {
      const userStore = useUserStore()
      if (!userStore.userInfo.token) {
        return false
      }

      // 直接设置默认值，不再调用API
      messageInfo.value = {
        unread_count: 0,
        personal_unread: 0,
        global_unread: 0,
      }
      return true
    }

    return {
      messageInfo,
      clearMessageInfo,
      fetchUnreadMessageCount,
    }
  },
  {
    persist: true,
  },
)
