/**
 * uni-app API的封装工具
 */

/**
 * 显示消息提示框
 * @param title 提示的内容
 * @param duration 提示的延迟时间（默认1500ms）
 * @param icon 图标，有效值 "success", "loading", "none"
 */
export function showToast(
  title: string, 
  duration: number = 1500, 
  icon: 'success' | 'loading' | 'none' = 'none',
  mask: boolean = false
) {
  uni.showToast({
    title,
    icon,
    duration,
    mask
  });
}

/**
 * 显示模态弹窗
 * @param title 提示的标题
 * @param content 提示的内容
 * @param showCancel 是否显示取消按钮
 * @param cancelText 取消按钮的文字
 * @param confirmText 确认按钮的文字
 * @returns Promise 用户点击确认/取消的结果
 */
export function showModal(
  title: string,
  content: string,
  showCancel: boolean = true,
  cancelText: string = '取消',
  confirmText: string = '确定'
): Promise<{ confirm: boolean, cancel: boolean }> {
  return new Promise((resolve) => {
    uni.showModal({
      title,
      content,
      showCancel,
      cancelText,
      confirmText,
      success: (res) => {
        resolve(res);
      }
    });
  });
}

/**
 * 显示loading提示框
 * @param title 提示的内容
 * @param mask 是否显示透明蒙层
 */
export function showLoading(title: string = '加载中', mask: boolean = true) {
  uni.showLoading({
    title,
    mask
  });
}

/**
 * 隐藏loading提示框
 */
export function hideLoading() {
  uni.hideLoading();
}

/**
 * 页面导航
 * @param url 需要跳转的应用内页面路径
 * @param params 参数对象，会被转换为查询字符串
 */
export function navigateTo(url: string, params?: Record<string, any>) {
  if (params) {
    const query = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');
    url = url + (url.includes('?') ? '&' : '?') + query;
  }
  
  uni.navigateTo({
    url
  });
}

/**
 * 重定向页面
 * @param url 需要跳转的应用内页面路径
 * @param params 参数对象，会被转换为查询字符串
 */
export function redirectTo(url: string, params?: Record<string, any>) {
  if (params) {
    const query = Object.entries(params)
      .map(([key, value]) => `${key}=${encodeURIComponent(String(value))}`)
      .join('&');
    url = url + (url.includes('?') ? '&' : '?') + query;
  }
  
  uni.redirectTo({
    url
  });
}

/**
 * 页面返回
 * @param delta 返回的页面数，如果 delta 大于现有页面数，则返回到首页
 */
export function navigateBack(delta: number = 1) {
  uni.navigateBack({
    delta
  });
}

/**
 * 设置剪贴板内容
 * @param data 需要设置的内容
 * @returns Promise
 */
export function setClipboardData(data: string): Promise<void> {
  return new Promise((resolve, reject) => {
    uni.setClipboardData({
      data,
      success: () => resolve(),
      fail: (err) => reject(err)
    });
  });
}

/**
 * 获取剪贴板内容
 * @returns Promise
 */
export function getClipboardData(): Promise<string> {
  return new Promise((resolve, reject) => {
    uni.getClipboardData({
      success: (res) => resolve(res.data),
      fail: (err) => reject(err)
    });
  });
} 