const hre = require("hardhat");
const main = async () => {

  const axtContractFactory = await hre.ethers.getContractFactory("AcademixNFT");
  const axtContract = await axtContractFactory.deploy();

  await axtContract.deployed();
  console.log("Contract deployed to:", axtContract.address);

  // Call the function.
  let txn = await axtContract.mintNFT("0x24C9631e4cb092088F05B70453d3ACF68951a2D1","https://gateway.pinata.cloud/ipfs/QmcTJprHfSKRhn5Eh19tYfUrLABSMJxryuZvdv9zSWBHFH");
  // Wait for it to be mined.
  await txn.wait();
  console.log("Congratulation You've successfully Minted NFT #1");

  txn = await axtContract.mintNFT("0x24C9631e4cb092088F05B70453d3ACF68951a2D1","https://gateway.pinata.cloud/ipfs/QmcTJprHfSKRhn5Eh19tYfUrLABSMJxryuZvdv9zSWBHFH");
  await txn.wait();
  console.log("Congratulation You've successfully Minted NFT #2");
};

const runMain = async () => {
  try {
    await main();
    process.exit(0);
  } catch (error) {
    console.log(error);
    process.exit(1);
  }
};

runMain();
