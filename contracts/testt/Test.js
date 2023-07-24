const { expect } = require("chai");
const { ethers } = require("hardhat");

describe("Deploy contracts", function () {
  let deployer, user, attacker;
  let bankContract;
  let attackFactory;

  beforeEach(async function () {
    [deployer, user, attacker] = await ethers.getSigners();

    bankContract = await hre.ethers.deployContract("Bank");
    // await this.bankFactory.waitForDeployment();

    await bankContract.deposit({ value: ethers.parseEther("100") });
    await bankContract
      .connect(user)
      .deposit({ value: ethers.parseEther("50") });

    attackFactory = await hre.ethers.deployContract(
      "Attacker",
      [bankContract.getAddress()],
      [attacker.getAddress()]
    );
  });

  // await this.attackFactory.waitForDeployment();

  describe("Test deposit and withdraw of Bank contract", function () {
    it("Should accept deposits", async function () {
      const deployerBalance = await bankContract.balanceOf(deployer.address);
      expect(deployerBalance).to.equal(ethers.parseEther("100"));

      const userBalance = await bankContract.balanceOf(user.address);
      expect(userBalance).to.equal(ethers.parseEther("50"));
    });

    it("Should accept withdrawals", async function () {
      await bankContract.withdraw();

      const deployerBalance = await bankContract.balanceOf(deployer.address);
      const userBalance = await bankContract.balanceOf(user.address);

      expect(deployerBalance).to.eq(0);
      expect(userBalance).to.eq(ethers.parseEther("50"));
    });

    it("Perform Attack", async function () {
      console.log("");
      console.log("*** Before ***");
      console.log(
        `Bank's balance: ${ethers
          .formatEther(
            await ethers.provider.getBalance(bankContract.getAddress())
          )
          .toString()}`
      );
      console.log(
        `Attacker's balance: ${ethers
          .formatEther(
            await ethers.provider.getBalance(await attacker.getAddress())
          )
          .toString()}`
      );

      await attackFactory.attack({
        value: ethers.parseEther("10"),
      });

      console.log("");
      console.log("*** After ***");
      console.log(
        `Bank's balance: ${ethers
          .formatEther(
            await ethers.provider.getBalance(bankContract.getAddress())
          )
          .toString()}`
      );
      console.log(
        `Attackers's balance: ${ethers
          .formatEther(
            await ethers.provider.getBalance(await attacker.getAddress())
          )
          .toString()}`
      );
      console.log("");

      expect(await ethers.provider.getBalance(bankContract.getAddress())).to.eq(
        0
      );
    });
  });
});
