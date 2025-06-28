import React from 'react';
import { BankEnum, getBankIconPath } from '../enums/BankEnum';

/**
 * 银行图标示例组件
 */
const BankIconExample: React.FC = () => {
  // 常用银行列表
  const commonBanks = [
    BankEnum.BANK_OF_CHINA,
    BankEnum.ICBC,
    BankEnum.CCB,
    BankEnum.ABC,
    BankEnum.BOCOM,
    BankEnum.PSBC,
    BankEnum.CMB,
    BankEnum.CITIC,
    BankEnum.SPDB,
    BankEnum.CIB,
    BankEnum.CMBC,
    BankEnum.HXB,
    BankEnum.PAB
  ];

  return (
    <div className="bank-icon-example">
      <h2>银行图标示例</h2>
      
      <h3>常用银行</h3>
      <div className="bank-list">
        {commonBanks.map((bank) => (
          <div key={bank} className="bank-item">
            <img src={getBankIconPath(bank)} alt={bank} className="bank-icon" />
            <span className="bank-name">{bank}</span>
          </div>
        ))}
      </div>
      
      <h3>使用示例代码</h3>
      <pre>
        {`
// 引入银行枚举
import { BankEnum, getBankIconPath } from '../enums/BankEnum';

// 使用银行图标
<img src={getBankIconPath(BankEnum.ICBC)} alt="工商银行" />
<img src={getBankIconPath(BankEnum.CMB)} alt="招商银行" />
        `}
      </pre>
      
      <h3>所有银行图标</h3>
      <div className="bank-list">
        {Object.values(BankEnum).map((bank) => (
          <div key={bank} className="bank-item">
            <img src={getBankIconPath(bank)} alt={bank} className="bank-icon" />
            <span className="bank-name">{bank}</span>
          </div>
        ))}
      </div>
      
      <style jsx>{`
        .bank-list {
          display: flex;
          flex-wrap: wrap;
          gap: 16px;
        }
        
        .bank-item {
          display: flex;
          flex-direction: column;
          align-items: center;
          width: 100px;
          margin-bottom: 16px;
        }
        
        .bank-icon {
          width: 40px;
          height: 40px;
          object-fit: contain;
          margin-bottom: 8px;
        }
        
        .bank-name {
          font-size: 12px;
          text-align: center;
        }
        
        pre {
          background-color: #f5f5f5;
          padding: 16px;
          border-radius: 4px;
          overflow-x: auto;
        }
      `}</style>
    </div>
  );
};

export default BankIconExample; 