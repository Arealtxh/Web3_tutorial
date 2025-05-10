const { ethers, deployments, getNamedAccounts } = require("hardhat")
const { assert,expect } = require("chai")
const helpers = require("@nomicfoundation/hardhat-network-helpers")
const {developmentChains} = require("../../help-hardhat-config")

!developmentChains.includes(network.name)?describe.skip:
describe("test fundme contract",async function () {
   let fundMe
   let fundMeSecondAccount
   let firstAccount
   let secondAccount
   let MockV3Aggregator

   beforeEach(async function() {
       await deployments.fixture(["all"])
       firstAccount = (await getNamedAccounts()).firstAccount
       secondAccount = (await getNamedAccounts()).secondAccount
       const fundMeDeployment = await deployments.get("FundMe")
       MockV3Aggregator = await deployments.get("MockV3Aggregator")
       fundMe = await ethers.getContractAt("FundMe",fundMeDeployment.address)
       fundMeSecondAccount = await ethers.getContract("FundMe",secondAccount)
   })

    it("test if the owner is msg.sender",async function(){
        // const [firstAccount] = await ethers.getSigners()
        
        // const fundMeFactory = await ethers.getContractFactory("FundMe")
        // const fundMe = await fundMeFactory.deploy(180)
        await fundMe.waitForDeployment()
        assert.equal((await fundMe.owner()),firstAccount)
    })

    it("test if the dataFeed is assigned correctly",async function (){
        // const fundMeFactory = await ethers.getContractFactory("FundMe")
        // const fundMe = await fundMeFactory.deploy(180)
        await fundMe.waitForDeployment()
        assert.equal((await fundMe.dataFeed()),MockV3Aggregator.address)
    })

    //fund,getfund,refund

    //unit test for fund 
    //window open,value greater than minimum value,funder balance
    it("window closed, value greater than minimum, fund failed",async function () {
        //make sure the window is closed
        await helpers.time.increase(200)
        await helpers.mine()
        //value is greater than minimum
        expect(fundMe.fund({value:ethers.parseEther("0.1")}))
            .to.be.revertedWith("window is closed")
    }) 

   it("window open,value is less than minimum,fund failed",async function () {
        expect(fundMe.fund({value:ethers.parseEther("0.01")}))
            .to.be.revertedWith("Send more ETH")
   }) 

   it("window open,value is greater than minimum,fund success",async function () {
        await fundMe.fund({value:ethers.parseEther("0.1")})
        const balance = await fundMe.fundersToAmount(firstAccount)
        expect(balance).to.equal(ethers.parseEther("0.1"))
   })

   //unit test for getfund
   //onlyOwner,windowClose,target reached
   it("not onwner,window closed,target reached,getfund failed",async function () {
        //make sure target is reached
        await fundMe.fund({value:ethers.parseEther("1")})

        //make sure window is closed
        await helpers.time.increase(200)
        await helpers.mine()

        await expect(fundMeSecondAccount.getFund()).to.be.revertedWith("this function can only be called by owner")
   })

   it("window open , target reached , getfund failed",async function () {
        await fundMe.fund({value:ethers.parseEther("1")})
        await expect(fundMe.getFund()).to.be.revertedWith("window is not closed")
   })

   it("window closed ,target not reached,getfund failed",async function () {
        await fundMe.fund({value:ethers.parseEther("0.1")})
        await helpers.time.increase(200)
        await helpers.mine()
        await expect(fundMe.getFund()).to.be.revertedWith("Target is not reached")
   })

   //unit test for refund
   it("window closed, target reached, getfund success",async function () {
        await fundMe.fund({value:ethers.parseEther("1")})
        await helpers.time.increase(200)
        await helpers.mine()
        await expect(fundMe.getFund()).to.emit(fundMe,"FundWithdrawByOwner").withArgs(ethers.parseEther("1"))
   })

   //refund 
   //window is closed,targed not reached,funder has balance
   it("window open ,targed  not reached,funder has balance",async function () {
        await fundMe.fund({value:ethers.parseEther("0.1")})
        await expect(fundMe.refund()).to.be.revertedWith("window is not closed")
   })

   it("window closed ,target reached,funder has balance",async function () {
       await fundMe.fund({value:ethers.parseEther("1")})
       await helpers.time.increase(200)
       await helpers.mine()
       await expect(fundMe.refund()).to.be.revertedWith("Target is reached")
   })

   it("window closed ,target reached,funder has not balance",async function () {
     await fundMe.fund({value:ethers.parseEther("0.1")})
     await helpers.time.increase(200)
     await helpers.mine()
     await expect(fundMeSecondAccount.refund()).to.be.revertedWith("there is no fund for you")
   })

   it("window closed ,target not reached,funder has balance",async function () {
     await fundMe.fund({value:ethers.parseEther("0.1")})
     await helpers.time.increase(200)
     await helpers.mine()
     await expect(fundMe.refund()).to.emit(fundMe,"RefundByFunder").withArgs(firstAccount,ethers.parseEther("0.1"))
   })
})