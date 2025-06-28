/**
 * 银行图标使用示例
 * 
 * 本文件展示如何在代码中使用银行枚举
 * 银行图片文件名现在使用英文枚举名，如：ICBC.png、CMB.png 等
 */
import { BankEnum, getBankIconPath } from '../enums/BankEnum';

/**
 * 示例1: 获取单个银行图标路径
 */
export const getIcbcIconPath = (): string => {
  // 使用工商银行枚举
  return getBankIconPath(BankEnum.ICBC);
};

/**
 * 示例2: 获取多个常用银行图标路径
 */
export const getCommonBankIconPaths = (): Record<string, string> => {
  const commonBanks = {
    '工商银行': BankEnum.ICBC,
    '建设银行': BankEnum.CCB,
    '农业银行': BankEnum.ABC,
    '中国银行': BankEnum.BANK_OF_CHINA,
    '交通银行': BankEnum.BOCOM,
    '招商银行': BankEnum.CMB,
  };
  
  const result: Record<string, string> = {};
  
  // 遍历常用银行，获取图标路径
  Object.entries(commonBanks).forEach(([bankName, bankEnum]) => {
    result[bankName] = getBankIconPath(bankEnum);
  });
  
  return result;
};

/**
 * 示例3: 根据银行名称获取图标路径
 */
export const getBankIconPathByName = (bankName: string): string | null => {
  // 查找匹配的银行枚举
  const bankEnum = Object.values(BankEnum).find(value => value === bankName);
  
  if (bankEnum) {
    return getBankIconPath(bankEnum);
  }
  
  return null;
};

/**
 * 示例4: 获取所有银行的图标路径
 */
export const getAllBankIconPaths = (): Record<string, string> => {
  const result: Record<string, string> = {};
  
  // 遍历所有银行枚举
  Object.values(BankEnum).forEach(bank => {
    result[bank] = getBankIconPath(bank);
  });
  
  return result;
};

/**
 * 使用示例
 */
// 获取工商银行图标路径
const icbcIconPath = getIcbcIconPath();
console.log('工商银行图标路径:', icbcIconPath); // 输出: /src/static/images/bank/ICBC.png

// 获取常用银行图标路径
const commonBankIcons = getCommonBankIconPaths();
console.log('常用银行图标路径:', commonBankIcons);
// 输出: { '工商银行': '/src/static/images/bank/ICBC.png', ... }

// 根据名称获取银行图标路径
const abcIconPath = getBankIconPathByName('农业银行');
console.log('农业银行图标路径:', abcIconPath); // 输出: /src/static/images/bank/ABC.png

// 获取所有银行图标路径
const allBankIcons = getAllBankIconPaths();
console.log('银行总数:', Object.keys(allBankIcons).length); 