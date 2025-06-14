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