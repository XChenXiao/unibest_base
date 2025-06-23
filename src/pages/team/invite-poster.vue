<route lang="json5">
{
  style: {
    navigationStyle: 'custom',
  },
}
</route>

<template>
  <view class="invite-box" style="height: 100%">
    <!-- 自定义导航栏 -->
    <view class="title">
      <text class="title-info">邀请好友</text>
      <view class="back-icon" @click="back">
        <image src="/static/images/back-icon.png" mode="aspectFit" class="arrow" />
      </view>
      <text class="right-value" @click="handleSave">保存到相册</text>
    </view>

    <!-- 海报展示 -->
    <view class="poster-wrapper">
      <view
        v-if="posterPath"
        :style="{ backgroundImage: `url(${posterPath})` }"
        class="poster-img"
      />
      <view
        class="copy-btn-container"
        @click="
          handleCopy(
            `https://www.bzboc.com/mobile/#/pages/register/captcha?invite_code=${teamInfo.invite_code}`,
          )
        "
      >
        <view class="copy-btn">复制邀请链接</view>
      </view>
    </view>

    <!-- 隐藏的Painter组件 -->
    <view style="visibility: hidden">
      <l-painter
        ref="painter"
        isCanvasToTempFilePath
        @success="posterPath = $event"
        hidden
        css="height: 1500rpx;"
      >
        <l-painter-image
          src="/static/images/bg/inviteBg.png"
          css="object-fit: contain;width: 100%;position:absolute;z-index:-999;"
        />
        <l-painter-view
          css="
            position:fixed;
            height:170.25rpx;
            bottom: 427rpx;
            z-index:999;
            width: 85%;
            margin:0 auto;
            padding: 20rpx;
            border-radius: 10rpx;
          "
        >
          <l-painter-view
            css="
              position: absolute;
              top: 20rpx;
              left:0;
            "
          >
            <l-painter-view
              css="
                margin: 10rpx 20rpx;
              "
            >
              <l-painter-text
                css="
                  font-size: 31.25rpx;
                  display:block;
                  color: white;
                "
                :text="teamInfo.realName"
              />

              <l-painter-view
                css="
                  background: #ea9518;
                  border-radius: 18rpx;
                  color: black;
                  display: block;
                  padding: 5rpx 10rpx;
                  font-size: 24.33rpx;
                "
              >
                <l-painter-text css="margin-right: 0rpx" :text="'邀请码:' + teamInfo.invite_code" />
              </l-painter-view>
            </l-painter-view>
          </l-painter-view>
          <l-painter-view
            css="
              position: absolute;
              right: 15rpx;
              top:15rpx;
            "
          >
            <l-painter-qrcode
              :text="`https://www.bzboc.com/mobile/#/pages/register/captcha?invite_code=${teamInfo.invite_code}`"
              css="width: 180rpx; height: 180rpx;background:white;border:4rpx solid white;"
            />
          </l-painter-view>
        </l-painter-view>
      </l-painter>
    </view>
  </view>
</template>

<script lang="ts" setup>
import { ref, reactive, onMounted } from 'vue'
import { getTeamInfoAPI } from '@/service/index/team'
import { useUserStore } from '@/store/user'
import { IResData } from '@/types/response'

defineOptions({
  name: 'InvitePosterPage',
})

// 用户信息
const userStore = useUserStore()
console.log(userStore.userInfo, '用户信息=========')

// 团队信息
const teamInfo = reactive({
  invite_code: '',
  realName: '',
})

onMounted(() => {
  console.log(userStore.userInfo, '用户信息=========')
  teamInfo.invite_code = userStore.userInfo?.invite_code
  teamInfo.realName = userStore.userInfo?.name || '用户'
})

// 海报路径
const posterPath = ref('')

// 绘制器引用
const painter = ref(null)

// 返回上一页
const back = () => {
  uni.navigateBack()
}

// 复制链接
const handleCopy = async (param) => {
  try {
    await uni.setClipboardData({
      data: param,
    })
    uni.showToast({
      title: '复制成功',
      icon: 'none',
      duration: 2000,
    })
  } catch (error) {
    uni.showToast({
      title: '复制失败',
      icon: 'none',
      duration: 2000,
    })
  }
}

// H5环境使用的保存Blob方法
const saveBlob = (blob, fileName) => {
  // 创建一个链接元素用于下载
  const link = document.createElement('a')
  link.href = URL.createObjectURL(blob)
  link.download = fileName
  // 这个方法对于Uni-app可能需要调整，以匹配移动设备的文件系统
  link.click()
  // 清除对象URL
  URL.revokeObjectURL(link.href)
}

// 保存到相册
const handleSave = () => {
  // 生成图片
  painter.value.canvasToTempFilePathSync({
    fileType: 'jpg',
    // 如果返回的是base64是无法使用 saveImageToPhotosAlbum，需要设置 pathType为url
    pathType: 'url',
    quality: 1,
    success: (res) => {
      // #ifdef H5
      // H5环境下，通过saveBlob方法保存图片
      if (res.tempFilePath.startsWith('data:')) {
        // base64格式处理
        const parts = res.tempFilePath.split(',')
        const binary = atob(parts[1])
        const array = []
        for (let i = 0; i < binary.length; i++) {
          array.push(binary.charCodeAt(i))
        }
        const blob = new Blob([new Uint8Array(array)], { type: 'image/jpeg' })
        saveBlob(blob, `invite-poster-${Date.now()}.jpg`)
      } else {
        // 通过URL获取图片并下载
        const xhr = new XMLHttpRequest()
        xhr.open('GET', res.tempFilePath, true)
        xhr.responseType = 'blob'
        xhr.onload = function () {
          if (this.status === 200) {
            saveBlob(this.response, `invite-poster-${Date.now()}.jpg`)
          }
        }
        xhr.send()
      }
      uni.showToast({
        title: '保存成功!',
        icon: 'success',
        duration: 2000,
      })
      // #endif

      // #ifndef H5
      // 非H5环境下使用原生API保存到相册
      uni.showToast({
        title: '保存成功!',
        icon: 'success',
        duration: 2000,
      })
      // 非H5 保存到相册
      uni.saveImageToPhotosAlbum({
        filePath: res.tempFilePath,
        success: function () {
          console.log('save success')
        },
      })
      // #endif
    },
  })
}

// 获取团队信息
// const fetchTeamInfo = async () => {
//   try {
//     const res = (await getTeamInfoAPI()) as IResData<any>
//     if (res.status === 'success' && res.data) {
//       teamInfo.invite_code = res.data.invite_code || userStore.userInfo?.invite_code || '123456'
//     }
//   } catch (error) {
//     console.error('获取团队信息失败:', error)
//   }
// }

// onMounted(async () => {
//   await fetchTeamInfo()
// })
</script>

<style lang="scss">
body {
  overflow: hidden;
}
page {
  overflow: hidden;
}
.invite-box {
  height: 100%;
  overflow: hidden;
}

.title {
  position: relative;
  display: flex;
  align-items: center;
  justify-content: center;
  padding-top: 100rpx;
  padding-bottom: 20rpx;
  background-color: white;
}

.title-info {
  font-size: 32rpx;
  font-weight: 700;
}

.back-icon {
  position: absolute;
  top: 100rpx;
  left: 25rpx;
}

.arrow {
  width: 40rpx;
  height: 40rpx;
}

.right-value {
  position: absolute;
  right: 31.2rpx;
  font-size: 25rpx;
  color: #a9a9a9;
}

.poster-wrapper {
  position: relative;
  width: 100%;
  height: calc(100vh - 160rpx);
}

.poster-img {
  width: 100%;
  height: 1600rpx;
  background-repeat: no-repeat;
  background-size: contain;
}

.copy-btn-container {
  position: fixed;
  bottom: 267rpx;
  z-index: 999;
  display: flex;
  justify-content: center;
  width: 100%;
}

.copy-btn {
  width: 85%;
  padding: 13rpx;
  font-size: 31.25rpx;
  font-weight: bold;
  line-height: 50.25rpx;
  text-align: center;
  vertical-align: center;
  background: rgb(246, 193, 19);
  border-radius: 35rpx;
}
</style>
