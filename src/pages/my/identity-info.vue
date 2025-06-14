<route lang="json5">
    {
      style: {
        navigationBarTitleText: '实名信息',
      },
    }
    </route>
    
    <template>
      <view class="identity-info-container">
        <!-- 顶部波浪装饰 -->
        <view class="wave-decoration"></view>
    
        <!-- 返回按钮 -->
        <view class="back-button" @click="goBack">
          <text class="uni-icons uniui-arrow-left"></text>
        </view>
    
        <!-- 页面标题 -->
        <!-- <view class="page-title">
          <text class="title-text">实名信息</text>
        </view> -->
    
        <!-- 认证状态展示 -->
        <!-- <view class="verify-status-card">
          <view class="status-icon approved-icon">
            <text class="uni-icons uniui-checkmark-filled"></text>
          </view>
          <text class="status-text">认证已通过</text>
          <text class="status-desc">您已完成实名认证，可以使用完整的平台功能</text>
        </view> -->
    
        <!-- 查看模式：已通过状态下的信息展示 -->
        <view class="verify-info" style="margin-top: 40rpx;" v-if="!isEditing">
          <view class="info-group">
            <text class="info-label">姓名</text>
            <text class="info-value">{{ userInfo.name }}</text>
          </view>
          <view class="info-group">
            <text class="info-label">身份证号</text>
            <text class="info-value id-number">{{ userInfo.idNumber }}</text>
          </view>
          <!-- <view class="info-group" v-if="userInfo.verifyTime">
            <text class="info-label">认证时间</text>
            <text class="info-value">{{ formatDate(userInfo.verifyTime) }}</text>
          </view> -->
        </view>
        
        <!-- 编辑模式：表单 -->
        <view class="verify-form" v-if="isEditing">
          <view class="form-group">
            <text class="form-label">真实姓名</text>
            <view class="input-container">
              <text class="uni-icons uniui-person-filled"></text>
              <input
                class="form-control"
                type="text"
                placeholder="请输入您的真实姓名"
                v-model="formData.name"
              />
            </view>
          </view>

          <view class="form-group">
            <text class="form-label">身份证号码</text>
            <view class="input-container">
              <text class="uni-icons uniui-card-filled"></text>
              <input
                class="form-control"
                type="idcard"
                :maxlength="18"
                placeholder="请输入您的身份证号码"
                v-model="formData.idNumber"
              />
            </view>
          </view>

          <!-- 提示说明 -->
          <view class="tips-container">
            <text class="tips-icon uni-icons uniui-info-filled"></text>
            <text class="tips-text">请确保填写的信息真实有效</text>
          </view>
        </view>
        
        <!-- 编辑按钮 -->
        <view class="edit-button-container">
          <button class="edit-btn" @click="toggleEditMode" v-if="!isEditing">修改实名信息</button>
          <view class="button-group" v-else>
            <button class="cancel-btn" @click="cancelEdit">取消</button>
            <button class="save-btn" @click="submitUpdate" :disabled="loading">{{ loading ? '提交中...' : '保存修改' }}</button>
          </view>
        </view>
    
        <!-- 底部版权信息 -->
        <view class="verify-footer">
          <text></text>
        </view>
      </view>
    </template>
    
    <script lang="ts" setup>
    import { ref, reactive, onMounted } from 'vue'
    import { useUserStore, useVerificationStore } from '@/store'
    import { getVerificationStatusAPI, updateVerificationAPI, VerificationResponse } from '@/service/index/verification'

    // 获取用户状态
    const userStore = useUserStore()
    const verificationStore = useVerificationStore()
    
    // 是否处于编辑模式
    const isEditing = ref(false)
    
    // 加载状态
    const loading = ref(false)
    
    // 用户信息
    const userInfo = reactive({
      name: '',
      idNumber: '',
      verifyTime: '',
    })
    
    // 表单数据
    const formData = reactive({
      name: '',
      idNumber: '',
    })
    
    // 身份证号码脱敏处理
    const maskIdNumber = (idNumber: string) => {
      if (!idNumber) return ''
      // 确保显示前6位和后4位，中间部分用星号替换
      if (idNumber.length >= 15) { // 处理15位或18位身份证
        return idNumber.replace(/^(.{6})(.*)(.{4})$/, '$1****$3')
      }
      // 如果长度异常，至少显示部分信息
      return idNumber
    }
    
    // 格式化日期
    const formatDate = (dateString: string) => {
      if (!dateString) return ''
      try {
        const date = new Date(dateString)
        return `${date.getFullYear()}-${(date.getMonth() + 1).toString().padStart(2, '0')}-${date.getDate().toString().padStart(2, '0')} ${date.getHours().toString().padStart(2, '0')}:${date.getMinutes().toString().padStart(2, '0')}`
      } catch (e) {
        return dateString
      }
    }
    
    // 页面加载时获取认证信息
    onMounted(async () => {
      // 从用户信息中获取基本信息
      userInfo.name = userStore.userInfo.name || ''
    
      try {
        // 获取认证详情
        const res = await getVerificationStatusAPI()
    
        // 基于API返回的数据结构访问verification对象
        if (res.status === 'success' && res.data) {
          // 获取认证信息
          const verificationData = res.data
          if (verificationData && verificationData.verification) {
            // 填充用户信息
            const verification = verificationData.verification
            console.log(verification,'verificationData')
            userInfo.name = verification.real_name || userInfo.name
            userInfo.idNumber = verification.id_card_number || ''
            userInfo.verifyTime = verification.verified_at || verification.updated_at || ''
          }
        }
      } catch (error) {
        console.error('获取认证详情失败', error)
        // 使用基础用户信息作为备选
        userInfo.name = userStore.userInfo.name || ''
    
        // 显示错误提示
        uni.showToast({
          title: '获取认证信息失败',
          icon: 'none',
        })
      }
    })
    
    // 返回上一页
    const goBack = () => {
      uni.navigateBack()
    }

    // 切换编辑模式
    const toggleEditMode = () => {
      isEditing.value = true
      // 填充表单数据
      formData.name = userInfo.name
      formData.idNumber = userInfo.idNumber
    }

    // 取消编辑
    const cancelEdit = () => {
      isEditing.value = false
      // 重置表单数据
      formData.name = ''
      formData.idNumber = ''
    }

    // 提交更新
    const submitUpdate = async () => {
      // 表单验证
      if (!formData.name.trim()) {
        uni.showToast({
          title: '请输入真实姓名',
          icon: 'none',
        })
        return
      }

      if (!formData.idNumber.trim()) {
        uni.showToast({
          title: '请输入身份证号码',
          icon: 'none',
        })
        return
      }

      // 简单的身份证格式验证
      const idCardReg = /(^\d{15}$)|(^\d{18}$)|(^\d{17}(\d|X|x)$)/
      if (!idCardReg.test(formData.idNumber)) {
        uni.showToast({
          title: '请输入正确的身份证号码',
          icon: 'none',
        })
        return
      }

      try {
        // 显示加载状态
        loading.value = true

        // 调用更新实名信息API
        const res = await updateVerificationAPI({
          real_name: formData.name,
          id_card_number: formData.idNumber,
        })

        if (res.status === 'success') {
          // 更新本地显示的用户信息
          userInfo.name = formData.name
          userInfo.idNumber = formData.idNumber
          userInfo.verifyTime = new Date().toISOString()

          // 退出编辑模式
          isEditing.value = false

          // 提交成功提示
          uni.showToast({
            title: '实名信息修改成功',
            icon: 'success',
          })
        }
      } catch (error: any) {
        uni.showToast({
          title: error.data?.message || '提交失败，请重试',
          icon: 'none',
        })
      } finally {
        loading.value = false
      }
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
    .identity-info-container {
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
      width: 100%;
      height: 16rpx;
      background: linear-gradient(to right, #f39c12, #e74c3c);
    }
    /* 返回按钮 */
    .back-button {
      position: absolute;
      top: 60rpx;
      left: 20rpx;
      z-index: 10;
      display: flex;
      align-items: center;
      justify-content: center;
      width: 80rpx;
      height: 80rpx;
      font-size: 40rpx;
      color: #333;
    }
    /* 页面标题 */
    .page-title {
      margin-top: 130rpx;
      margin-bottom: 40rpx;
      text-align: center;
    }
    
    .title-text {
      font-size: 40rpx;
      font-weight: 600;
      color: #333;
    }
    /* 认证状态卡片 */
    .verify-status-card {
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 40rpx;
      margin: 20rpx 30rpx 30rpx;
      background-color: white;
      border-radius: 20rpx;
      box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
    }
    
    .status-icon {
      display: flex;
      align-items: center;
      justify-content: center;
      width: 120rpx;
      height: 120rpx;
      margin-bottom: 20rpx;
      border-radius: 50%;
    }
    
    .approved-icon {
      background-color: rgba(46, 204, 113, 0.1);
    }
    
    .approved-icon .uni-icons {
      font-size: 60rpx;
      color: #2ecc71;
    }
    
    .status-text {
      margin-bottom: 15rpx;
      font-size: 36rpx;
      font-weight: 600;
      color: #333;
    }
    
    .status-desc {
      font-size: 28rpx;
      color: #666;
      text-align: center;
    }
    /* 认证信息展示 */
    .verify-info {
      padding: 30rpx;
      margin: 0 30rpx 30rpx;
      background-color: white;
      border-radius: 20rpx;
      box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
    }
    
    .info-group {
      display: flex;
      justify-content: space-between;
      padding: 20rpx 0;
      border-bottom: 1px solid #f0f0f0;
      align-items: center;
    }
    
    .info-group:last-child {
      border-bottom: none;
    }
    
    .info-label {
      font-size: 28rpx;
      color: #666;
      flex-shrink: 0;
      margin-right: 20rpx;
    }
    
    .info-value {
      font-size: 28rpx;
      font-weight: 500;
      color: #333;
      text-align: right;
      word-break: break-all;
      flex: 1;
    }
    
    /* 身份证号码特定样式 */
    .id-number {
      font-family: monospace; /* 等宽字体确保更好的显示效果 */
      letter-spacing: 1rpx; /* 增加字符间距 */
    }
    
    /* 表单样式 */
    .verify-form {
      background-color: white;
      border-radius: 20rpx;
      margin: 40rpx 30rpx 30rpx;
      padding: 30rpx;
      box-shadow: 0 8rpx 24rpx rgba(0, 0, 0, 0.08);
    }
    
    /* 表单组 */
    .form-group {
      margin-bottom: 25rpx;
    }
    
    /* 表单标签 */
    .form-label {
      display: block;
      color: #555;
      margin-bottom: 14rpx;
      font-size: 28rpx;
      font-weight: 500;
    }
    
    /* 输入框容器 */
    .input-container {
      position: relative;
      display: flex;
      align-items: center;
    }
    
    /* 输入框图标 */
    .uni-icons {
      position: absolute;
      left: 20rpx;
      color: #aaa;
      font-size: 36rpx;
    }
    
    /* 输入框 */
    .form-control {
      width: 100%;
      height: 90rpx;
      border: 1px solid #e0e0e0;
      border-radius: 45rpx;
      padding: 0 30rpx 0 80rpx;
      font-size: 30rpx;
      color: #333;
      background-color: #f8f8f8;
    }
    
    /* 提示容器 */
    .tips-container {
      display: flex;
      padding: 20rpx;
      background-color: rgba(52, 152, 219, 0.1);
      border-radius: 10rpx;
      margin: 30rpx 0;
    }
    
    .tips-icon {
      position: static;
      font-size: 36rpx;
      color: #3498db;
      margin-right: 20rpx;
      flex-shrink: 0;
    }
    
    .tips-text {
      font-size: 24rpx;
      color: #666;
      line-height: 1.6;
    }
    
    /* 编辑按钮容器 */
    .edit-button-container {
      padding: 0 30rpx;
      margin-bottom: 30rpx;
    }
    
    /* 编辑按钮 */
    .edit-btn {
      width: 100%;
      height: 90rpx;
      border: none;
      border-radius: 45rpx;
      background: linear-gradient(to right, #f39c12, #e74c3c);
      color: white;
      font-size: 32rpx;
      font-weight: 500;
      box-shadow: 0 10rpx 20rpx rgba(243, 156, 18, 0.3);
    }
    
    /* 按钮组 */
    .button-group {
      display: flex;
      justify-content: space-between;
      gap: 30rpx;
    }
    
    /* 取消按钮 */
    .cancel-btn {
      flex: 1;
      height: 90rpx;
      border: 1px solid #e0e0e0;
      border-radius: 45rpx;
      background-color: #f8f8f8;
      color: #666;
      font-size: 32rpx;
      font-weight: 500;
    }
    
    /* 保存按钮 */
    .save-btn {
      flex: 1;
      height: 90rpx;
      border: none;
      border-radius: 45rpx;
      background: linear-gradient(to right, #f39c12, #e74c3c);
      color: white;
      font-size: 32rpx;
      font-weight: 500;
      box-shadow: 0 10rpx 20rpx rgba(243, 156, 18, 0.3);
    }
    
    .save-btn[disabled] {
      opacity: 0.7;
      background: linear-gradient(to right, #f5cc7f, #f2a690);
    }
    
    /* 底部版权信息 */
    .verify-footer {
      padding: 30rpx 0;
      margin-top: auto;
      font-size: 24rpx;
      color: #999;
      text-align: center;
    }
    </style>
    