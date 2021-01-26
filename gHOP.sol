// SPDX-License-Identifier: MIT

pragma solidity 0.7.6;

import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.3.0/contracts/token/ERC20/ERC20Pausable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.3.0/contracts/token/ERC20/ERC20Burnable.sol";
import "https://github.com/OpenZeppelin/openzeppelin-contracts/blob/v3.3.0/contracts/access/Ownable.sol";

/**
 * @dev Implementation of an {ERC20} token that is pausable, burnable 
 * and has an owner to mint, revoke and pause.
 */
contract gHOPtoken is ERC20("HOPR Genesis DAO Token", "gHOP"), ERC20Pausable, ERC20Burnable, Ownable {

    /**
     * @dev Initializes the contract in paused state.
     */
    constructor() {
        _pause();
    }

    // since this contract inherits _beforeTokenTransfer both from ERC20Pausable and also from ERC20 via ERC20Burnable
    // the compiler needs to know which parent function to call
    function _beforeTokenTransfer(address from, address to, uint256 amount) internal override(ERC20, ERC20Pausable) {
        if (_msgSender() != owner()) { // pause does not apply to owner
            super._beforeTokenTransfer(from, to, amount);
        }
    }
    
    /**
     * @dev Allows the owner to mint tokens for one recipient.
     * @param account the beneficiary getting tokens
     * @param amount the amount of tokens that the beneficiary gets
     */
    function mint(address account, uint256 amount) external onlyOwner {
        _mint(account, amount);
    }

    /**
     * @dev Allows the owner to mint tokens for several recipients in one transaction.
     * @param accounts an array of beneficiaries getting tokens
     * @param amount the amount of tokens that each beneficiary gets
     */
    function batchMint(address[] calldata accounts, uint256 amount) external onlyOwner {
        uint256 len = accounts.length;
        for (uint256 c = 0; c < len; c++) {
            _mint(accounts[c], amount);
        }
    }
    
    /**
     * @dev Allows the owner to revoke tokens from one recipient.
     * @param account from which to revoke the tokens
     * @param amount the amount of tokens to be revoked from account
     */
    function revoke(address account, uint256 amount) external onlyOwner {
        _burn(account, amount);
    }

    /**
     * @dev Allows the owner to revoke tokens from several accounts in one trasnaction.
     * @param accounts array of accounts from which to revoke the tokens
     * @param amount the amount of tokens to be revoked from each account
     */
    function batchRevoke(address[] calldata accounts, uint256 amount) external onlyOwner {
        uint256 len = accounts.length;
        for (uint256 c = 0; c < len; c++) {
            _burn(accounts[c], amount);
        }
    }
    
    /**
     * @dev Allows the owner to pause all interactions with the smart contract, except for owner.
     */
    function pause() external onlyOwner {
        _pause();
    }

    /**
     * @dev Allows the owner to unpause all interactions with the smart contract.
     */
    function unpause() external onlyOwner {
        _unpause();
    }

}
