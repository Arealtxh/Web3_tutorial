//import ethers.js
//create main function

//excute main function

//js中要引入第三方包需要定义一个常量
const { ethers } = require("hardhat")

async function main(){
    //create factory
    const fundMeFactory = await ethers.getContractFactory("FundMe")
    console.log("contract deploying")
    //deploy contract from factory
    const fundMe = await fundMeFactory.deploy(300)
    await fundMe.waitForDeployment()
    //console.log(`contract has been deployed successfully, contract address is ${fundMe.target}`)
    console.log("contract has been deployed successfully, contract address is " + fundMe.target);
    
    //verify fundme
    if(hre.network.config.chainId == 11155111&& process.env.ETHERSCAN_API_KEY){
       console.log("waiting for 5 confirmations")
       await fundMe.deploymentTransaction().wait(5)
       await verifyFundMe(fundMe.target,[300])
    } else {
      console.log("verification skipperd..")
    }
}

  //init 2 accounts
  const [firstAccount,secondAccount]=await ethers.getSigners()

  //fund contract with first account
  const fundTx = await fundMe.fund({value:ethers.parseEther("0.5")})
  await fundTx.wait()

  //check balance of contract
  const balanceOfcontract = await ethers.provider.getBalance(fundMe.target)
  console.log(`Balance of the contract is ${balanceOfcontract}`)

  //fund contract with second account
  const fundTxwithSecondAccount = await fundMe.connect(secondAccount).fund({value:ethers.parseEther("0.5")})
  await fundTxwithSecondAccount.wait()

  //check balance of contract
  const balanceOfcontractAfterSecondFund = await ethers.provider.getBalance(fundMe.target)
  console.log(`Balance of the contract is ${balanceOfcontractAfterSecondFund}`)

  //check mapping(fundersToAmount)
  const firstAccountbalanceInFundMe = await fundMe.fundersToAmount(firstAccount.address)
  const secondAccountbalanceInFundMe = await fundMe.fundersToAmount(secondAccount.address)
  console.log(`Balance of first account ${firstAccount.address} is ${firstAccountbalanceInFundMe}`)
  console.log(`Balance of second account ${secondAccount.address} is ${secondAccountbalanceInFundMe}`)


async function verifyFundMe(fundMeAddr,args){
    //hre hardhat environment
    //run关键字 能让javascript运行命令行里的命令
    await hre.run("verify:verify", {
        address: fundMeAddr,
        constructorArguments: args,
      });
}

main().then().catch((error) => {
    console.error(error)
    process.exit(0)
})