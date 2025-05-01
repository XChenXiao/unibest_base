import { getEnvBaseUploadUrl } from './index'

/**
 * 图片上传服务基础URL
 */
const API_BASE_URL = getEnvBaseUploadUrl()

/**
 * 图片上传结果类型
 */
export interface IImageUploadResult {
  status: string
  message: string
  data?: {
    path: string
    url: string
    size?: number
    width?: number
    height?: number
    mime_type?: string
    original_name?: string
    thumbnail?: string
    file_path?: string
  }
}

/**
 * 图片类型枚举
 */
export enum ImageType {
  AVATAR = 'avatars',
  ID_CARD_FRONT = 'id_card_front',
  ID_CARD_BACK = 'id_card_back',
  COMMON = 'images'
}

/**
 * 压缩图片
 * @param filePath 图片本地路径
 * @returns Promise<string> 压缩后的图片路径
 */
export const compressImage = (filePath: string): Promise<string> => {
  return new Promise((resolve, reject) => {
    // 如果平台支持压缩
    if (uni.compressImage) {
      uni.compressImage({
        src: filePath,
        quality: 80,
        success: (res) => {
          resolve(res.tempFilePath)
        },
        fail: (err) => {
          console.warn('图片压缩失败，使用原图:', err)
          // 如果压缩失败，使用原图
          resolve(filePath)
        }
      })
    } else {
      // 不支持压缩，直接返回原图
      console.warn('当前平台不支持图片压缩，使用原图')
      resolve(filePath)
    }
  })
}

/**
 * 上传单张图片
 * @param filePath 图片本地路径
 * @param type 图片类型，默认为普通图片
 * @returns Promise
 */
export const uploadImage = async (
  filePath: string,
  type: ImageType = ImageType.COMMON
): Promise<IImageUploadResult> => {
  try {
    // 先压缩图片
    const compressedFilePath = await compressImage(filePath)
    
    // 使用API代理URL - 直接使用相对路径，让Vite的代理配置处理
    const uploadUrl = `/api/files/upload/file`
    
    // 确定folder参数
    const folder = type === ImageType.ID_CARD_FRONT || type === ImageType.ID_CARD_BACK 
      ? 'id_cards' 
      : 'files'
    
    // 打印实际请求参数，用于调试
    console.log('上传图片参数:', {
      url: uploadUrl,
      type: type.toString(),
      folder: folder
    })
    
    return new Promise((resolve, reject) => {
      // 获取token
      const token = uni.getStorageSync('token') || ''
      
      // 使用uni.uploadFile进行上传 - 这会自动设置正确的Content-Type: multipart/form-data
      uni.uploadFile({
        url: uploadUrl,
        filePath: compressedFilePath,
        name: 'file', // 文件字段名，与后端对应
        formData: {
          type: type.toString(), // 确保type是字符串类型
          folder: folder
        },
        header: {
          Authorization: token ? `Bearer ${token}` : '',
          'X-Requested-With': 'XMLHttpRequest'
          // 注意：不要手动设置Content-Type，uni.uploadFile会自动设置为multipart/form-data
        },
        success: (res) => {
          if (res.statusCode >= 200 && res.statusCode < 300) {
            try {
              const data = JSON.parse(res.data)
              if (data.status === 'success') {
                // 获取上传后的文件URL
                let fileUrl = ''
                if (data.data) {
                  if (typeof data.data === 'string') {
                    fileUrl = data.data
                  } else if (data.data.url) {
                    fileUrl = data.data.url
                  } else if (data.data.file_path) {
                    fileUrl = data.data.file_path
                  }
                }
                
                if (!fileUrl) {
                  reject({
                    status: 'error',
                    message: '上传成功但获取URL失败'
                  })
                  return
                }
                
                // 格式化返回结果
                const result: IImageUploadResult = {
                  status: 'success',
                  message: '上传成功',
                  data: {
                    path: data.data.file_path || '',
                    url: fileUrl
                  }
                }
                
                // 如果有附加信息，添加到结果中
                if (data.data.size) result.data!.size = data.data.size
                if (data.data.width) result.data!.width = data.data.width
                if (data.data.height) result.data!.height = data.data.height
                if (data.data.mime_type) result.data!.mime_type = data.data.mime_type
                if (data.data.original_name) result.data!.original_name = data.data.original_name
                if (data.data.thumbnail) result.data!.thumbnail = data.data.thumbnail
                if (data.data.file_path) result.data!.file_path = data.data.file_path
                
                resolve(result)
              } else {
                reject({
                  status: 'error',
                  message: data.message || '上传失败'
                })
              }
            } catch (error: any) {
              reject({
                status: 'error',
                message: '解析响应数据失败'
              })
            }
          } else {
            reject({
              status: 'error',
              message: `上传失败，状态码：${res.statusCode}`
            })
          }
        },
        fail: (err) => {
          console.error('图片上传出错:', err)
          reject({
            status: 'error',
            message: err.errMsg || '图片上传出错'
          })
        }
      })
    })
  } catch (error: any) {
    console.error('图片上传出错:', error)
    return {
      status: 'error',
      message: error.message || '图片上传出错'
    }
  }
}

/**
 * 上传身份证正面照片
 * @param filePath 图片本地路径
 * @returns Promise
 */
export const uploadIdCardFront = (
  filePath: string
): Promise<IImageUploadResult> => {
  return uploadImage(filePath, ImageType.ID_CARD_FRONT)
}

/**
 * 上传身份证背面照片
 * @param filePath 图片本地路径
 * @returns Promise
 */
export const uploadIdCardBack = (
  filePath: string
): Promise<IImageUploadResult> => {
  return uploadImage(filePath, ImageType.ID_CARD_BACK)
}

/**
 * 选择图片并上传
 * @param type 图片类型，默认为普通图片
 * @param options 选择图片选项
 * @returns Promise
 */
export const chooseAndUploadImage = (
  type: ImageType = ImageType.COMMON,
  options?: {
    count?: number
    sizeType?: Array<'original' | 'compressed'>
    sourceType?: Array<'album' | 'camera'>
  }
): Promise<IImageUploadResult> => {
  return new Promise((resolve, reject) => {
    // 显示加载中
    uni.showLoading({
      title: '正在选择图片...',
      mask: true
    })
    
    uni.chooseImage({
      count: options?.count || 1,
      sizeType: options?.sizeType || ['compressed'],
      sourceType: options?.sourceType || ['album', 'camera'],
      success: (res) => {
        // 更新显示加载状态
        uni.showLoading({
          title: '上传中...',
          mask: true
        })
        
        // 取第一张图片
        const tempFilePath = res.tempFilePaths[0]
        
        // 上传选中的图片
        uploadImage(tempFilePath, type)
          .then((result) => {
            // 隐藏加载提示
            uni.hideLoading()
            
            if (result.status === 'success') {
              uni.showToast({
                title: '上传成功',
                icon: 'success'
              })
              resolve(result)
            } else {
              throw new Error(result.message || '上传失败')
            }
          })
          .catch((error) => {
            // 隐藏加载提示
            uni.hideLoading()
            
            uni.showToast({
              title: error.message || '上传失败',
              icon: 'none'
            })
            reject(error)
          })
      },
      fail: (err) => {
        // 隐藏加载提示
        uni.hideLoading()
        
        console.error('选择图片失败', err)
        reject({
          status: 'error',
          message: '选择图片失败'
        })
      }
    })
  })
}

/**
 * 选择并上传身份证正面照片
 * @param options 选择图片选项
 * @returns Promise
 */
export const chooseAndUploadIdCardFront = (
  options?: {
    sourceType?: Array<'album' | 'camera'>
  }
): Promise<IImageUploadResult> => {
  return chooseAndUploadImage(ImageType.ID_CARD_FRONT, {
    sourceType: options?.sourceType,
    sizeType: ['compressed']
  })
}

/**
 * 选择并上传身份证背面照片
 * @param options 选择图片选项
 * @returns Promise
 */
export const chooseAndUploadIdCardBack = (
  options?: {
    sourceType?: Array<'album' | 'camera'>
  }
): Promise<IImageUploadResult> => {
  return chooseAndUploadImage(ImageType.ID_CARD_BACK, {
    sourceType: options?.sourceType,
    sizeType: ['compressed']
  })
}

export default {
  uploadImage,
  uploadIdCardFront,
  uploadIdCardBack,
  chooseAndUploadImage,
  chooseAndUploadIdCardFront,
  chooseAndUploadIdCardBack,
  compressImage,
  ImageType
} 