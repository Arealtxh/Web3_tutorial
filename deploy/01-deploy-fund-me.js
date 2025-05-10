/* function deployFunction(){
    console.log("this is a deploy function")
} */

const { getNamedAccounts, deployments, network, getChainId } = require("hardhat")
const { developmentChains, LOCK_TIME,networkConfig ,CONFIRMATIONS} = require("../help-hardhat-config")

// module.exports.default = deployFunction
/* module.exports = async(hre) => {
    const getNamedAccounts = hre.getNamedAccounts
    const deployments = hre.deployments
    console.log("this is a deploy function")
} */

module.exports = async({getNamedAccounts,deployments}) => {
    // const firstAccount = (await getNamedAccounts()).firstAccount
    const {firstAccount} = await getNamedAccounts()
    const {deploy} = deployments
    
    let dataFeedAddr
    let confirmations

    if(developmentChains.includes(network.name)){
        const MockV3Aggregator = await deployments.get("MockV3Aggregator")
        dataFeedAddr = MockV3Aggregator.address
        confirmations = 0
    }else{
        dataFeedAddr = networkConfig[network.config.chainId].ethUsdDataFeed
        confirmations = CONFIRMATIONS
    }

/*     console.log(`first account is ${firstAccount}`)
    console.log("this is a deploy function") */
    const fundMe = await deploy("FundMe",{
        from:firstAccount,
        args:[LOCK_TIME,dataFeedAddr],
        log:true,
        waitConfirmations: confirmations
    })
    //remove deployment directory or add --reset flag if you want redeploy contract

    if(hre.network.config.chainId == 11155111&& process.env.ETHERSCAN_API_KEY){
        await hre.run("verify:verify", {
            address: fundMe.address,
            constructorArguments: [LOCK_TIME,dataFeedAddr],
          });
    }else{
        console.log("Neywork is not sepolia,verification skipped...")
    }
}

module.exports.tags = ["all","fundme"]