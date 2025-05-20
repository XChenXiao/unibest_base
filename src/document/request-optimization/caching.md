# 请求缓存层设计

## 缓存层概述

请求缓存层是优化前端请求性能的核心组件，通过缓存已获取的数据，减少重复请求，提高响应速度。根据不同类型数据的特性，我们将设计具有不同缓存策略的缓存机制。

## 缓存层设计目标

- 减少重复请求，降低服务器负载
- 提高前端响应速度，改善用户体验
- 支持不同类型数据的差异化缓存策略
- 提供简单易用的API接口
- 确保数据的时效性和一致性

## 缓存类型分类

根据数据的变化频率，我们将缓存分为三种类型：

### 1. 静态缓存 (Static Cache)

- **适用场景**: 平台配置、系统公告、应用版本信息等
- **特点**:
  - 数据变化频率低
  - 多页面共享使用
  - 应用启动预加载
- **缓存时间**: 1小时或更长
- **刷新策略**: 应用启动、用户手动刷新或缓存过期时刷新

### 2. 用户数据缓存 (User Data Cache)

- **适用场景**: 用户信息、账户余额、认证状态等
- **特点**:
  - 数据变化频率中等
  - 用户操作可能导致变化
  - 需要在某些操作后主动刷新
- **缓存时间**: 5-10分钟
- **刷新策略**: 缓存过期、相关操作后刷新（如交易完成）

### 3. 短期缓存 (Short-lived Cache)

- **适用场景**: 列表数据、搜索结果、频繁变化的业务数据
- **特点**:
  - 数据变化频率高
  - 用户操作会频繁刷新
  - 短期内可能多次访问
- **缓存时间**: 30秒-1分钟
- **刷新策略**: 页面刷新、用户主动刷新、缓存过期时刷新

## 缓存实现方案

### 缓存类设计

我们将创建一个通用的RequestCache类，支持不同的缓存配置：

```typescript
// src/utils/requestCache.ts
interface CacheConfig {
  ttl: number // 缓存生存时间(毫秒)
  capacity?: number // 最大缓存条目数
  storageType?: 'memory' | 'localStorage' // 存储类型
}

interface CacheItem<T> {
  data: T // 缓存的数据
  timestamp: number // 缓存的时间戳
}

class RequestCache {
  private cache: Map<string, CacheItem<any>> = new Map()
  private config: CacheConfig

  constructor(config: CacheConfig) {
    this.config = {
      capacity: 100,
      storageType: 'memory',
      ...config,
    }

    // 如果使用localStorage，从存储中恢复缓存
    if (this.config.storageType === 'localStorage') {
      this.restoreFromStorage()
    }
  }

  // 设置缓存
  set<T>(key: string, data: T): void {
    // 缓存容量控制
    if (this.cache.size >= this.config.capacity && !this.cache.has(key)) {
      const oldestKey = this.getOldestKey()
      if (oldestKey) this.cache.delete(oldestKey)
    }

    // 存储数据和时间戳
    const item: CacheItem<T> = {
      data,
      timestamp: Date.now(),
    }

    this.cache.set(key, item)

    // 如果使用localStorage，更新存储
    if (this.config.storageType === 'localStorage') {
      this.saveToStorage()
    }
  }

  // 获取缓存
  get<T>(key: string): T | null {
    const item = this.cache.get(key)

    if (!item) return null

    // 检查是否过期
    if (Date.now() - item.timestamp > this.config.ttl) {
      this.cache.delete(key)
      return null
    }

    return item.data as T
  }

  // 清除所有缓存
  clear(): void {
    this.cache.clear()

    // 如果使用localStorage，清除存储
    if (this.config.storageType === 'localStorage') {
      this.clearStorage()
    }
  }

  // 获取剩余有效时间(毫秒)
  getRemainingTTL(key: string): number {
    const item = this.cache.get(key)

    if (!item) return 0

    const elapsed = Date.now() - item.timestamp
    return Math.max(0, this.config.ttl - elapsed)
  }

  // 移除指定缓存
  remove(key: string): void {
    this.cache.delete(key)

    // 如果使用localStorage，更新存储
    if (this.config.storageType === 'localStorage') {
      this.saveToStorage()
    }
  }

  // 判断缓存是否存在且有效
  has(key: string): boolean {
    const item = this.cache.get(key)

    if (!item) return false

    // 检查是否过期
    return Date.now() - item.timestamp <= this.config.ttl
  }

  // 获取最旧的缓存键
  private getOldestKey(): string | null {
    if (this.cache.size === 0) return null

    let oldestKey = null
    let oldestTime = Infinity

    for (const [key, item] of this.cache.entries()) {
      if (item.timestamp < oldestTime) {
        oldestTime = item.timestamp
        oldestKey = key
      }
    }

    return oldestKey
  }

  // localStorage存储相关方法
  private saveToStorage(): void {
    if (typeof localStorage === 'undefined') return

    try {
      const serializeData: Record<string, CacheItem<any>> = {}

      this.cache.forEach((value, key) => {
        serializeData[key] = value
      })

      localStorage.setItem('requestCache', JSON.stringify(serializeData))
    } catch (error) {
      console.error('保存缓存到存储失败:', error)
    }
  }

  private restoreFromStorage(): void {
    if (typeof localStorage === 'undefined') return

    try {
      const data = localStorage.getItem('requestCache')

      if (data) {
        const parsed = JSON.parse(data) as Record<string, CacheItem<any>>

        for (const [key, value] of Object.entries(parsed)) {
          // 检查是否过期
          if (Date.now() - value.timestamp <= this.config.ttl) {
            this.cache.set(key, value)
          }
        }
      }
    } catch (error) {
      console.error('从存储恢复缓存失败:', error)
    }
  }

  private clearStorage(): void {
    if (typeof localStorage === 'undefined') return

    try {
      localStorage.removeItem('requestCache')
    } catch (error) {
      console.error('清除存储缓存失败:', error)
    }
  }
}

// 导出三种不同配置的缓存实例
export const staticCache = new RequestCache({
  ttl: 3600000, // 1小时
  capacity: 50,
  storageType: 'localStorage',
})

export const userDataCache = new RequestCache({
  ttl: 300000, // 5分钟
  capacity: 20,
})

export const shortLivedCache = new RequestCache({
  ttl: 60000, // 1分钟
  capacity: 100,
})
```

### 缓存键生成策略

为确保缓存键的唯一性和准确性，我们将使用请求的URL、方法、参数等信息生成缓存键：

```typescript
// 生成请求的唯一缓存键
export const generateCacheKey = (options: {
  url: string
  method?: string
  data?: any
  query?: any
}): string => {
  return `${options.method || 'GET'}-${options.url}-${JSON.stringify(options.data || {})}-${JSON.stringify(options.query || {})}`
}
```

## 缓存使用策略

### 1. 请求时缓存控制

在发起请求时，通过选项控制缓存行为：

```typescript
// HTTP请求接口扩展
interface CacheOptions {
  useCache?: boolean // 是否使用缓存
  cacheType?: 'static' | 'userData' | 'shortLived' // 缓存类型
  forceRefresh?: boolean // 强制刷新缓存
}

// 使用示例
http.get<PlatformInfo>('/api/platform/info', undefined, {
  useCache: true,
  cacheType: 'static',
})
```

### 2. 缓存失效策略

根据业务操作自动失效相关缓存：

```typescript
// 例如，在登录后失效用户相关缓存
const login = async (params: LoginParams) => {
  const res = await loginAPI(params)

  if (res.status === 'success') {
    // 清除所有用户相关缓存
    userDataCache.clear()
  }

  return res
}

// 执行交易操作后，刷新余额相关缓存
const executeTrade = async (params: TradeParams) => {
  const res = await tradeAPI(params)

  if (res.status === 'success') {
    // 仅移除余额相关缓存
    userDataCache.remove('GET-/api/user/balance')
  }

  return res
}
```

### 3. 缓存预加载

在应用启动或页面加载时预加载常用数据：

```typescript
// App.vue中
export default {
  onLaunch() {
    // 预加载平台信息
    http.get<PlatformInfo>('/api/platform/info', undefined, {
      useCache: true,
      cacheType: 'static',
    })

    // 预加载全局配置
    http.get<GlobalConfig>('/api/config/global', undefined, {
      useCache: true,
      cacheType: 'static',
    })
  },
}
```

## 缓存监控与调试

为方便开发和调试，我们将提供缓存监控工具：

```typescript
// 缓存监控工具
export const cacheMonitor = {
  // 获取所有缓存统计信息
  getStats() {
    return {
      static: {
        size: getMapSize(staticCache.cache),
        items: getMapEntries(staticCache.cache),
      },
      userData: {
        size: getMapSize(userDataCache.cache),
        items: getMapEntries(userDataCache.cache),
      },
      shortLived: {
        size: getMapSize(shortLivedCache.cache),
        items: getMapEntries(shortLivedCache.cache),
      },
    }
  },

  // 清除所有缓存
  clearAll() {
    staticCache.clear()
    userDataCache.clear()
    shortLivedCache.clear()

    console.log('所有缓存已清除')
  },
}

// 开发环境下添加全局调试对象
if (process.env.NODE_ENV === 'development') {
  // @ts-ignore
  window.__cacheMonitor = cacheMonitor
}
```

## 实施步骤

1. 创建RequestCache类及三种缓存实例
2. 扩展HTTP工具，支持缓存选项
3. 更新API服务层，应用适当的缓存策略
4. 调整Store中的数据获取方法，利用缓存
5. 实现缓存监控工具
6. 在关键业务操作中添加缓存失效逻辑

## 结论

通过实现请求缓存层，我们可以显著减少不必要的网络请求，提高前端应用的响应速度和用户体验。缓存层的设计考虑了不同类型数据的特性，提供了灵活的缓存策略和简单易用的API接口。在实施过程中，我们需要仔细评估每个API的缓存策略，确保数据的时效性和一致性。
