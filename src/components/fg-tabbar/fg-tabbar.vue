<template>
  <wd-tabbar
    fixed
    v-model="tabbarStore.curIdx"
    bordered
    safeAreaInsetBottom
    placeholder
    @change="selectTabBar"
    class="custom-tabbar"
    zIndex="500"
  >
    <block v-for="(item, idx) in tabbarList" :key="item.path">
      <wd-tabbar-item
        v-if="item.iconType === 'wot'"
        :title="item.text"
        :icon="item.icon"
      ></wd-tabbar-item>
      <wd-tabbar-item
        v-else-if="item.iconType === 'unocss' || item.iconType === 'iconfont'"
        :title="item.text"
      >
        <template #icon>
          <view
            h-40rpx
            w-40rpx
            :class="[item.icon, idx === tabbarStore.curIdx ? 'is-active' : 'is-inactive']"
          ></view>
        </template>
      </wd-tabbar-item>
      <wd-tabbar-item v-else-if="item.iconType === 'local'" :title="item.text">
        <template #icon>
          <image v-if="idx === tabbarStore.curIdx" :src="getIconPath(item.iconHL)" h-40rpx w-40rpx />
          <image v-else :src="getIconPath(item.icon)" h-40rpx w-40rpx />
        </template>
      </wd-tabbar-item>
    </block>
  </wd-tabbar>
</template>

<script setup lang="ts">
// unocss icon 默认不生效，需要在这里写一遍才能生效！注释掉也是生效的，但是必须要有！
// i-carbon-code
import { tabBar } from '@/pages.json'
import { tabbarStore } from './tabbar'

/** tabbarList 里面的 path 从 pages.config.ts 得到 */
const tabbarList = tabBar.list.map((item) => ({ ...item, path: `/${item.pagePath}` }))

/**
 * 处理图标路径，确保无论部署在什么基础路径下都能正确加载
 * @param iconPath 原始图标路径
 * @returns 处理后的图标路径
 */
function getIconPath(iconPath: string): string {
  // 如果是完整URL或绝对路径，直接返回
  if (iconPath.startsWith('http') || iconPath.startsWith('//')) {
    return iconPath
  }
  
  // 优先使用VITE_APP_PUBLIC_BASE，如果不存在则使用BASE_URL或默认的'/'
  const baseUrl = import.meta.env.VITE_APP_PUBLIC_BASE || import.meta.env.BASE_URL || '/'
  const basePath = baseUrl.endsWith('/') ? baseUrl : `${baseUrl}/`
  
  // 移除iconPath开头的斜杠，避免路径重复
  const cleanIconPath = iconPath.startsWith('/') ? iconPath.slice(1) : iconPath
  
  return `${basePath}${cleanIconPath}`
}

function selectTabBar({ value: index }: { value: number }) {
  const url = tabbarList[index].path
  tabbarStore.setCurIdx(index)
  uni.switchTab({ url })
}
onLoad(() => {
  // 解决原生 tabBar 未隐藏导致有2个 tabBar 的问题
  // #ifdef APP-PLUS | H5
  uni.hideTabBar({
    fail(err) {
      console.log('hideTabBar fail: ', err)
    },
    success(res) {
      console.log('hideTabBar success: ', res)
    },
  })
  // #endif
})
</script>

<style lang="scss" scoped>
:deep(.custom-tabbar) {
  z-index: 500 !important; /* 设置较低的层级，确保弹窗能覆盖tabbar */
}

:deep(.wd-tabbar), :deep(.wd-tabbar__content) {
  z-index: 500 !important;
}
</style>
