// SPDX-License-Identifier: MIT
// Compatible with OpenZeppelin Contracts ^5.5.0
pragma solidity ^0.8.20;

import {ERC20} from "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import {ERC20Burnable} from "@openzeppelin/contracts/token/ERC20/extensions/ERC20Burnable.sol";
import {AccessControl} from "@openzeppelin/contracts/access/AccessControl.sol";

contract StableCoin is ERC20, ERC20Burnable, AccessControl {
    // ------- Role -------
    bytes32 public constant MINTER_ROLE = keccak256("MINTER_ROLE");
    bytes32 public constant COMPLIANCE_ROLE = keccak256("COMPLIANCE_ROLE");

    // ------- Whitelist -------
    mapping(address => bool) public isWhitelisted;

    event WhitelistUpdated(address indexed account, bool allowed);

    constructor(string memory name_, string memory symbol_, address admin, address[] memory initialWhitelisted)
        ERC20(name_, symbol_)
    {
        // Role init
        _grantRole(DEFAULT_ADMIN_ROLE, admin);
        _grantRole(MINTER_ROLE, admin);
        _grantRole(COMPLIANCE_ROLE, admin);

        // Whitelist init
        for (uint256 i = 0; i < initialWhitelisted.length; i++) {
            isWhitelisted[initialWhitelisted[i]] = true;
            emit WhitelistUpdated(initialWhitelisted[i], true);
        }
    }

    // -------- 6 decimals ---------
    function decimals() public pure override returns (uint8) {
        return 6;
    }

    // -------- Whitelist Management (compliance role) --------
    function setWhitelist(address account, bool allowed) external onlyRole(COMPLIANCE_ROLE) {
        isWhitelisted[account] = allowed;
        emit WhitelistUpdated(account, allowed);
    }

    // -------- Mint --------
    function mint(address to, uint256 amount) external onlyRole(MINTER_ROLE) {
        _mint(to, amount);
    }

    // -------- Whitelist Check --------
    function _update(address from, address to, uint256 value) internal override(ERC20) {
        if (from != address(0) && to != address(0)) {
            require(isWhitelisted[from] && isWhitelisted[to], "Transfer not allowed: whitelist");
        }
        super._update(from, to, value);
    }

    // Multiple Inheritance Override
    function supportsInterface(bytes4 interfaceId) public view override(AccessControl) returns (bool) {
        return super.supportsInterface(interfaceId);
    }
}
