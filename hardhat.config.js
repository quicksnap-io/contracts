require("dotenv").config();
require("@nomiclabs/hardhat-web3");
require("@matterlabs/hardhat-zksync-solc")
require("@matterlabs/hardhat-zksync-deploy")

if (process.env.USE_ZKSYNC === "true") {
  console.log("true")
  require("@matterlabs/hardhat-zksync-ethers");
  require("@matterlabs/hardhat-zksync-verify");
} else {
  console.log("false")
  require("@nomicfoundation/hardhat-toolbox");
}
// This is a sample Hardhat task. To learn how to create your own go to
// https://hardhat.org/guides/create-task.html
task("accounts", "Prints the list of accounts", async (taskArgs, hre) => {
  const accounts = await hre.ethers.getSigners();

  for (const account of accounts) {
    console.log(account.address);
  }
});

/**
 * @type import('hardhat/config').HardhatUserConfig
 */
module.exports = {
  defaultNetwork: "hardhat",
  networks: {
    localhost: {
      url: "http://127.0.0.1:8545",
      forking: {
        url: process.env.WEB3_RPC_ETHEREUM,
        blockNumber: 19355900, // you can put a block number in order to test at a specific time which also uses less resources on your computer
      },
    },
    // hardhat: {
    //   chainId: 324,
    //   zksync: true,
    //   forking: {
    //     url: process.env.WEB3_RPC_ZKSYNC,
    //     blockNumber: 28052700, // you can put a block number in order to test at a specific time which also uses less resources on your computer
    //     ethNetwork: "mainnet",
    //     verifyURL: "https://zksync2-mainnet-explorer.zksync.io/contract_verification",
    //   },
    // },
    hardhat: {
       chainId: 1,
      forking: {
         url: process.env.WEB3_RPC_ETHEREUM,
         blockNumber: 19355900, // you can put a block number in order to test at a specific time which also uses less resources on your computer
    },
    },
    mainnet: {
      url: process.env.WEB3_RPC_ETHEREUM,
      accounts: [process.env.PRIVATE_KEY],
      zksync: false
    },
    polygon: {
      url: process.env.WEB3_RPC_MATIC,
      accounts: [process.env.PRIVATE_KEY],
      zksync: false
    },
    mumbai: {
      url: process.env.WEB3_RPC_MUMBAI,
      accounts: [process.env.PRIVATE_KEY],
      zksync: false
    },
    sepolia: {
      url: process.env.WEB3_RPC_SEPOLIA,
      accounts: [process.env.PRIVATE_KEY],
      zksync: false
    },
    zkSyncMainnet: {
      url: process.env.WEB3_RPC_ZKSYNC,
      accounts: [process.env.PRIVATE_KEY],
      ethNetwork: "mainnet",
      zksync: true,
      verifyURL: "https://zksync2-mainnet-explorer.zksync.io/contract_verification",
    },
    zkSyncSepoliaTestnet: {
      url: process.env.WEB3_RPC_ZKSYNC_SEPOLIA,
      accounts: [process.env.PRIVATE_KEY],
      ethNetwork: "sepolia",
      zksync: true,
      verifyURL: "https://explorer.sepolia.era.zksync.dev/contract_verification",
    },
  },
  solidity: {
    compilers: [
      {
        version: "0.8.18",
      },
      {
        version: "0.8.6",
      },
      {
        version: "0.4.24",
      },
    ],
  },
  etherscan: {
    apiKey: process.env.ETHERSCAN_API_KEY,
  },
  zksolc: {
    version: "latest",
    settings: {
    },
  },
  vyper: {
    version: "0.2.4",
  },
};
