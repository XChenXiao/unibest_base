# 银行枚举使用说明

本文档介绍如何使用 `BankEnum` 枚举来在代码中引用银行图标。

## 简介

`BankEnum` 是一个TypeScript枚举，提供了中英文对照的银行名称索引，方便在代码中引用银行图标。枚举值为银行的中文名称，而图片文件名使用英文枚举名，如：`ICBC.png`、`CMB.png` 等。

## 使用方法

### 1. 引入枚举

```typescript
import { BankEnum, getBankIconPath } from '../enums/BankEnum';
```

### 2. 使用枚举获取银行图标路径

```typescript
// 获取工商银行图标路径
const icbcIconPath = getBankIconPath(BankEnum.ICBC);
// 结果: "/src/static/images/bank/ICBC.png"

// 获取招商银行图标路径
const cmbIconPath = getBankIconPath(BankEnum.CMB);
// 结果: "/src/static/images/bank/CMB.png"
```

### 3. 在组件中使用

```tsx
// React组件中使用
<img src={getBankIconPath(BankEnum.ICBC)} alt="工商银行" />
```

### 4. 根据银行名称获取图标路径

```typescript
// 查找匹配的银行枚举
const getBankIconPathByName = (bankName: string): string | null => {
  const bankEnum = Object.values(BankEnum).find(value => value === bankName);
  
  if (bankEnum) {
    return getBankIconPath(bankEnum);
  }
  
  return null;
};

// 使用
const abcIconPath = getBankIconPathByName('农业银行');
// 结果: "/src/static/images/bank/ABC.png"
```

## 银行分类

枚举中的银行按照以下分类组织：

1. 国有大型银行（如：工商银行、建设银行等）
2. 股份制商业银行（如：招商银行、中信银行等）
3. 城市商业银行（如：上海银行、北京银行等）
4. 农商行/农信社/农合行（如：上海农商银行、北京农商银行等）
5. 其他银行

## 完整示例

请参考 `src/examples/BankIconUsage.ts` 文件，其中包含了多种使用场景的示例代码。

## 维护与更新

如需添加新的银行图标：

1. 将新的银行图标文件放入 `/src/static/images/bank/` 目录，使用英文枚举名命名
2. 在 `BankEnum` 枚举中添加对应的条目
3. 按照银行类型将其归类到适当的分组中 