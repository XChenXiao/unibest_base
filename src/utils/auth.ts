import { useUserStore } from '@/store/user'

/**
 * 检查用户登录状态
 * @returns 是否已登录
 */
export function checkLoginStatus(): boolean {
  const userStore = useUserStore()
  return !!userStore.userInfo.token
} 