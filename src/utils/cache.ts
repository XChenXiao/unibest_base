/**
 * 页面缓存管理工具
 */

/**
 * 清空页面缓存
 * 在应用退出或需要清理缓存的场景下调用
 */
export const clearPageCache = () => {
  console.log('清空页面缓存')
  try {
    // 获取当前所有页面
    const pages = getCurrentPages()
    
    // 清除页面路由缓存
    uni.setStorageSync('last_page_path', '')
    
    // #ifdef APP-PLUS
    // 清空页面缓存 - App环境
    if (pages && pages.length > 0) {
      // 遍历所有页面并清除缓存
      pages.forEach((page: any) => {
        if (page && page.$getAppWebview) {
          const webview = page.$getAppWebview()
          if (webview) {
            // 设置webview不缓存
            webview.setStyle({
              cachemode: 'noCache',
            })
          }
        }
      })
    }
    
    // 尝试清除webview缓存
    const currentWebview = plus.webview.currentWebview()
    if (currentWebview) {
      currentWebview.clear()
    }
    // #endif
    
    console.log('页面缓存清理完成')
  } catch (error) {
    console.error('清除页面缓存失败:', error)
  }
}

/**
 * 重置所有页面并返回首页
 * 在需要彻底清理应用状态时使用
 */
export const resetAppAndGoHome = () => {
  // 清空页面缓存
  clearPageCache()
  
  // 返回首页
  uni.reLaunch({
    url: '/pages/index/index',
    success: () => {
      console.log('已重置应用并返回首页')
    },
    fail: (err) => {
      console.error('重置应用并返回首页失败', err)
    },
  })
} 