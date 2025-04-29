# API接口响应格式文档

## 基本响应格式

所有API接口都遵循统一的JSON响应格式，包含以下字段：

```json
{
  "status": "success|error",
  "message": "操作结果的描述信息",
  "data": {
    // 返回的数据对象，仅在成功响应时存在
  }
}
```

### 字段说明

| 字段名 | 类型 | 说明 |
|-------|------|------|
| status | string | 响应状态，值为"success"或"error" |
| message | string | 响应消息，描述操作结果 |
| data | object/array | 响应数据，仅在成功响应时返回 |

## 响应状态码

API使用标准HTTP状态码表示请求结果：

| 状态码 | 说明 |
|-------|------|
| 200 | 请求成功 |
| 201 | 资源创建成功 |
| 400 | 错误的请求参数 |
| 401 | 未授权（未登录或token无效） |
| 403 | 权限不足 |
| 404 | 请求的资源不存在 |
| 422 | 请求参数验证失败 |
| 500 | 服务器内部错误 |

## 成功响应示例

### 获取数据

```json
{
  "status": "success",
  "data": {
    "id": 1,
    "name": "示例名称",
    "created_at": "2023-01-01T00:00:00Z"
  }
}
```

### 创建资源

```json
{
  "status": "success",
  "message": "创建成功",
  "data": {
    "id": 1,
    "name": "示例名称",
    "created_at": "2023-01-01T00:00:00Z"
  }
}
```

### 分页数据

```json
{
  "status": "success",
  "data": {
    "current_page": 1,
    "data": [
      {
        "id": 1,
        "name": "示例1"
      },
      {
        "id": 2,
        "name": "示例2"
      }
    ],
    "first_page_url": "http://example.com/api/resources?page=1",
    "from": 1,
    "last_page": 5,
    "last_page_url": "http://example.com/api/resources?page=5",
    "next_page_url": "http://example.com/api/resources?page=2",
    "path": "http://example.com/api/resources",
    "per_page": 15,
    "prev_page_url": null,
    "to": 15,
    "total": 75
  }
}
```

## 错误响应示例

### 验证错误

```json
{
  "status": "error",
  "message": "手机号码已被使用"
}
```

### 未授权错误

```json
{
  "status": "error",
  "message": "未授权，请先登录"
}
```

### 权限错误

```json
{
  "status": "error",
  "message": "您没有管理员权限"
}
```

### 服务器错误

```json
{
  "status": "error",
  "message": "服务器内部错误，请稍后再试"
}
```

## 常见业务错误码

除了HTTP状态码外，某些业务场景下可能还会返回特定的错误码，前端可根据错误码进行相应处理：

| 错误码 | 说明 | HTTP状态码 |
|-------|------|----------|
| 1001 | 用户名或密码错误 | 401 |
| 1002 | 账户已被禁用 | 403 |
| 2001 | 余额不足 | 422 |
| 2002 | 超出交易限额 | 422 |
| 3001 | 验证码错误或已过期 | 422 |
| 3002 | 验证码发送次数超限 | 429 |

## 特殊接口响应

### 文件上传

```json
{
  "status": "success",
  "message": "文件上传成功",
  "data": {
    "file_path": "/storage/uploads/example.jpg",
    "url": "http://example.com/storage/uploads/example.jpg"
  }
}
```

### 认证接口

#### 登录

```json
{
  "status": "success",
  "message": "登录成功",
  "data": {
    "user": {
      "id": 1,
      "name": "用户名",
      "phone": "13800138000",
      "email": "user@example.com"
    },
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
    "token_type": "Bearer"
  }
}
```

#### 注册

```json
{
  "status": "success",
  "message": "注册成功，请完成实名认证以获取注册奖励",
  "data": {
    "user": {
      "id": 1,
      "name": "用户名",
      "phone": "13800138000"
    },
    "access_token": "eyJ0eXAiOiJKV1QiLCJhbGciOiJSUzI1NiJ9...",
    "token_type": "Bearer",
    "requires_verification": true
  }
}
```

## 前端调用示例

### 发起请求

```javascript
// 使用axios发起请求
axios.get('/api/user/info', {
  headers: {
    'Authorization': `Bearer ${token}`
  }
})
.then(response => {
  if (response.data.status === 'success') {
    // 处理成功响应
    const userData = response.data.data;
    // 更新界面
  } else {
    // 处理业务错误
    const errorMessage = response.data.message;
    // 显示错误信息
  }
})
.catch(error => {
  // 处理HTTP错误
  if (error.response) {
    // 服务器返回错误状态码
    const errorMessage = error.response.data.message || '请求失败';
    const status = error.response.status;
    
    if (status === 401) {
      // 未授权，重定向到登录页
    } else if (status === 422) {
      // 表单验证错误
    } else {
      // 其他错误
    }
  } else {
    // 网络错误或请求被取消
  }
});
```

## 注意事项

1. 所有请求都需要在headers中携带有效的`Authorization`头，格式为`Bearer {token}`，除非是公开API（如登录、注册）
2. 验证失败的请求会返回422状态码和具体的错误信息
3. 身份验证失败会返回401状态码，此时前端应重定向到登录页面
4. 权限不足会返回403状态码
5. 分页数据中包含完整的分页信息，前端可根据这些信息构建分页控件 