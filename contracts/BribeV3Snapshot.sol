// SPDX-License-Identifier: MIT
pragma solidity 0.8.18;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/token/ERC20/utils/SafeERC20.sol";
import "@openzeppelin/contracts/security/ReentrancyGuard.sol";

contract BribeV3Snapshot is Ownable, ReentrancyGuard {
    using SafeERC20 for IERC20;

    struct OptionBribe {
        uint256 option;
        address token;
        uint256 amount;
    }

    uint256 public constant MAX_FEE = 15;

    uint256 public feePercentage;
    address public feeAddress;
    address public distributionAddress;

    event Bribe(uint256 time, address indexed briber, string proposal, uint256 option, address reward_token, uint256 amount, uint256 startTime, uint256 endTime);
    event FeePercentageUpdated(uint256 oldFee, uint256 newFee);
    event FeeAddressUpdated(address oldAddress, address newAddress);
    event DistributionAddressUpdated(address oldAddress, address newAddress);

    constructor(uint256 _feePercentage, address _feeAddress, address _distributionAddress) {
        require(_feePercentage > 0, "Fee cannot be 0");
        require(_feePercentage <= MAX_FEE, "Fee too high");
        require(_feeAddress != address(0), "wrong fee address");
        require(_distributionAddress != address(0), "wrong distribution address");
        feePercentage = _feePercentage;
        feeAddress = _feeAddress;
        distributionAddress = _distributionAddress;
    }

    function add_reward_amount(string memory proposal, uint256 option, address reward_token, uint256 amount, uint256 startTime, uint256 endTime) nonReentrant external {
        require(reward_token != address(0));
        require(amount > 0, "no reward to add");

        uint256 fee = calculate_fee(amount);
        amount = amount - fee;

        IERC20(reward_token).safeTransferFrom(msg.sender, feeAddress, fee);
        IERC20(reward_token).safeTransferFrom(msg.sender, distributionAddress, amount);

        emit Bribe(block.timestamp, msg.sender, proposal, option, reward_token, amount, startTime, endTime);
    }

    function set_fee_percentage(uint256 _feePercentage) external onlyOwner {
        require(_feePercentage > 0, "Fee cannot be 0");
        require(_feePercentage <= MAX_FEE, "Fee too high");
        emit FeePercentageUpdated(feePercentage, _feePercentage);
        feePercentage = _feePercentage;
    }

    function set_fee_address(address _feeAddress) external onlyOwner {
        require(_feeAddress != address(0), "incorrect address");
        emit FeeAddressUpdated(feeAddress, _feeAddress);
        feeAddress = _feeAddress;
    }

    function set_distribution_address(address _distributionAddress) external onlyOwner {
        require(_distributionAddress != address(0), "incorrect address");
        emit DistributionAddressUpdated(distributionAddress, _distributionAddress);
        distributionAddress = _distributionAddress;
    }

    function calculate_fee(uint256 amount) private view returns (uint256) {
        return amount * feePercentage / 100;
    }
}
