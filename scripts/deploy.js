// deploy -> npx hardhat run deploy/deployCreate2.js --network mumbai
// verify ->  npx hardhat verify --network mumbai <CONTRACT_ADDRESS> --constructor-args args.js

const { ethers } = require("hardhat");
const factoryAbi = require("../factoryAbi/abi.js").abi;
let deployer;

function calculateCreate2Address(factoryAddress, bytecode, salt) {
  // Helper function to perform CREATE2 address calculation
  const bytecodeHash = ethers.keccak256(bytecode);
  const saltHex = ethers.zeroPadValue("0x" + BigInt(salt).toString(16), 32);
  const address = ethers
    .hexlify(
      ethers.keccak256(
        ethers.concat(["0xff", factoryAddress, saltHex, bytecodeHash]),
      ),
    )
    .slice(-20);
  console.log(address);
  return address;
}

async function deployContract(contractName, constructorArgs) {
  [deployer] = await ethers.getSigners();

  // Deploy the Factory contract
  const factory = new ethers.Contract(
    process.env.CREATE2_MAINET_FACTORY,
    factoryAbi,
    deployer,
  );

  // Get the Contract to be deployed via CREATE2
  const Contract = await ethers.getContractFactory(contractName);
  if (!Contract || !Contract.bytecode) {
    console.error(
      `${contractName} contract not found or not compiled correctly`,
    );
    return;
  }

  // Get the init code for the contract
  const deployTransaction = await Contract.getDeployTransaction(
    deployer.address,
    ...constructorArgs,
  );
  const initCode = deployTransaction.data;

  // <<<< --- change salt value ---- >>>>

  const saltval = 9018; // Replace with any desired 32-byte value
  const salt = ethers.zeroPadValue("0x" + BigInt(saltval).toString(16), 32);

  // Deploy the contract using the Factory
  const tx = await factory.deploy(initCode, salt);
  const receipt = await tx.wait();
  console.log(receipt);

  let deployEvent;
  for (const log of receipt.logs) {
    try {
      const event = factory.interface.parseLog(log);
      if (event.name === "Deployed") {
        deployEvent = event;
        break;
      }
    } catch (error) {
      // Ignore errors from logs that don't match the factory interface
    }
  }

  if (!deployEvent) {
    console.error("Deploy event not found in transaction receipt");
    return;
  }

  const deployedContractAddress = deployEvent.args[2];
  console.log(
    `${contractName} contract deployed via CREATE2 at address:`,
    deployedContractAddress,
  );
  return deployedContractAddress;
}

async function main() {
  // Pass the contract name and constructor arguments dynamically
  const merkleAddress = await deployContract("MultiMerkleStash", []);
  await deployContract("QuickSnap", [5, deployer.address, merkleAddress]);
}

main()
  .then(() => {
    process.exit(0);
  })
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
