require("dotenv").config();
const functions = require('@google-cloud/functions-framework');
const Moralis = require("moralis").default;
const TOKEN_ABI = require("./tokenAbi.json");
const ASSETS_ABI = require("./assetsAbi.json");
const GOVERNOR_ABI = require("./governorAbi.json");
const TOKEN_DECIMALS = 100000000
const NAV_DECIMALS = 100

Moralis.start({
    apiKey: process.env.MORALIS_KEY
})

exports.getTreasuryStats = (req, res) => {
    if (!authenticateRequest(req, res)) res.send('Unauthorized');
    else {
        const id = generateRandomWords(3, "-")
        getTreasuryStats()
            .then(data => {
                // console.log("RED > getTreasuryStats > data: ", data)

                res.status(200).send({
                    data: {
                        "totalReservesInEur": data.position.real,
                        "naptInEur": data.napt.real,
                        "nrOfAssets": data.nrOfAssets,
                        "supplyReal": data.supply.real
                    },
                    meta: data,
                    id: id
                })
            }).catch(err => {
                console.log(`RED > getTreasuryStats | Run id: ${id}. Error [B_Oracle_01]: ${err}`)
                res.status(500).send(
                    {
                        "error": `Error code: B_Oracle_01, contact admin and reference request id: ${id}.`
                    }
                )
            });
    }
};

const authenticateRequest = (req, res) => {
    const expectedAuthValue = process.env.CHAINLINK_API_KEY;
    const authHeaderValue = req.headers.authorization;
    if (!authHeaderValue) return false;
    return expectedAuthValue === authHeaderValue
}

function generateRandomWord(length) {
    let result = '';
    const characters = 'abcdefghijklmnopqrstuvwxyz';
    const charactersLength = characters.length;
    for (let i = 0; i < length; i++) {
        result += characters.charAt(Math.floor(Math.random() * charactersLength));
    }
    return result;
}

function generateRandomWords(n, separator) {
    let words = [];
    for (let i = 0; i < n; i++) {
        // Let's generate words of random length between 5 and 10
        let wordLength = Math.floor(Math.random() * 6) + 5;
        words.push(generateRandomWord(wordLength));
    }
    return words.join(separator);
}

const getTreasuryStats = async () => {
    const naptPromise = getNapt()
    const navPromise = getNAV()
    const supplyPromise = getSupply()
    const nrOfAssetsPromise = getNrOfAssets()

    return Promise.all([naptPromise, navPromise, supplyPromise, nrOfAssetsPromise])
        .then((values) => {
            console.log(values)
            return {
                "nrOfAssets": values[3],
                "position": {
                    "value": values[1],
                    "real": values[1] / NAV_DECIMALS
                },
                "napt": {
                    "value": values[0],
                    "real": values[0] / TOKEN_DECIMALS
                },
                "supply": {
                    "value": values[2],
                    "real": values[2] / TOKEN_DECIMALS
                }
            }
        })
}

const getNapt = async () => {
    try {
        const resp = await Moralis.EvmApi.utils.runContractFunction({
            address: process.env.CONTRACT_ADR_GOVERNOR,
            chain: process.env.CHAIN_ID,
            functionName: "getNAPT",
            abi: GOVERNOR_ABI
        })

        return Number(resp.raw)
    } catch (error) {
        console.error("getNapt > error: ", error)
        return "N/A"
    }
}

const getNAV = async () => {
    try {
        const resp = await Moralis.EvmApi.utils.runContractFunction({
            address: process.env.CONTRACT_ADR_GOVERNOR,
            chain: process.env.CHAIN_ID,
            functionName: "totalPosition",
            abi: GOVERNOR_ABI
        })

        return Number(resp.raw)
    } catch (error) {
        console.error("getNAV > error: ", error)
        return "N/A"
    }
}

const getSupply = async () => {
    try {
        const resp = await Moralis.EvmApi.utils.runContractFunction({
            address: process.env.CONTRACT_ADR_RED_TOKEN,
            chain: process.env.CHAIN_ID,
            functionName: "totalSupply",
            abi: TOKEN_ABI
        })

        return Number(resp.raw)
    } catch (error) {
        console.error("getSupply > error: ", error)
        return "N/A"
    }
}


const getNrOfAssets = async () => {
    try {
        const resp = await Moralis.EvmApi.utils.runContractFunction({
            address: process.env.CONTRACT_ADR_ASSETS,
            chain: process.env.CHAIN_ID,
            functionName: "assets",
            abi: ASSETS_ABI
        })

        return Number(resp.raw.length)
    } catch (error) {
        console.error("getSupply > error: ", error)
        return "N/A"
    }
}