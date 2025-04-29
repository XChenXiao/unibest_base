import { CustomRequestOptions } from '@/interceptors/request'

/**
 * 文件上传响应接口
 */
export interface IUploadResponse {
  file_path: string
  url: string
}

/**
 * 文件上传选项接口
 */
export interface IUploadOptions extends Omit<CustomRequestOptions, 'filePath' | 'name'> {
  /** 要上传文件资源的路径 */
  filePath: string
  /** 文件对应的 key，开发者在服务器端通过这个 key 可以获取到文件二进制内容 */
  name?: string
  /** 上传的文件名称，非文件路径，仅支持H5 */
  fileName?: string
  /** HTTP 请求中其他额外的 form data */
  formData?: Record<string, any>
  /** 超时时间，单位为ms */
  timeout?: number
}

/**
 * 文件上传函数
 * @param url 上传地址
 * @param options 上传选项
 * @returns Promise
 */
export const uploadFile = (url: string, options: IUploadOptions): Promise<IResData<IUploadResponse>> => {
  return new Promise((resolve, reject) => {
    // 获取必要参数
    const { filePath, name = 'file', formData = {}, header = {} } = options

    uni.uploadFile({
      url,
      filePath,
      name,
      formData,
      header,
      timeout: options.timeout || 60000, // 默认60秒超时
      success: (res) => {
        if (res.statusCode >= 200 && res.statusCode < 300) {
          try {
            const data = JSON.parse(res.data) as IResData<IUploadResponse>
            if (data.status === 'success') {
              resolve(data)
            } else {
              reject(data)
            }
          } catch (error) {
            reject({
              status: 'error',
              message: '解析响应数据失败',
            })
          }
        } else {
          reject({
            status: 'error',
            message: `上传失败，状态码：${res.statusCode}`,
          })
        }
      },
      fail: (err) => {
        uni.showToast({
          icon: 'none',
          title: '文件上传失败，请重试',
        })
        reject({
          status: 'error',
          message: '文件上传失败',
          data: err,
        })
      },
    })
  })
}

/**
 * 从相册选择图片并上传
 * @param url 上传地址
 * @param options 上传选项
 * @returns Promise
 */
export const chooseImageAndUpload = (
  url: string,
  options?: Omit<IUploadOptions, 'filePath'>
): Promise<IResData<IUploadResponse>> => {
  return new Promise((resolve, reject) => {
    uni.chooseImage({
      count: 1,
      success: (res) => {
        const tempFilePath = res.tempFilePaths[0]
        uploadFile(url, {
          ...options,
          filePath: tempFilePath,
        })
          .then(resolve)
          .catch(reject)
      },
      fail: () => {
        reject({
          status: 'error',
          message: '选择图片失败',
        })
      },
    })
  })
}

export default {
  uploadFile,
  chooseImageAndUpload,
} 