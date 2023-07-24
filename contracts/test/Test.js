const { expect } = require("chai");
const { ethers } = require("hardhat");

const tokens = (n) => {
  return ethers.parseUnits(n.toString(), "ether");
};

describe("Escrow", () => {
  let buyer, seller, inspector, lender;
  let realEstate, escrow;

  beforeEach(async () => {
    //Setup the accounts
    [buyer, seller, inspector, lender] = await ethers.getSigners();

    //Deploy the realestate
    realEstate = await hre.ethers.deployContract("RealEstate");

    //Mint
    let transaction = await realEstate
      .connect(seller)
      .mint(
        "https://ipfs.io/ipfs/QmQUosXDxrvsESJ3PYB3rUeUuBAvVWw6nop2uu7c/1.png"
      );
    await transaction.wait();

    escrow = await hre.ethers.deployContract("Escrow", [
      realEstate.getAddress(),
      seller.getAddress(),
      inspector.getAddress(),
      lender.getAddress(),
    ]);

    // Approve Property
    transaction = await realEstate
      .connect(seller)
      .approve(escrow.getAddress(), 1);
    await transaction.wait();

    // List Property
    transaction = await escrow
      .connect(seller)
      .list(1, buyer.address, tokens(10), tokens(5));

    await transaction.wait();
  });

  describe("Deployment", () => {
    it("Returns NFT address", async () => {
      const result = await escrow.nftAddress();
      expect(result).to.be.equal(await realEstate.getAddress());
    });

    it("Returns seller", async () => {
      const result = await escrow.seller();
      expect(result).to.be.equal(await seller.getAddress());
    });

    it("Returns inspector", async () => {
      const result = await escrow.inspector();
      expect(result).to.be.equal(await inspector.getAddress());
    });

    it("Returns lender", async () => {
      const result = await escrow.lender();
      expect(result).to.be.equal(await lender.getAddress());
    });
  });

  describe("Listing", () => {
    it("Updates as listed", async () => {
      const result = await escrow.isListed(1);
      expect(result).to.be.equal(true);
    });

    it("Returns buyer", async () => {
      const result = await escrow.buyer(1);
      expect(result).to.be.equal(await buyer.getAddress());
    });

    it("Returns purchase price", async () => {
      const result = await escrow.purchasePrice(1);
      expect(result).to.be.equal(tokens(10));
    });

    it("Returns escrow amount", async () => {
      const result = await escrow.escrowAmount(1);
      expect(result).to.be.equal(tokens(5));
    });

    it("Updates ownership", async () => {
      expect(await realEstate.ownerOf(1)).to.be.equal(
        await escrow.getAddress()
      );
    });

    describe("Deposits", () => {
      beforeEach(async () => {
        const transaction = await escrow
          .connect(buyer)
          .depositEarnest(1, { value: tokens(5) });
        await transaction.wait();
      });

      it("Updates contract balance", async () => {
        const result = await escrow.getBalance();
        expect(result).to.be.equal(tokens(5));
      });
    });

    describe("Inspection", () => {
      beforeEach(async () => {
        const transaction = await escrow
          .connect(inspector)
          .updateInspectionStatus(1, true);
        await transaction.wait();
      });

      it("Updates inspection status", async () => {
        const result = await escrow.inspectionPassed(1);
        expect(result).to.be.equal(true);
      });
    });
    describe("Approval", () => {
      beforeEach(async () => {
        let transaction = await escrow.connect(buyer).approveSale(1);
        await transaction.wait();

        transaction = await escrow.connect(seller).approveSale(1);
        await transaction.wait();

        transaction = await escrow.connect(lender).approveSale(1);
        await transaction.wait();
      });

      it("Updates approval status", async () => {
        expect(await escrow.approval(1, buyer.address)).to.be.equal(true);
        expect(await escrow.approval(1, seller.address)).to.be.equal(true);
        expect(await escrow.approval(1, lender.address)).to.be.equal(true);
      });
    });
    describe("Sale", () => {
      beforeEach(async () => {
        let transaction = await escrow
          .connect(buyer)
          .depositEarnest(1, { value: tokens(5) });
        await transaction.wait();

        transaction = await escrow
          .connect(inspector)
          .updateInspectionStatus(1, true);
        await transaction.wait();

        transaction = await escrow.connect(buyer).approveSale(1);
        await transaction.wait();

        transaction = await escrow.connect(seller).approveSale(1);
        await transaction.wait();

        transaction = await escrow.connect(lender).approveSale(1);
        await transaction.wait();

        await lender.sendTransaction({
          to: escrow.getAddress(),
          value: tokens(5),
        });

        transaction = await escrow.connect(seller).finalizeSale(1);
        await transaction.wait();
      });

      it("Updates ownership", async () => {
        expect(await realEstate.ownerOf(1)).to.be.equal(buyer.address);
      });

      it("Updates balance", async () => {
        expect(await escrow.getBalance()).to.be.equal(0);
      });
    });
  });
});
