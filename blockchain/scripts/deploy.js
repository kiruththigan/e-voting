import hardhat from "hardhat";
const { ethers } = hardhat;

async function main() {
  console.log("Deploying VoterFaceRegistry");

  const ContractFactory = await ethers.getContractFactory("VoterFaceRegistry");
  const contract = await ContractFactory.deploy();

  await contract.waitForDeployment();
  const address = await contract.getAddress();

  console.log("Contract deployed at:", address);
}

main().catch((error) => {
  console.error("Deployment error:", error);
  process.exitCode = 1;
});
