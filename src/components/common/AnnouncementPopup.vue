<template>
  <wd-popup
    v-model="showPopup"
    round
    closeable
    position="center"
    :close-on-click-overlay="false"
    class="announcement-popup"
    :style="{ zIndex: 9000 }"
    modal-style="z-index: 9000;"
  >
    <view class="popup-content">
      <!-- 标题 -->
      <view class="popup-header">
        <text class="popup-title">{{ announcement.title || '平台公告' }}</text>
        <text class="popup-time" v-if="announcement.created_at">
          {{ formatDate(announcement.created_at) }}
        </text>
      </view>

      <!-- 内容 -->
      <scroll-view class="popup-body" scroll-y :scroll-x="false">
        <rich-text
          v-if="announcement.content"
          :nodes="processContent(announcement.content)"
          class="announcement-text"
        ></rich-text>
        <view v-else class="loading-content">
          <text v-if="loading">加载中...</text>
          <text v-else>{{ error || '暂无公告内容' }}</text>
        </view>
      </scroll-view>

      <!-- 底部按钮 -->
      <view class="popup-footer">
        <view style="display: flex; justify-content: space-around; align-items: center">
          <button class="close-btn" @click="closePopup">关闭</button>
          <button class="detail-btn" @click="goToAnnouncementDetail" v-if="announcement.id">
            查看详情
          </button>
        </view>
        <!-- <view class="checkbox-container" @click="toggleRemember">
          <wd-checkbox v-model="dontShowAgain"></wd-checkbox>
          <text class="checkbox-label">不再显示</text>
        </view> -->
      </view>
    </view>
  </wd-popup>
</template>

<script lang="ts" setup>
import { ref, computed, watch, onMounted, onUnmounted } from 'vue'
import { getLatestAnnouncementAPI, markAnnouncementAsReadAPI } from '@/service/index/message'

// 定义属性
const props = defineProps({
  modelValue: {
    type: Boolean,
    default: false,
  },
  externalAnnouncement: {
    type: Object as () => Announcement | null,
    default: null,
  },
})

// 定义事件
const emit = defineEmits(['update:modelValue', 'close'])

// 内部状态
const showPopup = computed({
  get: () => props.modelValue,
  set: (val) => emit('update:modelValue', val),
})

// 公告信息
interface Announcement {
  id: number
  title: string
  content: string
  created_at: string
  is_read: boolean
  is_system: boolean
  message_type: string
}

// 数据状态
const announcement = ref<Announcement>({} as Announcement)
const loading = ref(true)
const error = ref('')
const dontShowAgain = ref(false)

// 获取最新公告
const fetchLatestAnnouncement = async () => {
  // 如果已提供外部公告数据，则直接使用而不发送请求
  if (props.externalAnnouncement) {
    announcement.value = props.externalAnnouncement
    loading.value = false

    // 自动标记为已读
    if (announcement.value.id && !announcement.value.is_read) {
      await markAsRead(announcement.value.id)
    }
    return
  }

  loading.value = true
  error.value = ''

  try {
    const result = await getLatestAnnouncementAPI()

    if (result.status === 'success' && result.data) {
      announcement.value = result.data

      // 自动标记为已读
      if (announcement.value.id && !announcement.value.is_read) {
        await markAsRead(announcement.value.id)
      }
    } else {
      error.value = '暂无公告'
      closePopup()
    }
  } catch (e) {
    console.error('获取最新公告失败:', e)
    error.value = '获取公告失败'
    closePopup()
  } finally {
    loading.value = false
  }
}

// 标记消息为已读
const markAsRead = async (id: number) => {
  try {
    await markAnnouncementAsReadAPI(id)

    // 更新未读公告状态
    uni.$emit('refresh_unread_announcements')
  } catch (e) {
    console.error('标记公告已读失败:', e)
  }
}

// 处理内容，处理可能的HTML内容
const processContent = (content: string): string => {
  if (!content) return ''

  // 确保内容是有效的HTML
  if (content.startsWith('<') && content.includes('</')) {
    return content
  }

  // 如果是纯文本，转换为HTML段落
  return `<p>${content.replace(/\n/g, '<br>')}</p>`
}

// 格式化日期
const formatDate = (dateString: string): string => {
  if (!dateString) return ''

  const date = new Date(dateString)
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')

  return `${year}-${month}-${day}`
}

// 切换"不再显示"选项
const toggleRemember = () => {
  dontShowAgain.value = !dontShowAgain.value
}

// 关闭弹窗
const closePopup = () => {
  showPopup.value = false
  emit('close', { dontShowAgain: dontShowAgain.value })
}

// 跳转到公告详情页
const goToAnnouncementDetail = () => {
  if (!announcement.value.id) return

  // 存储公告ID到本地存储
  uni.setStorageSync('announcement_params', { id: announcement.value.id })

  // 跳转到详情页
  uni.navigateTo({
    url: `/pages/my/announcement-detail?id=${announcement.value.id}`,
    success: () => {
      // 跳转成功后关闭弹窗
      showPopup.value = false
    },
  })
}

// 组件挂载时获取最新公告
onMounted(() => {
  if (showPopup.value) {
    fetchLatestAnnouncement()
  }
})

// 组件卸载时不进行任何操作
onUnmounted(() => {
  // 不做任何操作，确保每次进入首页都显示公告
})

// 监听弹窗显示状态
watch(
  () => showPopup.value,
  (newVal) => {
    if (newVal) {
      fetchLatestAnnouncement()
    }
  },
)

// 监听外部公告数据变化
watch(
  () => props.externalAnnouncement,
  (newVal) => {
    if (newVal) {
      announcement.value = newVal
      loading.value = false

      // 自动标记为已读
      if (announcement.value.id && !announcement.value.is_read) {
        markAsRead(announcement.value.id)
      }
    }
  },
  { immediate: true },
)
</script>

<style lang="scss" scoped>
.announcement-popup {
  max-height: 80vh;
  border-radius: 20rpx;
  overflow: hidden;
  z-index: 9000 !important; /* 降低公告弹窗层级 */
}

:deep(.wd-popup),
:deep(.wd-popup__content) {
  z-index: 9000 !important;
}

.popup-content {
  display: flex;
  flex-direction: column;
  max-height: 80vh;
  width: 600rpx;
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
  margin-bottom: 10rpx;
  display: block;
}

.popup-time {
  font-size: 24rpx;
  color: #999;
  display: block;
}

.popup-body {
  padding: 30rpx;
  max-height: 60vh;
  flex: 1;
  width: 100%;
  box-sizing: border-box;
  overflow-x: hidden;
}

.announcement-text {
  font-size: 30rpx;
  color: #333;
  line-height: 1.6;
  width: 100%;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-all;
}

:deep(.announcement-text) {
  max-width: 100%;

  img,
  video,
  table {
    max-width: 100% !important;
    height: auto !important;
  }

  * {
    max-width: 100% !important;
    box-sizing: border-box;
  }
}

.loading-content {
  display: flex;
  justify-content: center;
  align-items: center;
  height: 200rpx;
  color: #999;
  font-size: 28rpx;
}

.popup-footer {
  padding: 20rpx 30rpx 30rpx;
  display: flex;
  flex-direction: column;
  border-top: 1px solid #f0f0f0;
  width: 100%;
  box-sizing: border-box;
}

.checkbox-container {
  display: flex;
  align-items: center;
  margin-top: 20rpx;
}

.checkbox-label {
  font-size: 26rpx;
  color: #666;
  margin-left: 10rpx;
}

.close-btn,
.detail-btn {
  min-width: 160rpx;
  height: 70rpx;
  line-height: 70rpx;
  font-size: 28rpx;
  margin: 0;
  padding: 0 30rpx;
}

.close-btn {
  background-color: #f5f5f5;
  color: #666;
}

.detail-btn {
  background-color: #007aff;
  color: #fff;
  margin-left: 20rpx;
}
</style>
