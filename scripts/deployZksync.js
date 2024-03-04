
// compile -->  npx hardhat compile  --network zkSyncSepoliaTestnet
// deploy --> npx hardhat run deploy/deployZksync.js   --network zkSyncSepoliaTestnet
// verify --> npx hardhat verify --network zkSyncSepoliaTestnet 0x7B3908E5D0E980b5A36ea21Fa46aA18813cd0EDa --constructor-args args.js 

const { Wallet } = require("zksync-ethers");
const { Deployer } = require("@matterlabs/hardhat-zksync-deploy");
const hre = require("hardhat");
const constructorArgs = require("../args");

async function deployContract(contractName, constructorArgs) {
  try {
    console.log(`Running deploy script for ${contractName}`);

    // Initialize the wallet.
    const wallet = new Wallet(process.env.PRIVATE_KEY);

    // Create deployer object and load the artifact of the contract we want to deploy.
    const deployer = new Deployer(hre, wallet);
    
    // Load contract
    const artifact = await deployer.loadArtifact(contractName).catch((error) => {
      if (error?.message?.includes(`Artifact for contract "${contractName}" not found.`)) {
        console.error(error.message);
        throw `⛔️ Please make sure you have compiled your contracts or specified the correct contract name!`;
      } else {
        throw error;
      }
    });

    const MyContract = await deployer.deploy(artifact, constructorArgs);
    const address = await MyContract.getAddress();

    console.log(`${artifact.contractName} was deployed to ${address}`);

  } catch (error) {
    console.error('An error occurred:', error);
  }
}

async function main() {
  // Deploy QuickSnap contract
  await deployContract("QuickSnap", constructorArgs);

  // Deploy MultiMerkleStash contract
  await deployContract("MultiMerkleStash", []);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
