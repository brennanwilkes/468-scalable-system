import * as figlet from 'figlet'
import {Command } from 'commander'
import * as fs from 'fs'
import path from 'path';
import { createInterface } from 'readline';
import axios from 'axios';


const program = new Command();

const url = 'localhost:3001';
console.log(figlet.textSync("Transaction Server CLI"));

program
    .version("1.0.0")
    .description("CLI to run commands against the transaction server. Optionally can load a file of commands formatted correctly.")

program.command('run <command>')
    .alias('r')
    .action((argument) => {
        parseCommand(argument);
    })

program.command('load-file <filePath>')
    .alias('f')
    .action((argument) => {
        handleFile(argument)
    })
program.parse()

async function handleFile(filePath: string) {
    const filePathTrue = path.resolve(__dirname, filePath);
    if(!fs.existsSync(filePathTrue)) {
        console.error(`File not found at ${filePathTrue}. Are you sure that ${filePath} is correct?`)
        return;
    }
    console.log('File found. Reading...')
    const fileReadStream = fs.createReadStream(filePathTrue);

    const rl = createInterface({
        input: fileReadStream,
        crlfDelay: Infinity,
    })

    for await (const line of rl) {
        const command = line.split(' ')[1]
        await parseCommand(command)
    }
}

async function parseCommand(command: string) {
    console.log(command);
    let args = command.split(',');
    const transactionCommand = args[0];
    args.splice(0, 1);
    switch(transactionCommand){
        case 'ADD': 
            const addBody = {
                userId:  args[0],
                amount:  parseFloat(args[1]),
            }
            const addResponse = await axios.post(`http://${url}/api/ADD`, addBody);
            console.log(addResponse.data);
            return;
        case 'QUOTE':
            const quoteResponse = await axios.get(`http://${url}/api/QUOTE?userId=${args[0]}&stockSymbol=${args[1]}`);
            console.log(quoteResponse.data);
            return;
        case 'BUY':
            const buyBody = {
                userId:  args[0],
                stockSymbol: args[1],
                amount:  parseFloat(args[2]),
            }
            const buyResponse = await axios.post(`http://${url}/api/BUY`, buyBody);
            console.log(buyResponse.data);
            return;
        case 'COMMIT_BUY':
            const commitBuyBody = {
                userId:  args[0],
            }
            const commitBuyResponse = await axios.post(`http://${url}/api/COMMIT_BUY`, commitBuyBody);
            console.log(commitBuyResponse.data);
            return;
        case 'CANCEL_BUY':
            const cancelBuyBody = {
                userId:  args[0],
            }
            const cancelBuyResponse = await axios.post(`http://${url}/api/CANCEL_BUY`, cancelBuyBody);
            console.log(cancelBuyResponse.data);
            return;
        case 'SELL':
            const sellBody = {
                userId:  args[0],
                stockSymbol: args[1],
                amount:  parseFloat(args[2]),
            }
            const sellResponse = await axios.post(`http://${url}/api/SELL`, sellBody);
            console.log(sellResponse.data);
            return;
        case 'COMMIT_SELL':
            const commitSellBody = {
                userId:  args[0],
            }
            const commitSellResponse = await axios.post(`http://${url}/api/COMMIT_SELL`, commitSellBody);
            console.log(commitSellResponse.data);
            return;
        case 'CANCEL_SELL':
            const cancelSellBody = {
                userId:  args[0],
            }
            const cancelSellResponse = await axios.post(`http://${url}/api/CANCEL_SELL`, cancelSellBody);
            console.log(cancelSellResponse.data);
            return;
        case 'SET_BUY_AMOUNT':
            const setBuyAmountBody = {
                userId:  args[0],
                stockSymbol: args[1],
                amount:  parseFloat(args[2]),
            }
            const setBuyAmountResponse = await axios.post(`http://${url}/api/SET_BUY_AMOUNT`, setBuyAmountBody);
            console.log(setBuyAmountResponse.data);
            return;
        case 'CANCEL_SET_BUY':
            const cancelSetBuyBody = {
                userId:  args[0],
                stockSymbol: args[1],
            }
            const cancelSetBuyResponse = await axios.post(`http://${url}/api/CANCEL_SET_BUY`, cancelSetBuyBody);
            console.log(cancelSetBuyResponse.data);
            return;
        case 'SET_BUY_TRIGGER':
            const setBuyTriggerBody = {
                userId:  args[0],
                stockSymbol: args[1],
                amount:  parseFloat(args[2]),
            }
            const setBuyTriggerResponse = await axios.post(`http://${url}/api/SET_BUY_TRIGGER`, setBuyTriggerBody);
            console.log(setBuyTriggerResponse.data);
            return;
        case 'SET_SELL_AMOUNT':
            const setSellAmountBody = {
                userId:  args[0],
                stockSymbol: args[1],
                amount:  parseFloat(args[2]),
            }
            const setSellAmountResponse = await axios.post(`http://${url}/api/SET_SELL_AMOUNT`, setSellAmountBody);
            console.log(setSellAmountResponse.data);
            return;
        case 'SET_SELL_TRIGGER':
            const setSellTriggerBody = {
                userId:  args[0],
                stockSymbol: args[1],
                amount:  parseFloat(args[2]),
            }
            const setSellTriggerResponse = await axios.post(`http://${url}/api/SET_SELL_TRIGGER`, setSellTriggerBody);
            console.log(setSellTriggerResponse.data);
            return;
        case 'CANCEL_SET_SELL':
            const cancelSetSellBody = {
                userId:  args[0],
                stockSymbol: args[1],
            }
            const cancelSetSellResponse = await axios.post(`http://${url}/api/CANCEL_SET_SELL`, cancelSetSellBody);
            console.log(cancelSetSellResponse.data);
            return;
        case 'DUMPLOG':
            let dumplogResponse;
            if(args.length > 1) {
                dumplogResponse = await axios.get(`http://${url}/api/DUMPLOG?userId=${args[0]}&fileName=${args[1]}`);
            } else {
                dumplogResponse = await axios.get(`http://${url}/api/DUMPLOG?fileName=${args[0]}`);
            }
            console.log(dumplogResponse.data);
            return;
        case 'DISPLAY_SUMMARY':
            const displaySummaryResponse = await axios.get(`http://${url}/api/DISPLAY_SUMMARY?userId=${args[0]}`);
            console.log(displaySummaryResponse.data);
            return;
    }
        



} 

