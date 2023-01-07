const { ethers } = require("hardhat");
const hre = require("hardhat");

async function main() {
  const RealEstateNFT = new ethers.getContractFactory("RealEstateNFT");
  const realEstate = RealEstateNFT.deploy();
  await realEstate.deployed();

  console.log(`RealEstateNFT Contract deployed to:${realEstate.address}`);

  const Escrow = new ethers.getContractFactory("Escrow");
  const escrow = RealEstateNFT.deploy();
  await escrow.deployed();

  console.log(`Escrow Contract deployed to:${escrow.address}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
