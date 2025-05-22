import { defineStore } from 'pinia'
import { ref } from 'vue'
import { getTeamInfoAPI, getTeamStatsAPI } from '@/service/index/team'
import { useUserStore } from './user'

// 团队信息接口
export interface ITeamInfo {
  total_members: number
  direct_invites: number
  verified_members: number
  total_rewards: number
}

// 初始团队信息状态
const initTeamInfo: ITeamInfo = {
  total_members: 0,
  direct_invites: 0,
  verified_members: 0,
  total_rewards: 0,
}

export const useTeamStore = defineStore(
  'team',
  () => {
    // 团队信息
    const teamInfo = ref<ITeamInfo>({ ...initTeamInfo })

    // 清除团队信息
    const clearTeamInfo = () => {
      teamInfo.value = { ...initTeamInfo }
    }

    // 获取团队信息
    const fetchTeamInfo = async () => {
      const userStore = useUserStore()
      if (!userStore.userInfo.token) {
        return false
      }

      try {
        // 获取团队统计信息
        const statsRes = await getTeamStatsAPI()

        if (statsRes.status === 'success' && statsRes.data) {
          // 使用类型断言处理API返回的数据
          const statsData = statsRes.data as any

          teamInfo.value = {
            ...teamInfo.value,
            total_rewards: Number(statsData.total_rewards || 0),
            direct_invites: Number(statsData.total_invites || 0),
          }
        }

        // 获取团队详细信息
        const teamRes = await getTeamInfoAPI()

        if (teamRes.status === 'success' && teamRes.data) {
          // 使用类型断言处理API返回的数据
          const teamData = teamRes.data as any

          teamInfo.value = {
            ...teamInfo.value,
            total_members: Number(teamData.total_members || 0),
            verified_members: Number(teamData.verified_members || 0),
          }
        }

        return true
      } catch (error) {
        console.error('获取团队信息失败', error)
        return false
      }
    }

    return {
      teamInfo,
      clearTeamInfo,
      fetchTeamInfo,
    }
  },
  {
    persist: true,
  },
)
