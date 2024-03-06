const { expect } = require("chai");
const { ethers } = require("hardhat");
const {
  getCosts,
  snapshot,
  restore,
  toBN,
  getCurrentBlockTimestamp,
} = require("./helpers/utils");

describe.only("QuickSnap ", function () {
  let owner, initialFees, fees, initialDistribution, distribution, user, whale;
  let whaleAddress = "0xF977814e90dA44bFA03b6295A0616a897441aceC";

  let quicksnap, quicksnapAddress;
  let rewardToken, decimals;
  let rewardTokenAddress = "0x6B175474E89094C44Da98b954EedeAC495271d0F"; // DAI

  let amount, feePercentage, calculatedFee;

  let proposal =
    "0xabf95f31233e9b6c9ee22e06d96ffe9e05736acaa091fca8d867d625a6a4a343";
  let option = 1;

  const fee = 10;
  // took those from the proposal start and end
  const startTime = 1663871400
  const endTime = 1664130600

  before("setup", async () => {
    [owner, initialFees, fees, initialDistribution, distribution, user] =
      await ethers.getSigners();
    quicksnap = await ethers.deployContract("QuickSnap", [
      fee,
      initialFees.address,
      initialDistribution.address,
    ]);
    await quicksnap.waitForDeployment();

    quicksnapAddress = await quicksnap.getAddress();

    rewardToken = await ethers.getContractAt("ERC20", rewardTokenAddress);
    decimals = await rewardToken.decimals();

    // impersonate account
    await hre.network.provider.request({
      method: "hardhat_impersonateAccount",
      params: [whaleAddress],
    });
    whale = await ethers.provider.getSigner(whaleAddress);

    await snapshot();
  });

  afterEach("revert", async () => {
    await restore();
  });

  describe("Deployment", async function () {
    it("Should set correct fee percentage", async function () {
      expect(await quicksnap.feePercentage()).to.equal(fee);
    });
    it("Should set correct fee address", async function () {
      expect(await quicksnap.feeAddress()).to.equal(initialFees.address);
    });
    it("Should set correct distribution address", async function () {
      expect(await quicksnap.distributionAddress()).to.equal(
        initialDistribution.address,
      );
    });
  });

  describe("Configuration", async function () {
    describe("fee and distribution", async function () {
      it("Should return the new fee after changing it", async function () {
        let newFee = 15;
        await quicksnap.connect(owner).set_fee_percentage(newFee);

        expect(await quicksnap.feePercentage()).to.equal(newFee);
      });
      it("Should fail when a fee higher than 15% is set", async function () {
        let newFee = 16;

        await expect(
          quicksnap.connect(owner).set_fee_percentage(newFee),
        ).to.be.revertedWith("Fee too high");
      });
      it("Should return the new fee address after changing it", async function () {
        await quicksnap.connect(owner).set_fee_address(fees.address);

        expect(await quicksnap.feeAddress()).to.equal(fees.address);
      });
      it("Should return the new fee address after changing it", async function () {
        await quicksnap
          .connect(owner)
          .set_distribution_address(distribution.address);

        expect(await quicksnap.distributionAddress()).to.equal(
          distribution.address,
        );
      });
    });
  });

  describe("Rewards", async function () {
    // function is private in the contract
    before(async function () {
    amount = ethers.parseUnits("100000", decimals);
    //feePercentage = await quicksnap.feePercentage();
    //calculatedFee = toBN(amount).times(feePercentage).div(100);
    //   expect((await quicksnap.calculate_fee(amount)).toString()).to.equal(
    //     toBN(calculatedFee).toFixed().toString(),
    //   );
    });
    beforeEach(async function () {
      await quicksnap.connect(owner).set_fee_address(fees.address);
      await quicksnap
        .connect(owner)
        .set_distribution_address(distribution.address);
      // approve transfer of erc20 first
      await rewardToken.connect(whale).approve(quicksnapAddress, amount);
    });
    it("Should emit RewardAdded event", async function () {
      //const timestamp = await getCurrentBlockTimestamp();
      const tx = await quicksnap
        .connect(whale)
        .add_reward_amount(proposal, option, rewardTokenAddress, amount, startTime,
          endTime);
      console.log(tx)
      await expect(tx)
        .to.emit(quicksnap, "RewardAdded")
    });
    it("Should update whale balance", async function () {
      const balanceWhaleBefore = await rewardToken.balanceOf(whaleAddress);
      await quicksnap
        .connect(whale)
        .add_reward_amount(proposal, option, rewardTokenAddress, amount, startTime,
          endTime);
      const balanceWhaleAfter = await rewardToken.balanceOf(whaleAddress);

      expect(
        toBN(balanceWhaleBefore).minus(balanceWhaleAfter).toString(),
      ).to.equal(toBN(amount).toString());
    });
    it("Should send the fee to the fee collector", async function () {
      const balanceFeeBefore = await rewardToken.balanceOf(fees.address);
      await quicksnap
        .connect(whale)
        .add_reward_amount(proposal, option, rewardTokenAddress, amount, startTime,
          endTime);
      const balanceFeeAfter = await rewardToken.balanceOf(fees.address);

      expect(toBN(balanceFeeAfter).minus(balanceFeeBefore).toString()).to.equal(
        toBN(calculatedFee).toString(),
      );
    });
    it("Should send the reward to the distribution contract", async function () {
      const balanceDistributionBefore = await rewardToken.balanceOf(
        distribution.address,
      );
      await quicksnap
        .connect(whale)
        .add_reward_amount(proposal, option, rewardTokenAddress, amount, startTime,
          endTime);
      const balanceDistributionAfter = await rewardToken.balanceOf(
        distribution.address,
      );

      expect(
        toBN(balanceDistributionAfter)
          .minus(balanceDistributionBefore)
          .toString(),
      ).to.equal(toBN(amount).minus(calculatedFee).toString());
    });
    // we don't have rewards_per_proposal_count function
    // it("Should add the reward token to the gauge rewards", async function () {
    //   let count = await quicksnap.rewards_per_proposal_count(proposal);
    //   expect(count).to.equal(0);

    //   await quicksnap
    //     .connect(whale)
    //     .add_reward_amount(proposal, option, rewardTokenAddress, amount);

    //   count = await quicksnap.rewards_per_proposal_count(proposal);
    //   expect(count).to.equal(1);

    //   let quicksnaps = await quicksnap.rewards_per_proposal(proposal, 0, count);
    //   expect(quicksnaps[0].token).to.equal(rewardTokenAddress);
    //   expect(quicksnaps[0].option).to.equal(option);
    //   expect(quicksnaps[0].amount.toString()).to.equal(
    //     toBN(amount).minus(calculatedFee).toFixed().toString(),
    //   );
    });
    it("Should fail add_reward_amount if amount is null", async function () {
      const reason = "no reward to add";

      await expect(
        quicksnap
          .connect(whale)
          .add_reward_amount(proposal, option, rewardTokenAddress, 0, startTime,
            endTime),
      ).to.be.revertedWith(reason);
    });
  });
});
