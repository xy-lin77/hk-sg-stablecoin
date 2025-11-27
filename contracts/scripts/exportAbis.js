const fs = require('fs');

// 读取编译后的ABI文件
const hkdcArtifact = require('../out/StableCoin.sol/StableCoin.json');
const sgdcArtifact = require('../out/StableCoin.sol/StableCoin.json');
const oracleArtifact = require('../out/ManualOracle.sol/ManualOracle.json');
const fxAritifact = require('../out/StableFX.sol/StableFX.json');

// 准备ABI对象
const abis = {
  HKDC: hkdcArtifact.abi,
  SGDC: sgdcArtifact.abi,
  ORACLE: oracleArtifact.abi,
  FX: fxAritifact.abi,
  // 保留ERC20 ABI用于其他标准ERC20操作
  ERC20: hkdcArtifact.abi.filter(item => 
    item.type === 'function' && 
    ['balanceOf', 'transfer', 'approve', 'allowance', 'transferFrom'].includes(item.name)
  )
};

// 写入前端ABI文件
const abiContent = `export const ABI = {\n` +
  `  HKDC: ${JSON.stringify(abis.HKDC, null, 2)},\n` +
  `  SGDC: ${JSON.stringify(abis.SGDC, null, 2)},\n` +
  `  ORACLE: ${JSON.stringify(abis.ORACLE, null, 2)},\n` +
  `  FX: ${JSON.stringify(abis.FX, null, 2)},\n` +
  `  ERC20: ${JSON.stringify(abis.ERC20, null, 2)},\n` +
  `};\n`;

fs.writeFileSync('../frontend/lib/abis.js', abiContent);
console.log('ABIs exported successfully to frontend/lib/abis.js');