// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {IERC20} from "@openzeppelin/contracts/token/ERC20/IERC20.sol";
import {SafeERC20} from "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";
import {ReentrancyGuard} from "@openzeppelin/contracts/utils/ReentrancyGuard.sol";

interface IManualOracle {
    function getRate() external view returns (uint256 rateSgdPerHkd, uint256 updatedAt);
}

/**
 * @title StableFX
 * @notice Exchange counter for HKDC <-> SGDC swaps based on the real-time FX rate.
 * - Depends on ManualOracle, which provides SGD per 1 HKD (18 decimals)
 * - Contract must hold sufficient liquidity for both tokens
 * - Output amount is charged with platform fee (feeBps)
 */
contract StableFX is AccessControl, ReentrancyGuard {
    using SafeERC20 for IERC20;

    bytes32 public constant TREASURER_ROLE = keccak256("TREASURER_ROLE"); // Liquidity manager
    bytes32 public constant RATE_ADMIN_ROLE = keccak256("RATE_ADMIN_ROLE"); // Parameter/rate administrator
    uint256 public constant BPS_DENOM = 10_000; // 10000 = 100%

    IERC20 public immutable HKDC;
    IERC20 public immutable SGDC;
    IManualOracle public oracle;

    uint256 public feeBps; // e.g., 20 = 0.20%
    address public feeTreasury; // Address receiving the fee

    event Swapped(
        address indexed user,
        address indexed tokenIn,
        address indexed tokenOut,
        uint256 amountIn,
        uint256 amountOut,
        uint256 fee
    );
    event FeeParamsUpdated(uint256 feeBps, address feeTreasury);
    event OracleUpdated(address oracle);
    event Rescue(address token, uint256 amount, address to);

    constructor(address admin, address hkdc, address sgdc, address oracle_, uint256 feeBps_, address feeTreasury_) {
        require(admin != address(0) && hkdc != address(0) && sgdc != address(0) && oracle_ != address(0), "zero addr");
        require(feeBps_ < BPS_DENOM, "fee too high");
        require(feeTreasury_ != address(0), "zero treasury");

        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(TREASURER_ROLE, admin);
        _grantRole(RATE_ADMIN_ROLE, admin);

        HKDC = IERC20(hkdc);
        SGDC = IERC20(sgdc);
        oracle = IManualOracle(oracle_);
        feeBps = feeBps_;
        feeTreasury = feeTreasury_;
    }

    // -------- Management --------

    function setFeeParams(uint256 newFeeBps, address newTreasury) external onlyRole(RATE_ADMIN_ROLE) {
        require(newFeeBps < BPS_DENOM, "fee too high");
        require(newTreasury != address(0), "zero treasury");
        feeBps = newFeeBps;
        feeTreasury = newTreasury;
        emit FeeParamsUpdated(newFeeBps, newTreasury);
    }

    function setOracle(address newOracle) external onlyRole(RATE_ADMIN_ROLE) {
        require(newOracle != address(0), "zero oracle");
        oracle = IManualOracle(newOracle);
        emit OracleUpdated(newOracle);
    }

    /**
     * @notice Withdraw contract liquidity (operations management)
     */
    function rescue(address token, uint256 amount, address to) external onlyRole(TREASURER_ROLE) {
        IERC20(token).safeTransfer(to, amount);
        emit Rescue(token, amount, to);
    }

    // -------- Main Swap Logic --------
    /**
     * @param tokenIn   HKDC or SGDC address
     * @param tokenOut  The other token address (must not equal tokenIn)
     * @param amountIn  Amount input by user (18 decimals)
     * @param minOut    Minimum acceptable output to protect against stale/changed price
     * @param maxAge    Maximum allowed oracle price age in seconds (e.g., 600)
     */
    function swapExactIn(address tokenIn, address tokenOut, uint256 amountIn, uint256 minOut, uint256 maxAge)
        external
        nonReentrant
        returns (uint256 amountOut, uint256 fee)
    {
        require(amountIn > 0, "zero amount");
        require(
            (tokenIn == address(HKDC) && tokenOut == address(SGDC))
                || (tokenIn == address(SGDC) && tokenOut == address(HKDC)),
            "invalid pair"
        );

        (uint256 rateSgdPerHkd, uint256 updatedAt) = oracle.getRate();
        require(rateSgdPerHkd > 0, "bad rate");
        require(block.timestamp - updatedAt <= maxAge, "stale price");

        // Calculate output
        if (tokenIn == address(HKDC)) {
            // HKD -> SGD
            amountOut = (amountIn * rateSgdPerHkd) / 1e18;
        } else {
            // SGD -> HKD
            amountOut = (amountIn * 1e18) / rateSgdPerHkd;
        }

        // Fee deduction
        fee = (amountOut * feeBps) / BPS_DENOM;
        uint256 sendOut = amountOut - fee;
        require(sendOut >= minOut, "slippage/minOut");

        // Funds flow:
        // user -> this (tokenIn)
        // this -> user (tokenOut)
        // treasury -> fee (tokenOut)
        IERC20(tokenIn).safeTransferFrom(msg.sender, address(this), amountIn);

        IERC20 outToken = IERC20(tokenOut);
        require(outToken.balanceOf(address(this)) >= amountOut, "insufficient liquidity");

        if (fee > 0) {
            outToken.safeTransfer(feeTreasury, fee);
        }
        outToken.safeTransfer(msg.sender, sendOut);

        emit Swapped(msg.sender, tokenIn, tokenOut, amountIn, sendOut, fee);
    }
}
