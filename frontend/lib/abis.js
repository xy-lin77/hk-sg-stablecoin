export const ABI = {
  // ERC20 最小读写
  ERC20: [
    "function balanceOf(address) view returns (uint256)",
    "function allowance(address,address) view returns (uint256)",
    "function approve(address,uint256) returns (bool)",
    "function transfer(address,uint256) returns (bool)",
    "function decimals() view returns (uint8)",
    "function symbol() view returns (string)",
  ],

  // ManualOracle
  ORACLE: [
    {
      type: "function",
      name: "getRate",
      stateMutability: "view",
      inputs: [],
      outputs: [
        { type: "uint256", name: "rateSgdPerHkd" },
        { type: "uint256", name: "updatedAt" },
      ],
    },
    // 事件：RateUpdated(uint256,uint256)
    {
      type: "event",
      name: "RateUpdated",
      inputs: [
        { indexed: false, type: "uint256", name: "rateSgdPerHkd" },
        { indexed: false, type: "uint256", name: "timestamp" },
      ],
    },
  ],

  // StableFX
  FX: [
    {
      type: "function",
      name: "swapExactIn",
      stateMutability: "nonpayable",
      inputs: [
        { type: "address", name: "tokenIn" },
        { type: "address", name: "tokenOut" },
        { type: "uint256", name: "amountIn" },
      ],
      outputs: [
        { type: "uint256", name: "amountOut" },
        { type: "uint256", name: "fee" },
      ],
    },
    {
      type: "function",
      name: "feeBps",
      stateMutability: "view",
      inputs: [],
      outputs: [{ type: "uint256" }],
    },
    {
      type: "function",
      name: "feeTreasury",
      stateMutability: "view",
      inputs: [],
      outputs: [{ type: "address" }],
    },
    {
      type: "function",
      name: "oracle",
      stateMutability: "view",
      inputs: [],
      outputs: [{ type: "address" }],
    },
    // 事件（可选用）：Swapped(...)
    {
      type: "event",
      name: "Swapped",
      inputs: [
        { indexed: true, type: "address", name: "user" },
        { indexed: true, type: "address", name: "tokenIn" },
        { indexed: true, type: "address", name: "tokenOut" },
        { indexed: false, type: "uint256", name: "amountIn" },
        { indexed: false, type: "uint256", name: "amountOut" },
        { indexed: false, type: "uint256", name: "fee" },
      ],
    },
  ],
};
