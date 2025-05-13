<route lang="json5">
{
  style: {
    navigationBarTitleText: '我的团队',
    navigationBarBackgroundColor: '#3498db',
    navigationBarTextStyle: 'white',
  },
}
</route>

<template>
  <view class="team-container">
    <!-- 加载状态 -->
    <view class="loading-container" v-if="loading">
      <view class="loading-spinner"></view>
    </view>

    <view v-else>
      <!-- 我的上级信息 -->
      <view class="referrer-card" v-if="teamInfo.referrer_name && teamInfo.referrer_name !== '无'">
        <view class="referrer-title">我的上级</view>
        <view class="referrer-content">
          <view class="referrer-avatar">
            <image src="/static/images/avatar-placeholder.png" mode="aspectFill"></image>
          </view>
          <view class="referrer-info">
            <view class="referrer-name">{{ teamInfo.referrer_name }}</view>
            <view class="referrer-status">邀请我加入</view>
          </view>
        </view>
      </view>

      <!-- 顶部导航选项卡 -->
      <view class="nav-tabs">
        <view
          v-for="(tab, index) in tabs"
          :key="index"
          class="nav-tab-item"
          :class="{ active: activeTabIndex === index }"
          @click="handleTabChange(index)"
        >
          {{ tab.name }}
        </view>
      </view>

      <!-- 团队信息统计卡片 -->
      <view class="team-stats">
        <view class="stats-card">
          <view class="stats-item">
            <view class="stats-value">{{ teamInfo.total_invited_users || 0 }}</view>
            <view class="stats-label">邀请人数</view>
          </view>
          <view class="stats-item">
            <view class="stats-value">{{ teamInfo.total_invited_users || 0 }}</view>
            <view class="stats-label">成功注册</view>
          </view>
          <view class="stats-item">
            <view class="stats-value">{{ teamInfo.verified_invited_users || 0 }}</view>
            <view class="stats-label">实名认证</view>
          </view>
        </view>
      </view>

      <!-- 邀请码信息 -->
      <!-- <view class="invite-code-box">
        <view class="invite-code-title">我的邀请码</view>
        <view class="invite-code-content">
          <text class="invite-code">{{ teamInfo.invite_code || '-' }}</text>
          <view class="copy-btn" @click="copyInviteCode">复制</view>
        </view>
        <view class="invite-btn" 
          :class="{ 'invite-btn-disabled': !userStore.isVerified }"
          @click="userStore.isVerified ? navigateToInvitePoster() : showVerifyTip()">
          <text class="invite-btn-text">{{ userStore.isVerified ? '邀请好友' : '请先实名' }}</text>
        </view>
      </view> -->

      <!-- 团队列表 -->
      <view class="team-list">
        <view class="list-title">{{ tabs[activeTabIndex].name }}</view>

        <view v-if="invitedUsers.list.length === 0" class="empty-list">
          <image src="/static/images/empty-list.png" mode="aspectFit"></image>
          <view class="empty-text">暂无{{ tabs[activeTabIndex].name }}记录</view>
        </view>

        <view v-else class="member-list">
          <view v-for="(member, index) in invitedUsers.list" :key="index" class="member-item">
            <view class="member-avatar">
              <image src="/static/images/avatar-placeholder.png" mode="aspectFill"></image>
            </view>
            <view class="member-info">
              <view class="member-name">
                {{
                  member.is_verified
                    ? member.name
                    : member.phone.substr(0, 3) + '****' + member.phone.substr(-4)
                }}
              </view>
              <view class="member-time">
                {{
                  member.is_verified
                    ? '认证时间: ' + (member.verified_at || '未知')
                    : '注册时间: ' + member.registered_at
                }}
              </view>
            </view>
            <view class="member-status" :class="{ verified: member.is_verified }">
              {{ member.is_verified ? '已实名' : '未实名' }}
            </view>
          </view>
        </view>

        <!-- 加载更多 -->
        <view
          v-if="invitedUsers.list.length > 0 && invitedUsers.list.length < invitedUsers.total"
          class="load-more"
          @click="loadMore"
        >
          加载更多
        </view>
      </view>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, computed, onMounted } from 'vue'
import { getTeamInfoAPI, getTeamStatsAPI, getInvitedUsersAPI } from '@/service/index/team'
import { IResData } from '@/types/response'
import { useUserStore } from '@/store/user'

defineOptions({
  name: 'TeamPage',
})

// 获取用户数据存储
const userStore = useUserStore();

// 定义数据类型
interface TeamInfo {
  referrer_name: string
  invite_code: string
  total_invited_users: number
  verified_invited_users: number
}

interface InvitationStats {
  referrer_name: string
  invite_code: string
  total_invited_users: number
  verified_invited_users: number
  unverified_invited_users: number
}

interface InvitedUser {
  id: number
  name: string
  phone: string
  is_verified: boolean
  verified_at: string | null
  registered_at: string
}

interface InvitedUsers {
  total: number
  total_page: number
  current_page: number
  per_page: number
  list: InvitedUser[]
}

// 标签页配置
const tabs = [
  { name: '邀请列表', type: 'all' },
  { name: '未实名列表', type: 'unverified' },
  { name: '已实名列表', type: 'verified' },
]

// 当前激活的标签索引
const activeTabIndex = ref(0)

// 是否加载中
const loading = ref(false)

// 团队信息
const teamInfo = ref<TeamInfo>({
  referrer_name: '',
  invite_code: '',
  total_invited_users: 0,
  verified_invited_users: 0,
})

// 邀请统计
const invitationStats = ref<InvitationStats>({
  referrer_name: '',
  invite_code: '',
  total_invited_users: 0,
  verified_invited_users: 0,
  unverified_invited_users: 0,
})

// 邀请用户列表
const invitedUsers = ref<InvitedUsers>({
  total: 0,
  total_page: 0,
  current_page: 1,
  per_page: 10,
  list: [],
})

// 当前查询类型
const currentType = computed(() => tabs[activeTabIndex.value].type)

// 获取团队信息
const fetchTeamInfo = async () => {
  try {
    const res = (await getTeamInfoAPI()) as IResData<TeamInfo>
    if (res.status === 'success' && res.data) {
      teamInfo.value = res.data
    }
  } catch (error) {
    console.error('获取团队信息失败:', error)
  }
}

// 获取邀请统计信息
const fetchInvitationStats = async () => {
  try {
    const res = (await getTeamStatsAPI()) as IResData<InvitationStats>
    if (res.status === 'success' && res.data) {
      invitationStats.value = res.data
      // 同步更新团队信息
      teamInfo.value.invite_code = res.data.invite_code
      teamInfo.value.total_invited_users = res.data.total_invited_users
      teamInfo.value.verified_invited_users = res.data.verified_invited_users
    }
  } catch (error) {
    console.error('获取邀请统计失败:', error)
  }
}

// 获取邀请用户列表
const fetchInvitedUsers = async (page = 1) => {
  const params = {
    page,
    per_page: 10,
    type: currentType.value,
  }

  try {
    const res = (await getInvitedUsersAPI(params)) as IResData<InvitedUsers>
    if (res.status === 'success' && res.data) {
      // 前端额外处理：确保已实名列表只显示已实名用户，未实名列表只显示未实名用户
      if (currentType.value === 'verified') {
        // 筛选已实名用户
        res.data.list = res.data.list.filter((user) => user.is_verified === true)
      } else if (currentType.value === 'unverified') {
        // 筛选未实名用户
        res.data.list = res.data.list.filter((user) => user.is_verified === false)
      }

      if (page === 1) {
        invitedUsers.value = res.data
      } else {
        // 追加加载更多的数据
        invitedUsers.value.list = [...invitedUsers.value.list, ...res.data.list]
        invitedUsers.value.current_page = res.data.current_page
      }
    }
  } catch (error) {
    console.error('获取邀请用户列表失败:', error)
  }
}

// 加载更多
const loadMore = () => {
  if (invitedUsers.value.current_page < invitedUsers.value.total_page) {
    fetchInvitedUsers(invitedUsers.value.current_page + 1)
  }
}

// 标签切换处理
const handleTabChange = (index: number) => {
  if (index === activeTabIndex.value) return

  activeTabIndex.value = index
  // 重置分页并加载新类型的数据
  invitedUsers.value.current_page = 1
  invitedUsers.value.list = []
  fetchInvitedUsers(1)
}

// 复制邀请码
const copyInviteCode = () => {
  if (!teamInfo.value.invite_code) return

  uni.setClipboardData({
    data: teamInfo.value.invite_code,
    success: () => {
      uni.showToast({
        title: '复制成功',
        icon: 'success',
      })
    },
  })
}

// 导航到邀请海报页面
const navigateToInvitePoster = () => {
  uni.navigateTo({
    url: '/pages/team/invite-poster',
  })
}

// 显示实名认证提示
const showVerifyTip = () => {
  uni.showModal({
    title: '提示',
    content: '请先完成实名认证才能邀请好友',
    confirmText: '去认证',
    success: (res) => {
      if (res.confirm) {
        uni.navigateTo({
          url: '/pages/my/identity-verify'
        });
      }
    }
  });
}

// 页面首次加载
onMounted(async () => {
  loading.value = true
  try {
    await Promise.all([fetchTeamInfo(), fetchInvitationStats(), fetchInvitedUsers(1)])
  } catch (error) {
    console.error('加载团队数据失败:', error)
  } finally {
    loading.value = false
  }
})
</script>

<style>
.team-container {
  min-height: 100vh;
  padding: 30rpx;
  background-color: #f5f7fa;
}
/* 导航标签 */
.nav-tabs {
  display: flex;
  margin-bottom: 30rpx;
  overflow: hidden;
  background-color: #ffffff;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.nav-tab-item {
  position: relative;
  flex: 1;
  padding: 24rpx 0;
  font-size: 28rpx;
  color: #666;
  text-align: center;
}

.nav-tab-item.active {
  font-weight: 500;
  color: #3498db;
}

.nav-tab-item.active::after {
  position: absolute;
  bottom: 0;
  left: 50%;
  width: 40rpx;
  height: 6rpx;
  content: '';
  background-color: #3498db;
  border-radius: 3rpx;
  transform: translateX(-50%);
}
/* 加载状态 */
.loading-container {
  padding: 60rpx 0;
  text-align: center;
}

.loading-spinner {
  width: 60rpx;
  height: 60rpx;
  margin: 0 auto;
  border: 5rpx solid #f3f3f3;
  border-top: 5rpx solid #3498db;
  border-radius: 50%;
  animation: spin 1s linear infinite;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }
  100% {
    transform: rotate(360deg);
  }
}
/* 上级信息卡片 */
.referrer-card {
  padding: 30rpx;
  margin-bottom: 30rpx;
  background-color: #ffffff;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.referrer-title {
  margin-bottom: 20rpx;
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
}

.referrer-content {
  display: flex;
  align-items: center;
}

.referrer-avatar {
  width: 80rpx;
  height: 80rpx;
  margin-right: 20rpx;
  overflow: hidden;
  border-radius: 50%;
}

.referrer-avatar image {
  width: 100%;
  height: 100%;
}

.referrer-info {
  flex: 1;
}

.referrer-name {
  margin-bottom: 4rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.referrer-status {
  font-size: 24rpx;
  color: #999;
}
/* 团队统计 */
.team-stats {
  margin-bottom: 30rpx;
}

.stats-card {
  display: flex;
  overflow: hidden;
  background-color: #ffffff;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.stats-item {
  flex: 1;
  padding: 30rpx 0;
  text-align: center;
  border-right: 1rpx solid #f0f0f0;
}

.stats-item:last-child {
  border-right: none;
}

.stats-value {
  margin-bottom: 8rpx;
  font-size: 40rpx;
  font-weight: 600;
  color: #3498db;
}

.stats-label {
  font-size: 24rpx;
  color: #666;
}
/* 邀请码 */
.invite-code-box {
  padding: 30rpx;
  margin-bottom: 30rpx;
  background-color: #ffffff;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.invite-code-title {
  margin-bottom: 20rpx;
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
}

.invite-code-content {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 20rpx;
}

.invite-code {
  font-size: 36rpx;
  font-weight: 600;
  color: #3498db;
  letter-spacing: 2rpx;
}

.copy-btn {
  padding: 10rpx 30rpx;
  font-size: 24rpx;
  color: #fff;
  background-color: #3498db;
  border-radius: 30rpx;
}

.invite-btn {
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 20rpx 0;
  color: #fff;
  background: linear-gradient(to right, #3498db, #2980b9);
  border-radius: 10rpx;
}

.invite-btn-text {
  font-size: 28rpx;
  font-weight: 500;
}

.invite-icon {
  width: 36rpx;
  height: 36rpx;
  margin-left: 10rpx;
}

.invite-btn-disabled {
  background: #ccc;
  cursor: not-allowed;
}
/* 团队列表 */
.team-list {
  padding: 30rpx;
  background-color: #ffffff;
  border-radius: 12rpx;
  box-shadow: 0 4rpx 12rpx rgba(0, 0, 0, 0.05);
}

.list-title {
  margin-bottom: 20rpx;
  font-size: 30rpx;
  font-weight: 500;
  color: #333;
}

.empty-list {
  padding: 60rpx 0;
  text-align: center;
}

.empty-list image {
  width: 200rpx;
  height: 200rpx;
  margin-bottom: 20rpx;
}

.empty-text {
  font-size: 28rpx;
  color: #999;
}

.member-list {
  margin-bottom: 20rpx;
}

.member-item {
  display: flex;
  align-items: center;
  padding: 20rpx 0;
  border-bottom: 1rpx solid #f0f0f0;
}

.member-item:last-child {
  border-bottom: none;
}

.member-avatar {
  width: 80rpx;
  height: 80rpx;
  margin-right: 20rpx;
  overflow: hidden;
  border-radius: 50%;
}

.member-avatar image {
  width: 100%;
  height: 100%;
}

.member-info {
  flex: 1;
}

.member-name {
  margin-bottom: 4rpx;
  font-size: 28rpx;
  font-weight: 500;
  color: #333;
}

.member-time {
  font-size: 24rpx;
  color: #999;
}

.member-status {
  padding: 6rpx 16rpx;
  font-size: 24rpx;
  color: #999;
  background-color: #f5f5f5;
  border-radius: 20rpx;
}

.member-status.verified {
  color: #3498db;
  background-color: rgba(52, 152, 219, 0.1);
}

.load-more {
  padding: 20rpx 0;
  font-size: 28rpx;
  color: #3498db;
  text-align: center;
}
</style>
