// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "forge-std/Script.sol";
import "../src/ManualOracle.sol";
import "../src/StableCoin.sol";
import "../src/StableFX.sol";

contract DeployScript is Script {
    function run() external {
        uint256 deployerPrivateKey = vm.envUint("PRIVATE_KEY");
        address deployer = vm.addr(deployerPrivateKey);
        vm.startBroadcast(deployerPrivateKey);
        
        // 创建初始白名单数组，只包含部署者地址
        address[] memory initialWhitelist = new address[](1);
        initialWhitelist[0] = deployer;
        
        // 部署稳定币合约
        StableCoin hkdc = new StableCoin("Hong Kong Dollar Coin", "HKDC", deployer, initialWhitelist);
        console.log("HKDC deployed at:", vm.toString(address(hkdc)));
        
        StableCoin sgdc = new StableCoin("Singapore Dollar Coin", "SGDC", deployer, initialWhitelist);
        console.log("SGDC deployed at:", vm.toString(address(sgdc)));
        
        // 部署预言机合约
        uint256 initialRate = 0.173 * 1e18;
        ManualOracle oracle = new ManualOracle(deployer, initialRate);
        console.log("Oracle deployed at:", vm.toString(address(oracle)));
        
        // 部署StableFX合约
        uint256 feeBps = 20;
        address feeTreasury = deployer;
        StableFX fx = new StableFX(deployer, address(hkdc), address(sgdc), address(oracle), feeBps, feeTreasury);
        console.log("StableFX deployed at:", vm.toString(address(fx)));
        
        // 为StableFX合约铸造一些代币用于流动性
        hkdc.mint(address(fx), 1000000 * 1e6); // 1,000,000 HKDC
        sgdc.mint(address(fx), 1000000 * 1e6); // 1,000,000 SGDC
        
        // 授予StableFX合约必要的角色
        bytes32 treasurerRole = fx.TREASURER_ROLE();
        bytes32 rateAdminRole = fx.RATE_ADMIN_ROLE();
        
        hkdc.grantRole(hkdc.MINTER_ROLE(), address(fx));
        sgdc.grantRole(sgdc.MINTER_ROLE(), address(fx));
        
        fx.grantRole(treasurerRole, deployer);
        fx.grantRole(rateAdminRole, deployer);
        
        // 为部署者账户铸造一些代币用于测试
        hkdc.mint(deployer, 10000 * 1e6); // 10,000 HKDC
        sgdc.mint(deployer, 10000 * 1e6); // 10,000 SGDC
        
        vm.stopBroadcast();
    }
}