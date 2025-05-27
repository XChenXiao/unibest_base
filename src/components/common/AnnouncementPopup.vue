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
        <!-- 隐藏时间显示 -->
        <!-- <text class="popup-time" v-if="announcement.created_at">
          {{ formatDate(announcement.created_at) }}
        </text> -->
      </view>

      <!-- 内容 -->
      <view class="popup-body">
        <rich-text
          v-if="announcement.content"
          :nodes="processContent(announcement.content)"
          class="announcement-text"
        ></rich-text>
        <view v-else class="loading-content">
          <text v-if="loading">加载中...</text>
          <text v-else>{{ error || '暂无公告内容' }}</text>
        </view>
      </view>

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
    console.log('使用外部传入的公告数据:', props.externalAnnouncement)
    announcement.value = props.externalAnnouncement
    loading.value = false
    return
  }

  console.log('开始请求最新公告数据')
  loading.value = true
  error.value = ''

  try {
    const result = await getLatestAnnouncementAPI()
    console.log('公告API请求完成', result)

    if (result.status === 'success' && result.data) {
      announcement.value = result.data
      console.log('成功获取公告数据')
    } else {
      error.value = '暂无公告'
      console.log('没有可显示的公告')
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

// 组件挂载时不自动获取公告，因为已经从外部传入
onMounted(() => {
  console.log('公告弹窗组件已挂载')
})

// 组件卸载时不进行任何操作
onUnmounted(() => {
  // 不做任何操作，确保每次进入首页都显示公告
})

// 监听弹窗显示状态，但只有在没有外部传入公告数据时才请求
watch(
  () => showPopup.value,
  (newVal) => {
    if (newVal) {
      console.log('弹窗显示状态变化:', newVal, '外部公告数据:', !!props.externalAnnouncement)
      if (!props.externalAnnouncement) {
        console.log('弹窗显示时获取公告，无外部数据')
        fetchLatestAnnouncement()
      } else {
        console.log('弹窗显示时使用外部传入的公告数据，不发送请求')
        // 确保使用外部数据
        if (props.externalAnnouncement) {
          console.log('确保使用最新的外部公告数据')
          announcement.value = props.externalAnnouncement
          loading.value = false
        }
      }
    }
  },
)

// 监听外部公告数据变化
watch(
  () => props.externalAnnouncement,
  (newVal) => {
    if (newVal) {
      console.log('外部公告数据变化，使用新数据:', newVal)
      announcement.value = newVal
      loading.value = false
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

/* 确保弹窗内容不会超出屏幕 */
:deep(.wd-popup__content) {
  max-height: 80vh !important;
  overflow: hidden !important;
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
  flex-shrink: 0;
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
  flex: 1;
  width: 100%;
  overflow-x: hidden;
  overflow-y: auto;
  box-sizing: border-box;
  /* 计算可用高度：80vh - 头部高度 - 底部按钮高度 */
  max-height: calc(80vh - 120rpx - 140rpx);
}

.announcement-text {
  font-size: 30rpx;
  color: #333;
  line-height: 1.6;
  width: 100%;
  overflow-wrap: break-word;
  word-wrap: break-word;
  word-break: break-all;
  /* 添加适当的底部间距，确保内容不会紧贴按钮 */
  margin-bottom: 20rpx;
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
  min-height: 200rpx;
  color: #999;
  font-size: 28rpx;
  padding: 40rpx 0;
}

.popup-footer {
  padding: 20rpx 30rpx 30rpx;
  display: flex;
  flex-direction: column;
  border-top: 1px solid #f0f0f0;
  width: 100%;
  box-sizing: border-box;
  flex-shrink: 0;
  background-color: #fff;
  /* 确保按钮区域固定在底部 */
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
