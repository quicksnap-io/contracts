const BigNumber = require('bignumber.js');
const { takeSnapshot } = require('@nomicfoundation/hardhat-network-helpers');
const { toWei } = web3.utils;

let _snapshot;

async function snapshot() {
  _snapshot = await takeSnapshot();
}

async function restore() {
  await _snapshot.restore();
}

function toBN(number) {
  return new BigNumber(number);
}

async function getCosts(tx) {
  const receipt = await web3.eth.getTransactionReceipt(tx.hash);
  const gasUsed = receipt.gasUsed;
  const gasPrice = Number(tx.gasPrice);
  const gasCost = toBN(gasUsed).times(gasPrice);
  console.log('gas used : ' + gasUsed);
  console.log('gas price : ' + gasPrice);
  console.log(
    'tx cost : ' +
    toBN(gasCost)
      .div(10 ** 18)
      .toString() +
    ' ETH'
  );
}

async function getCurrentBlockTimestamp() {
  return (await web3.eth.getBlock("latest")).timestamp;
}

module.exports = {
  toWei,
  snapshot,
  restore,
  toBN,
  getCosts,
  getCurrentBlockTimestamp,
};
