import { http } from '@/utils/http'

/**
 * 获取上级信息
 */
export function getSuperiorInfoAPI() {
  return http.get('/api/team/superior')
}

/**
 * 获取团队统计信息
 */
export function getTeamStatsAPI() {
  return http.get('/api/user/invitation/stats')
}

/**
 * 获取邀请用户列表
 * @param params 分页和类型参数
 */
export function getInvitedUsersAPI(params: { page: number; per_page: number; type: string }) {
  return http.get('/api/user/invitation/users', { params })
}

/**
 * 获取用户团队信息
 */
export function getTeamInfoAPI() {
  return http.get('/api/user/team')
}

/**
 * 获取已注册用户列表
 * @param params 分页参数
 */
export function getRegisteredListAPI(params: { page: number; pageSize: number }) {
  return http.get('/api/team/registered', { params })
}

/**
 * 获取已实名用户列表
 * @param params 分页参数
 */
export function getVerifiedListAPI(params: { page: number; pageSize: number }) {
  return http.get('/api/team/verified', { params })
} 