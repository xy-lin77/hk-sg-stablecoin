// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract ManualOracle is AccessControl {
    bytes32 public constant ORACLE_ADMIN_ROLE = keccak256("ORACLE_ADMIN_ROLE");

    // rate = SGD per 1 HKD, 18 decimals. e.g., 1 HKD = 0.173 SGD => rate = 0.173 * 1e18
    uint256 public rateSgdPerHkd;
    uint256 public lastUpdated; // unix timestamp

    event RateUpdated(uint256 rateSgdPerHkd, uint256 timestamp);

    constructor(address admin, uint256 initialRate) {
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(ORACLE_ADMIN_ROLE, admin);
        rateSgdPerHkd = initialRate;
        lastUpdated = block.timestamp;
        emit RateUpdated(initialRate, block.timestamp);
    }

    function setRate(uint256 newRateSgdPerHkd) external onlyRole(ORACLE_ADMIN_ROLE) {
        require(newRateSgdPerHkd > 0, "invalid rate");
        rateSgdPerHkd = newRateSgdPerHkd;
        lastUpdated = block.timestamp;
        emit RateUpdated(newRateSgdPerHkd, lastUpdated);
    }

    function getRate() external view returns (uint256 rate, uint256 updatedAt) {
        return (rateSgdPerHkd, lastUpdated);
    }
}
