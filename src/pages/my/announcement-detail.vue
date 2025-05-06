<route lang="json5" type="page">
{
  style: {
    navigationBarTitleText: '公告详情',
  },
}
</route>

<template>
  <view class="announcement-detail-container">
    <!-- 加载状态 -->
    <view v-if="loading" class="loading">
      <text class="loading-text">加载中...</text>
    </view>
    
    <!-- 公告内容 -->
    <block v-else-if="announcement">
      <view class="detail-header">
        <text class="detail-title">{{ announcement.title }}</text>
        <text class="detail-time">{{ formatDate(announcement.created_at) }}</text>
      </view>
      <view class="detail-content">
        <!-- 使用rich-text渲染HTML内容 -->
        <rich-text :nodes="processContent(announcement.content)" class="content-text"></rich-text>
      </view>
    </block>
    
    <!-- 错误状态 -->
    <view v-else class="error-state">
      <wd-icon name="warn" size="80rpx" color="#ff4d4f" />
      <text class="error-text">{{ error || '公告不存在或已删除' }}</text>
      <button class="back-btn" @click="goBack">返回公告列表</button>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
import { API_URL } from '@/config/api';

// 定义类型
interface Announcement {
  id: number;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
  read_at: string | null;
  is_system: boolean;
}

// 页面参数
const announcementId = ref<number>(0);
// 数据状态
const loading = ref<boolean>(true);
const error = ref<string>('');
const announcement = ref<Announcement | null>(null);

// 获取公告详情
const fetchAnnouncementDetail = async () => {
  if (!announcementId.value) {
    error.value = '缺少公告ID参数';
    loading.value = false;
    return;
  }
  
  console.log('正在请求公告详情，ID:', announcementId.value);
  
  try {
    // 使用Promise方式处理请求，避免使用解构赋值导致的问题
    const response = await new Promise((resolve, reject) => {
      uni.request({
        url: `${API_URL}/api/messages/${announcementId.value}`,
        method: 'GET',
        success: (res) => {
          console.log('获取公告详情成功:', res);
          resolve(res);
        },
        fail: (err) => {
          console.error('获取公告详情失败:', err);
          reject(err);
        }
      });
    });
    
    // 直接使用response的data属性
    const res = response as any;
    
    if (res && res.data && res.data.status === 'success') {
      announcement.value = res.data.data;
      
      // 如果消息未读，则标记为已读
      if (announcement.value && !announcement.value.is_read) {
        markAsRead(announcementId.value);
      }
    } else {
      error.value = '公告不存在或已删除';
    }
  } catch (e) {
    console.error('获取公告详情异常:', e);
    error.value = '获取公告详情失败';
  } finally {
    loading.value = false;
  }
};

// 标记消息为已读
const markAsRead = async (id: number) => {
  try {
    await new Promise((resolve, reject) => {
      uni.request({
        url: `${API_URL}/api/messages/${id}/read`,
        method: 'POST',
        success: (res) => {
          console.log('标记公告已读成功:', res);
          resolve(res);
        },
        fail: (err) => {
          console.error('标记公告已读失败:', err);
          reject(err);
        }
      });
    });
    
    // 更新未读公告状态
    uni.$emit('refresh_unread_announcements');
  } catch (e) {
    console.error('标记公告已读失败:', e);
  }
};

// 处理内容，处理可能的HTML内容
const processContent = (content: string): string => {
  if (!content) return '';
  
  // 确保内容是有效的HTML
  if (content.startsWith('<') && content.includes('</')) {
    return content;
  }
  
  // 如果是纯文本，转换为HTML段落
  return `<p>${content.replace(/\n/g, '<br>')}</p>`;
};

// 格式化日期
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  const hour = String(date.getHours()).padStart(2, '0');
  const minute = String(date.getMinutes()).padStart(2, '0');
  
  return `${year}-${month}-${day} ${hour}:${minute}`;
};

// 返回上一页
const goBack = () => {
  uni.navigateBack();
};

// 页面加载
onMounted(() => {
  try {
    // 尝试获取页面参数
    const query = uni.getEnterOptionsSync()?.query || {};
    const id = Number(query.id || 0);
    
    announcementId.value = id;
    
    console.log('公告详情页获取ID:', announcementId.value, '原始参数:', query);
    
    // 获取公告详情
    if (announcementId.value) {
      fetchAnnouncementDetail();
    } else {
      error.value = '缺少公告ID参数';
      loading.value = false;
    }
  } catch (err) {
    console.error('参数获取异常:', err);
    error.value = '参数获取异常';
    loading.value = false;
  }
});
</script>

<style lang="scss" scoped>
.announcement-detail-container {
  padding: 30rpx;
  min-height: 100vh;
  background-color: #ffffff;
}

.loading {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 400rpx;
}

.loading-text {
  font-size: 28rpx;
  color: #999;
  margin-top: 20rpx;
}

.detail-header {
  margin-bottom: 40rpx;
  border-bottom: 1px solid #f0f0f0;
  padding-bottom: 20rpx;
}

.detail-title {
  font-size: 36rpx;
  font-weight: bold;
  color: #333;
  margin-bottom: 16rpx;
  display: block;
}

.detail-time {
  font-size: 24rpx;
  color: #999;
  display: block;
}

.detail-content {
  padding-bottom: 60rpx;
}

.content-text {
  font-size: 30rpx;
  color: #333;
  line-height: 1.8;
  text-align: justify;
}

.error-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  height: 600rpx;
}

.error-text {
  font-size: 30rpx;
  color: #666;
  margin: 30rpx 0;
}

.back-btn {
  margin-top: 20rpx;
  background-color: #2979ff;
  color: #fff;
  font-size: 28rpx;
  padding: 16rpx 40rpx;
  border-radius: 40rpx;
}
</style> 