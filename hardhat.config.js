require('dotenv').config();
require('@nomicfoundation/hardhat-toolbox');
require('@nomiclabs/hardhat-web3');
require('web3-eth');

// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task('accounts', 'Prints the list of accounts', async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: 'hardhat',
  networks: {
    localhost: {
      url: 'http://127.0.0.1:8545',
    },
    hardhat: {
      chainId: 1,
      forking: {
        url: process.env.WEB3_RPC,
        blockNumber: 18391053, // you can put a block number in order to test at a specific time which also uses less resources on your computer
      },
    },
    mainnet: {
      url: process.env.WEB3_RPC,
      accounts: [process.env.PRIVATE_KEY],
    },
    goerli: {
      url: process.env.WEB3_RPC,
      accounts: [process.env.PRIVATE_KEY],
    },
  },
  solidity: {
    compilers: [
      {
        version: '0.8.18',
      },
      {
        version: '0.8.6',
      },
      {
        version: '0.4.24',
      },
    ],
  },
  vyper: {
    version: '0.2.4',
  },
};
