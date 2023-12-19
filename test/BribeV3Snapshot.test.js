const { expect } = require('chai');
const { ethers } = require('hardhat');
const { getCosts, snapshot, restore, toBN, getCurrentBlockTimestamp } = require('./helpers/utils');

describe.only('BribeV3Snapshot ', function () {
  let owner, initialFees, fees, initialDistribution, distribution, user, whale;
  let whaleAddress = '0xF977814e90dA44bFA03b6295A0616a897441aceC';

  let bribe, bribeAddress;
  let rewardToken, decimals;
  let rewardTokenAddress = '0x6B175474E89094C44Da98b954EedeAC495271d0F'; // DAI

  let amount, feePercentage, calculatedFee;

  let proposal = '0xabf95f31233e9b6c9ee22e06d96ffe9e05736acaa091fca8d867d625a6a4a343';
  let option = 1;

  const fee = 10;

  before('setup', async () => {
    [owner, initialFees, fees, initialDistribution, distribution, user] = await ethers.getSigners();
    bribe = await ethers.deployContract('BribeV3Snapshot', [fee, initialFees.address, initialDistribution.address]);
    await bribe.waitForDeployment();

    bribeAddress = await bribe.getAddress();

    rewardToken = await ethers.getContractAt('ERC20', rewardTokenAddress);
    decimals = await rewardToken.decimals();

    // impersonate account
    await hre.network.provider.request({
      method: 'hardhat_impersonateAccount',
      params: [whaleAddress],
    });
    whale = await ethers.provider.getSigner(whaleAddress);

    await snapshot();
  });

  afterEach('revert', async () => {
    await restore();
  });

  describe('Deployment', async function () {
    it('Should set correct fee percentage', async function () {
      expect(await bribe.feePercentage()).to.equal(fee);
    });
    it('Should set correct fee address', async function () {
      expect(await bribe.feeAddress()).to.equal(initialFees.address);
    });
    it('Should set correct distribution address', async function () {
      expect(await bribe.distributionAddress()).to.equal(initialDistribution.address);
    });
  });

  describe('Configuration', async function () {
    describe('fee and distribution', async function () {
      it('Should return the new fee after changing it', async function () {
        let newFee = 15;
        await bribe.connect(owner).set_fee_percentage(newFee);

        expect(await bribe.feePercentage()).to.equal(newFee);
      });
      it('Should fail when a fee higher than 15% is set', async function () {
        let newFee = 16;

        await expect(bribe.connect(owner).set_fee_percentage(newFee)).to.be.revertedWith('Fee too high');
      });
      it('Should return the new fee address after changing it', async function () {
        await bribe.connect(owner).set_fee_address(fees.address);

        expect(await bribe.feeAddress()).to.equal(fees.address);
      });
      it('Should return the new fee address after changing it', async function () {
        await bribe.connect(owner).set_distribution_address(distribution.address);

        expect(await bribe.distributionAddress()).to.equal(distribution.address);
      });
    });
  });

  describe('Rewards', async function () {
    before(async function () {
      amount = ethers.parseUnits('100000', decimals);
      feePercentage = await bribe.feePercentage();
      calculatedFee = toBN(amount).times(feePercentage).div(100);
      expect((await bribe.calculate_fee(amount)).toString()).to.equal(toBN(calculatedFee).toFixed().toString());
    });
    beforeEach(async function () {
      await bribe.connect(owner).set_fee_address(fees.address);
      await bribe.connect(owner).set_distribution_address(distribution.address);
      // approve transfer of erc20 first
      await rewardToken.connect(whale).approve(bribeAddress, amount);
    });
    it('Should emit Bribe event', async function () {
      const timestamp = await getCurrentBlockTimestamp();
      const tx = await bribe.connect(whale).add_reward_amount(proposal, option, rewardTokenAddress, amount);

      expect(tx).to.emit(bribe, 'Bribe').withArgs(timestamp, whaleAddress, proposal, option, rewardTokenAddress, amount);
    });
    it('Should update whale balance', async function () {
      const balanceWhaleBefore = await rewardToken.balanceOf(whaleAddress);
      await bribe.connect(whale).add_reward_amount(proposal, option, rewardTokenAddress, amount);
      const balanceWhaleAfter = await rewardToken.balanceOf(whaleAddress);

      expect(toBN(balanceWhaleBefore).minus(balanceWhaleAfter).toString()).to.equal(toBN(amount).toString());
    });
    it('Should send the fee to the fee collector', async function () {
      const balanceFeeBefore = await rewardToken.balanceOf(fees.address);
      await bribe.connect(whale).add_reward_amount(proposal, option, rewardTokenAddress, amount);
      const balanceFeeAfter = await rewardToken.balanceOf(fees.address);

      expect(toBN(balanceFeeAfter).minus(balanceFeeBefore).toString()).to.equal(toBN(calculatedFee).toString());
    });
    it('Should send the reward to the distribution contract', async function () {
      const balanceDistributionBefore = await rewardToken.balanceOf(distribution.address);
      await bribe.connect(whale).add_reward_amount(proposal, option, rewardTokenAddress, amount);
      const balanceDistributionAfter = await rewardToken.balanceOf(distribution.address);

      expect(toBN(balanceDistributionAfter).minus(balanceDistributionBefore).toString()).to.equal(toBN(amount).minus(calculatedFee).toString());
    });
    it('Should add the reward token to the gauge rewards', async function () {
      let count = await bribe.rewards_per_proposal_count(proposal);
      expect(count).to.equal(0);

      await bribe.connect(whale).add_reward_amount(proposal, option, rewardTokenAddress, amount);

      count = await bribe.rewards_per_proposal_count(proposal);
      expect(count).to.equal(1);

      let bribes = await bribe.rewards_per_proposal(proposal, 0, count);
      expect(bribes[0].token).to.equal(rewardTokenAddress);
      expect(bribes[0].option).to.equal(option);
      expect(bribes[0].amount.toString()).to.equal(toBN(amount).minus(calculatedFee).toFixed().toString());
    });
    it('Should fail add_reward_amount if amount is null', async function () {
      const reason = 'no reward to add';

      await expect(bribe.connect(whale).add_reward_amount(proposal, option, rewardTokenAddress, 0)).to.be.revertedWith(reason);
    });
  });
});
