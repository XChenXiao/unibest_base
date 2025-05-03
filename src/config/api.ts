// API基础URL配置
export const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8000';

// API版本
export const API_VERSION = 'v1';

// 完整API路径
export const getFullApiUrl = (endpoint: string) => {
  // 如果endpoint已经包含了完整URL，直接返回
  if (endpoint.startsWith('http')) {
    return endpoint;
  }
  
  // 确保endpoint不以斜杠开头
  const formattedEndpoint = endpoint.startsWith('/') ? endpoint.substring(1) : endpoint;
  
  return `${API_URL}/${formattedEndpoint}`;
}; 