import { http } from '@/utils/http'

/**
 * 打卡统计信息接口
 */
export interface ICheckInStats {
  cycle_start_date: string
  cycle_end_date: string
  current_cycle_days: number
  total_days: number
  today_checked: boolean
  next_target: {
    days: number
    amount: number
    remaining_days: number
  } | null
  highest_reward: {
    days: number
    amount: number
  } | null
  milestones: Array<{
    title: string
    days: number
    reward: string
    daysCompleted: number
    completed: boolean
    current: boolean
  }>
}

/**
 * 打卡日历状态接口
 */
export interface ICheckInDailyStatus {
  cycle_start_date: string
  cycle_end_date: string
  daily_status: Array<{
    date: string
    day: number
    month: number
    year: number
    weekday: number
    checked_in: boolean
    is_past_or_today: boolean
    is_today: boolean
  }>
  total_checked_days: number
  total_days_in_cycle: number
  cycle_progress: number
}

/**
 * 获取打卡统计信息
 * @returns Promise
 */
export const getCheckInStatsAPI = () => {
  console.log('调用获取打卡统计信息API')
  return http.get<ICheckInStats>('/api/checkin/stats')
}

/**
 * 获取打卡日历状态
 * @returns Promise
 */
export const getCheckInDailyStatusAPI = () => {
  console.log('调用获取打卡日历状态API')
  return http.get<ICheckInDailyStatus>('/api/checkin/daily-status')
}

/**
 * 执行打卡
 * @returns Promise
 */
export const checkInAPI = () => {
  console.log('调用执行打卡API')
  return http.post<{ message: string }>('/api/checkin')
} 