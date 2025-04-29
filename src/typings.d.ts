// 全局要用的类型放到这里

declare global {
  type IResData<T> = {
    status: 'success' | 'error'
    message?: string
    data?: T
  }

  // uni.uploadFile文件上传参数
  type IUniUploadFileOptions = {
    file?: File
    files?: UniApp.UploadFileOptionFiles[]
    filePath?: string
    name?: string
    formData?: any
  }

  type IUserInfo = {
    nickname?: string
    avatar?: string
    /** 微信的 openid，非微信没有这个字段 */
    openid?: string
    token?: string
    /** 用户ID */
    id?: number
    /** 用户名 */
    name?: string
    /** 手机号 */
    phone?: string
    /** 邮箱 */
    email?: string
  }
  
  /** 分页数据结构 */
  type IPagination<T> = {
    current_page: number
    data: T[]
    first_page_url: string
    from: number
    last_page: number
    last_page_url: string
    next_page_url: string | null
    path: string
    per_page: number
    prev_page_url: string | null
    to: number
    total: number
  }
}

export {} // 防止模块污染
