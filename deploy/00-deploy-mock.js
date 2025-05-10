const { DECIMAL, INITIAL_ANSWER ,developmentChains} = require("../help-hardhat-config")

module.exports = async({getNamedAccounts,deployments}) => {
    // const firstAccount = (await getNamedAccounts()).firstAccount
/*     console.log(`first account is ${firstAccount}`)
    console.log("this is a deploy function") */
    if(developmentChains.includes(network.name)){
        const {firstAccount} = await getNamedAccounts()
        const {deploy} = deployments
        await deploy("MockV3Aggregator",{
            from:firstAccount,
            args:[DECIMAL,INITIAL_ANSWER],
            log:true
        })
    }else{
        console.log("environment is not local,mock contract deployment is skipped...")
    }
}

module.exports.tags = ["all","mock"]