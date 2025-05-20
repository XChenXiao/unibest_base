# 当前请求架构分析

## 请求实现结构

当前前端请求架构主要由以下几个部分组成：

### HTTP工具层

- **位置**: `src/utils/http.ts`
- **功能**: 基于uni.request封装的通用请求工具
- **特点**:
  - 提供Promise接口
  - 实现基本的错误处理
  - 封装了常用的HTTP方法(GET, POST, PUT, DELETE)
  - 自动处理认证Token

### 请求拦截器

- **位置**: `src/interceptors/request.ts`
- **功能**: 拦截请求和响应进行通用处理
- **特点**:
  - 自动添加基础URL
  - 处理认证Token
  - 添加通用请求头
  - 处理常见HTTP错误状态码

### API服务层

- **位置**: `src/service`目录
- **功能**: 按功能模块组织API请求
- **结构**:
  - `src/service/index` - 通用功能模块
  - `src/service/app` - 应用特定功能模块

### 状态管理

- **位置**: `src/store/user.ts`
- **功能**: 管理用户状态和认证信息
- **特点**:
  - 保存用户信息和认证状态
  - 提供数据获取方法
  - 处理用户余额更新

## 请求类型分类

根据应用中的请求模式，我们可以将请求分为以下几类：

### 1. 认证相关请求

- **位置**: `src/service/index/auth.ts`
- **主要接口**:
  - 登录/注册: `loginAPI`/`registerAPI`
  - 获取用户信息: `getUserInfoAPI`
  - 重置密码: `resetPasswordAPI`/`forgotPasswordAPI`
- **特点**:
  - 认证敏感
  - 可能包含较大的用户数据
  - 频率适中

### 2. 业务功能请求

- **主要模块**:
  - 银行卡管理 (`src/service/index/bankcard.ts`)
  - 实名认证 (`src/service/index/verification.ts`)
  - 提现操作 (`src/service/index/withdraw.ts`)
  - 消息通知 (`src/service/index/message.ts`)
  - 团队管理 (`src/service/index/team.ts`)
- **特点**:
  - 功能多样
  - 数据变更频率不一
  - 部分请求有依赖关系

### 3. 公共/平台请求

- **位置**: `src/service/index/platform.ts`
- **主要功能**:
  - 获取平台信息
  - 系统配置获取
- **特点**:
  - 变更频率低
  - 多页面共享数据

## 当前存在的问题

通过代码分析，我们发现以下几个主要问题：

### 1. 重复请求问题

- 在短时间内多次调用`fetchUserInfo`导致重复请求
- 缺少对相同请求的防抖和合并处理
- 页面切换时可能重复获取相同数据
- 示例问题代码：

  ```javascript
  // 在store/user.ts中可能被频繁调用
  const fetchUserInfo = async () => {
    if (!userInfo.value.token) return false

    try {
      const res = await getUserInfoAPI()
      // ...处理响应
    } catch (error) {
      console.error('获取用户信息失败', error)
    }
  }
  ```

### 2. 缓存机制缺失

- 没有实现请求数据的缓存
- 每次页面加载都重新请求所有数据
- 即使是低频变化的数据也频繁请求
- 示例问题：
  ```javascript
  // 每次进入页面都会重新请求平台信息
  onShow() {
    this.getPlatformInfo()
  }
  ```

### 3. 请求管理问题

- 缺少请求取消机制，可能导致竞态问题
- 页面切换或快速操作时请求可能堆积
- 没有请求超时和重试策略
- 未实现请求队列管理

### 4. 请求效率问题

- 没有针对频繁变化和不常变化数据的区分处理
- 未实现数据预加载策略
- 请求合并机制缺失
- 示例问题：
  ```javascript
  // 列表页可能会发起多个独立请求
  async loadListData() {
    await this.getCategories()
    await this.getListItems()
    await this.getFilterOptions()
    // 三个请求完全独立发送，没有合并
  }
  ```

### 5. 代码结构问题

- API服务层未完全模块化
- 请求参数和响应类型定义不统一
- 错误处理存在重复代码
- 部分API缺少TypeScript类型定义

## 结论

基于以上分析，我们需要从以下几个方面优化前端请求架构：

1. 建立请求缓存层，减少重复请求
2. 改进HTTP工具，支持请求取消和合并
3. 优化API服务层，应用缓存策略
4. 实现请求批处理和预加载
5. 标准化数据类型和错误处理

这些优化将显著提高前端性能，减少不必要的网络请求，并改善用户体验。
