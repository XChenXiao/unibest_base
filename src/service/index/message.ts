import { http } from '@/utils/http'

interface Announcement {
  id: number
  title: string
  content: string
  created_at: string
  is_read: boolean
  is_system: boolean
  message_type: string
}

interface ResponseData<T> {
  status: string
  data: T
  message?: string
}

interface AnnouncementsResponse {
  data: Announcement[]
  total: number
  current_page: number
  last_page: number
}

/**
 * 获取系统公告列表
 * @param page 页码
 * @param perPage 每页条数
 * @returns 公告列表数据
 */
export const getAnnouncementsAPI = async (page = 1, perPage = 10) => {
  try {
    const result = await http.get<AnnouncementsResponse>(`/api/messages`, {
      is_system: true,
      page,
      per_page: perPage,
    })
    return result
  } catch (error) {
    console.error('获取公告列表失败:', error)
    throw error
  }
}

/**
 * 获取最新的系统公告
 * @returns 最新公告数据
 */
export const getLatestAnnouncementAPI = async () => {
  try {
    const result = await http.get<ResponseData<{ data: Announcement[] }>>(`/api/messages`, {
      is_system: true,
      page: 1,
      per_page: 1,
    })

    // 确保返回的数据结构正确
    if (
      result.status === 'success' &&
      result.data &&
      result.data.data &&
      Array.isArray(result.data.data) &&
      result.data.data.length > 0
    ) {
      return {
        status: 'success',
        data: result.data.data[0],
      }
    } else {
      return {
        status: 'success',
        data: null,
      }
    }
  } catch (error) {
    console.error('获取最新公告失败:', error)
    return {
      status: 'error',
      data: null,
      message: '获取最新公告失败',
    }
  }
}

/**
 * 获取公告详情
 * @param id 公告ID
 * @returns 公告详情数据
 */
export const getAnnouncementDetailAPI = async (id: number) => {
  try {
    const result = await http.get<Announcement>(`/api/messages/${id}`)
    return result
  } catch (error) {
    console.error('获取公告详情失败:', error)
    throw error
  }
}

/**
 * 标记公告为已读
 * @param id 公告ID
 * @returns 操作结果
 */
export const markAnnouncementAsReadAPI = async (id: number) => {
  try {
    const result = await http.post<ResponseData<any>>(`/api/messages/${id}/read`)
    return result
  } catch (error) {
    console.error('标记公告已读失败:', error)
    throw error
  }
}

/**
 * 获取未读公告数量
 * @returns 未读公告数量数据
 */
export const getUnreadAnnouncementCountAPI = async () => {
  try {
    const result = await http.get<{
      unread_count: number
      personal_unread: number
      global_unread: number
    }>(`/api/messages/unread-count`)
    return result
  } catch (error) {
    console.error('获取未读公告数量失败:', error)
    throw error
  }
}
