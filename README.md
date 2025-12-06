# Local Deployment Guide (Anvil + Foundry)

This guide explains how to deploy all stablecoin-related smart contracts (HKDC, SGDC, Oracle, StableFX) onto a local Anvil blockchain.

## 1 Install Dependencies and Compile Contracts

```
cd contract
forge install OpenZeppelin/openzeppelin-contracts@v5.5.0
forge build
```

## 2 Start Local Blockchain (Anvil)

Open a terminal tab and run:

```
anvil
```

Anvil will start at:

RPC URL: http://127.0.0.1:8545

Chain ID: 31337

⚠️ Add the Anvil local network to MetaMask and import the Anvil virtual accounts into MetaMask. [Not sure how to do it?](https://support.metamask.io/start/use-an-existing-wallet)

## 3 Deploy HKDC Stablecoin

Open a NEW terminal tab and run:

⚠️ Change directory to "contracts"

```
cd contracts
```

Deploy command
⚠️ In this example, we select Account(0) as admin of HKDC, SGDC, Oracle, and FX.
Account(0):
Address: 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266,
Private Key: 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80

We only include Account(0) and Account(1) in the whitelist during initialization.

```
forge create src/StableCoin.sol:StableCoin \
 --rpc-url http://127.0.0.1:8545 \
 --broadcast \
 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
 --constructor-args \
 "HKD Stable Coin" \
 "HKDC" \
 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
 '[0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266,       0x70997970C51812dc3A010C7d01b50e0d17dc79C8]'
```

## 4 Deploy SGDC Stablecoin

```
forge create src/StableCoin.sol:StableCoin \
 --rpc-url http://127.0.0.1:8545 \
 --broadcast \
 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
 --constructor-args \
 "SGD Stable Coin" \
 "SGDC" \
 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
 '[0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266,       0x70997970C51812dc3A010C7d01b50e0d17dc79C8]'
```

## 5 Deploy Manual Oracle

Set the initial HKD/SGD price to 0.173 (× 1e18).

```
forge create src/ManualOracle.sol:ManualOracle \
 --rpc-url http://127.0.0.1:8545 \
 --broadcast \
 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
 --constructor-args \
 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
 173000000000000000
```

## 6 Deploy StableFX (Swap Engine)

⚠️ Replace the HKDC, SGDC, and Oracle addresses below with the actual deployment output from steps 3–5 if they are different from the example.

```
forge create src/StableFX.sol:StableFX \
 --rpc-url http://127.0.0.1:8545 \
 --broadcast \
 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 \
 --constructor-args \
 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266 \
 0x5FbDB2315678afecb367f032d93F642f64180aa3 \
 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 \
 0x9fE46736679d2D9a65F0992F2272dE9f3c7fa6e0 \
 20 \
 0xf39Fd6e51aad88F6F4ce6aB8827279cffFb92266
```

## 7 Add deployed StableFX to whitelists of HKDC and SGDC

HKDC

```
cast send 0x5FbDB2315678afecb367f032d93F642f64180aa3 "setWhitelist(address,bool)" 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 true --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545
```

SGDC

```
cast send 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 "setWhitelist(address,bool)" 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 true --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545
```

## 8 Mint 1000 HKDC / SGDC to Admin / Account(1) / deployed StableFX

1000 HKDC -> Admin [Account(0)]

```
cast send 0x5FbDB2315678afecb367f032d93F642f64180aa3 "mint(address,uint256)" 0xf39fd6e51aad88f6f4ce6ab8827279cfffb92266 1000000000 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545
```

1000 SGDC -> Admin [Account(0)]

```
cast send 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 "mint(address,uint256)" 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 1000000000 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545
```

1000 HKDC -> Account(1)

```
cast send 0x5FbDB2315678afecb367f032d93F642f64180aa3 "mint(address,uint256)" 0x70997970C51812dc3A010C7d01b50e0d17dc79C8 1000000000 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545
```

1000 SGDC -> Account(1)

```
cast send 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 "mint(address,uint256)" 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 1000000000 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545
```

1000 HKDC -> deployed StableFX

```
cast send 0x5FbDB2315678afecb367f032d93F642f64180aa3 "mint(address,uint256)" 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 1000000000 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545
```

1000 SGDC -> deployed StableFX

```
cast send 0xe7f1725E7734CE288F8367e1Bb143E90bb3F0512 "mint(address,uint256)" 0xCf7Ed3AccA5a467e9e704C703E8D87F634fB0Fc9 1000000000 --private-key 0xac0974bec39a17e36ba4a6b4d238ff944bacb478cbed5efcae784d7bf4f2ff80 --rpc-url http://127.0.0.1:8545
```

## 9 Run frontend Next.js

Open a NEW terminal tab and run:

```
cd frontend
npm run dev
```

## 10 Front-end and Back-end Joint Testing

Open Google Chrome with MetaMask extensions. Paste and goto the URL: http://192.168.32.160:3000
