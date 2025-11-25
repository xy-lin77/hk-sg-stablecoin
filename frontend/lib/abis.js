export const ABI = {
  // ERC20 最小读写
  ERC20: [
    { "type":"function","name":"symbol","stateMutability":"view","inputs":[],"outputs":[{"type":"string"}]},
    { "type":"function","name":"decimals","stateMutability":"view","inputs":[],"outputs":[{"type":"uint8"}]},
    { "type":"function","name":"balanceOf","stateMutability":"view","inputs":[{"type":"address","name":"a"}],"outputs":[{"type":"uint256"}]},
    { "type":"function","name":"approve","stateMutability":"nonpayable","inputs":[{"type":"address","name":"spender"},{"type":"uint256","name":"amount"}],"outputs":[]}
  ],

  // ManualOracle
  ORACLE: [
    { "type":"function","name":"getRate","stateMutability":"view","inputs":[],"outputs":[
      {"type":"uint256","name":"rateSgdPerHkd"},
      {"type":"uint256","name":"updatedAt"}
    ]},
    // 事件：RateUpdated(uint256,uint256)
    { "type":"event","name":"RateUpdated","inputs":[
      {"indexed":false,"type":"uint256","name":"rateSgdPerHkd"},
      {"indexed":false,"type":"uint256","name":"timestamp"}
    ]}
  ],

  // StableFX
  FX: [
    { "type":"function","name":"swapExactIn","stateMutability":"nonpayable","inputs":[
      {"type":"address","name":"tokenIn"},
      {"type":"address","name":"tokenOut"},
      {"type":"uint256","name":"amountIn"},
      {"type":"uint256","name":"minOut"},
      {"type":"uint256","name":"maxAge"}
    ],"outputs":[{"type":"uint256","name":"amountOut"},{"type":"uint256","name":"fee"}]},
    { "type":"function","name":"feeBps","stateMutability":"view","inputs":[],"outputs":[{"type":"uint256"}]},
    { "type":"function","name":"feeTreasury","stateMutability":"view","inputs":[],"outputs":[{"type":"address"}]},
    { "type":"function","name":"oracle","stateMutability":"view","inputs":[],"outputs":[{"type":"address"}]},
    // 事件（可选用）：Swapped(...)
    { "type":"event","name":"Swapped","inputs":[
      {"indexed":true,"type":"address","name":"user"},
      {"indexed":true,"type":"address","name":"tokenIn"},
      {"indexed":true,"type":"address","name":"tokenOut"},
      {"indexed":false,"type":"uint256","name":"amountIn"},
      {"indexed":false,"type":"uint256","name":"amountOut"},
      {"indexed":false,"type":"uint256","name":"fee"}
    ]}
  ],
};
