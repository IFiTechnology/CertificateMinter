require("@nomicfoundation/hardhat-toolbox");
require("dotenv").config();

/** @type import('hardhat/config').HardhatUserConfig */
module.exports = {
  solidity: "0.8.17",
  networks: {
    matic: {
      url: process.env.QUICKNODE_API_KEY_URL,
      accounts: [process.env.PRIVATE_KEY],
      //gasPrice: 8000000000, // Adjust the gas price as per your requirements
    },
  },
};