const hre = require("hardhat");

const tokens = (n) => {
  return ethers.utils.parseUnits(n.toString(), "ether");
};

async function main() {
  // Setup the accounts
  [seller] = await ethers.getSigners();

  // Deploy the realestate
  realEstate = await hre.ethers.deployContract("RealEstate");

  await realEstate.waitForDeployment();

  console.log(
    `Deployed Real Estate Contract at: ${await realEstate.getAddress()}`
  );

  for (let i = 0; i < 3; i++) {
    const transaction = await realEstate
      .connect(seller)
      .mint(
        `https://ipfs.io/ipfs/Qmb4Fo5raZzSLbdJpwju5G8jBzPpJLpVyTZ2NbWufYof6j/${
          i + 1
        }.json`
      );
    await transaction.wait();
  }
  console.log(`Minting 3 properties...\n`);

  // Deploy the escrow
  escrow = await hre.ethers.deployContract("Escrow", [
    realEstate.getAddress(),
    seller.getAddress(),
  ]);

  await escrow.waitForDeployment();

  for (let i = 0; i < 3; i++) {
    // Approve properties...
    let transaction = await realEstate
      .connect(seller)
      .approve(await escrow.getAddress(), i + 1);
    await transaction.wait();
  }

  // Listing properties by the seller (deployer)...
  transaction = await escrow
    .connect(seller)
    .list(1, seller.address, tokens(0.066), tokens(0.088));
  await transaction.wait();

  transaction = await escrow
    .connect(seller)
    .list(2, seller.address, tokens(0.056), tokens(0.068));
  await transaction.wait();

  transaction = await escrow
    .connect(seller)
    .list(3, seller.address, tokens(0.089), tokens(0.078));
  await transaction.wait();

  console.log(`Deployed Escrow Contract at: ${await escrow.getAddress()}`);
  console.log(`Listing 3 properties...\n`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});
