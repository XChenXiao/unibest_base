<route lang="json5" type="page">
{
  style: {
    navigationBarTitleText: '平台公告',
  },
}
</route>

<template>
  <view class="announcements-container">
    <z-paging
      ref="paging"
      v-model="announcementList"
      @query="queryAnnouncements"
      :default-page-size="10"
      auto-show-back-to-top
      refresher-enabled
    >
      <!-- 公告列表 -->
      <view class="announcement-list">
        <!-- 空状态展示 -->
        <view v-if="announcementList.length === 0 && !loading" class="empty-state">
          <wd-icon name="warning-outline" size="80rpx" color="#cccccc" />
          <text class="empty-text">暂无公告</text>
        </view>
        
        <!-- 公告项目 -->
        <view 
          v-for="item in announcementList" 
          :key="item.id" 
          class="announcement-item"
          @click="navigateToDetail(item.id)"
        >
          <view class="item-header">
            <text class="item-title">{{ item.title }}</text>
            <view class="item-status" v-if="!item.is_read">
              <view class="unread-dot"></view>
            </view>
          </view>
          <view class="item-content">{{ truncateContent(item.content) }}</view>
          <view class="item-footer">
            <text class="item-time">{{ formatDate(item.created_at) }}</text>
          </view>
        </view>
      </view>
    </z-paging>
  </view>
</template>

<script lang="ts" setup>
import { ref, onMounted } from 'vue';
// 移除直接引入API_URL
// import { API_URL } from '@/config/api';

// 引入封装好的公告API服务
import { getAnnouncementsAPI } from '@/service/index/message';

// 定义接口类型
interface AnnouncementItem {
  id: number;
  title: string;
  content: string;
  is_read: boolean;
  created_at: string;
  user_id: number | null;
  is_system: boolean;
}

// 定义数据
const paging = ref(null);
const loading = ref(false);
const announcementList = ref<AnnouncementItem[]>([]);

// 请求公告数据
const queryAnnouncements = async (pageNo: number, pageSize: number) => {
  loading.value = true;
  try {
    // 使用封装好的API服务替代直接调用uni.request
    const result = await getAnnouncementsAPI(pageNo, pageSize);
    
    if (result && result.status === 'success') {
      const responseData = result.data;
      const announcements = responseData.data || [];
      const total = responseData.total || 0;
      
      // 通知z-paging组件完成加载，传入当前页数据和总数
      paging.value.complete(announcements, {
        total: total,
        noMore: responseData.current_page >= responseData.last_page
      });
    } else {
      // 获取数据失败
      paging.value.complete(false);
    }
  } catch (error) {
    console.error('获取公告列表失败:', error);
    paging.value.complete(false);
  } finally {
    loading.value = false;
  }
};

// 截断公告内容
const truncateContent = (content: string): string => {
  if (!content) return '';
  
  // 移除HTML标签
  const plainText = content.replace(/<[^>]*>/g, '');
  
  if (plainText.length > 50) {
    return plainText.substring(0, 50) + '...';
  }
  return plainText;
};

// 格式化日期
const formatDate = (dateString: string): string => {
  if (!dateString) return '';
  
  const date = new Date(dateString);
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  
  return `${year}-${month}-${day}`;
};

// 跳转到公告详情
const navigateToDetail = (id: number): void => {
  console.log('点击跳转公告详情，ID:', id);
  
  // 确保ID存在且有效
  if (!id) {
    uni.showToast({
      title: '无效的公告ID',
      icon: 'none'
    });
    return;
  }
  
  // 将ID存储到本地，作为备用方案
  uni.setStorageSync('announcement_params', { id });
  
  // 跳转到详情页
  uni.navigateTo({
    url: `/pages/my/announcement-detail?id=${id}`,
    success: () => {
      console.log('导航到公告详情成功');
    },
    fail: (err) => {
      console.error('导航到公告详情失败:', err);
      // 失败后尝试另一种方式
      setTimeout(() => {
        uni.navigateTo({
          url: `/pages/my/announcement-detail?id=${id}`
        });
      }, 200);
    }
  });
};

// 页面加载时
onMounted(() => {
  // 初始化加载数据
  if (paging.value) {
    paging.value.reload();
  }
});
</script>

<style lang="scss" scoped>
.announcements-container {
  min-height: 100vh;
  background-color: #f5f5f5;
}

.announcement-list {
  padding: 16rpx;
}

.empty-state {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  margin-top: 200rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
  margin-top: 16rpx;
}

.announcement-item {
  background-color: #ffffff;
  border-radius: 12rpx;
  padding: 24rpx;
  margin-bottom: 20rpx;
  box-shadow: 0 2rpx 10rpx rgba(0, 0, 0, 0.05);
}

.item-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 16rpx;
}

.item-title {
  font-size: 32rpx;
  font-weight: bold;
  color: #333;
  flex: 1;
}

.item-status {
  display: flex;
  align-items: center;
}

.unread-dot {
  width: 16rpx;
  height: 16rpx;
  border-radius: 50%;
  background-color: #ff4d4f;
}

.item-content {
  font-size: 28rpx;
  color: #666;
  line-height: 1.5;
  margin-bottom: 16rpx;
}

.item-footer {
  display: flex;
  justify-content: flex-end;
}

.item-time {
  font-size: 24rpx;
  color: #999;
}
</style> 