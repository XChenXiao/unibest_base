import { createPinia } from 'pinia'
import { createPersistedState } from 'pinia-plugin-persistedstate' // 数据持久化

const store = createPinia()
store.use(
  createPersistedState({
    storage: {
      getItem: uni.getStorageSync,
      setItem: uni.setStorageSync,
    },
  }),
)

export default store

// 导出各个模块store
export * from './modules/user'
export * from './modules/verification'
export * from './modules/bankcard'
export * from './modules/team'
export * from './modules/message'
export * from './user-manager'
export * from './platform'
