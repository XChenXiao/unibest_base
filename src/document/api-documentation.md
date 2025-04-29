# API接口文档

## 接口变更记录

### 2025-04-24
- `/api/user` 接口现在同时支持GET和POST两种请求方法，解决了某些客户端使用POST方法访问时返回405错误的问题

## 用户认证相关接口

### 用户注册
- 路径: `/api/register`
- 方法: `POST`
- 请求参数:
  - `name`: 用户名
  - `phone`: 手机号
  - `password`: 密码
  - `password_confirmation`: 确认密码
  - `referrer_invite_code`: 推荐人邀请码（可选）

### 用户登录
- 路径: `/api/login`
- 方法: `POST`
- 请求参数:
  - `login_id` 或 `mobile`: 登录凭证（手机号/邮箱）
  - `password`: 密码

### 获取用户信息
- 路径: `/api/user`
- 方法: `GET` 或 `POST`（两种方式均支持）
- Headers:
  - `Authorization`: Bearer {token}

### 用户登出
- 路径: `/api/logout`
- 方法: `POST`
- Headers:
  - `Authorization`: Bearer {token}

## 实名认证相关接口

### 提交实名认证
- 路径: `/api/verification/submit`
- 方法: `POST`
- Headers:
  - `Authorization`: Bearer {token}
- 请求参数:
  - `real_name`: 真实姓名
  - `id_card_number`: 身份证号码
  - `id_card_front`: 身份证正面照片
  - `id_card_back`: 身份证背面照片

### 查询认证状态
- 路径: `/api/verification/status`
- 方法: `GET`
- Headers:
  - `Authorization`: Bearer {token} 