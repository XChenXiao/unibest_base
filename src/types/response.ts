/**
 * 通用API响应接口
 */
export interface IResData<T = any> {
  success: boolean;
  status?: string;
  data?: T;
  message?: string;
  errors?: Record<string, string[]>;
  code?: number;
} 