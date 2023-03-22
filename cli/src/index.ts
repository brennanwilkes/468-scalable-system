import * as figlet from 'figlet'
import {Command } from 'commander'
import * as fs from 'fs'
import path, { parse } from 'path';
import { createInterface } from 'readline';
import axios from 'axios';
import http from 'http';
import cluster from 'cluster';
const numCPUs = 4;


const program = new Command();

const url = 'localhost:5001';
const agent = new http.Agent({ keepAlive: true, maxFreeSockets: 1300})
axios.defaults.httpAgent = agent;
if(cluster.isPrimary) {
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
        const users: {index: number, userid: string}[] = []
        const userCommands: string[][] = []
        let dumpLogNonUser: string;
        console.log('Parsing commands...')
        let count = 1;
        for await (const line of rl) {
            if(count % 10000 == 0) {
                console.log(`${count} commands parsed...`)
            }
            const command = line.split(' ')[1]
            if(command.split(',')[0] == 'DUMPLOG' && command.split(',')[2] == undefined) {
                dumpLogNonUser = command
            } else {
                const user = users.find((user) => {
                    if(user.userid == command.split(',')[1]) {
                        return true;
                    }
                    return false;
                })

                if(!user) {

                    const newUser = {
                        index: users.length,
                        userid: command.split(',')[1]
                    }
                    users.push(newUser);
                    userCommands.push([]);
                    userCommands[newUser.index].push(command);
                } else {
                    userCommands[user.index].push(command)
                }
            }
            count += 1;
        }

        console.log('Commands parsed. Forking workers...')
        const usersPerGroup = Math.ceil(userCommands.length / numCPUs);
        const userGroups = [];
        for(let i = 0; i < numCPUs; i++) {
            userGroups.push(userCommands.slice(i * usersPerGroup, (i + 1) * usersPerGroup))
        }
    
        for (let i = 0; i < numCPUs; i++) {
            console.log(`Forking worker ${i}. Worker ${i} has ${userGroups[i].length} users...`)
            const worker = cluster.fork();
            worker.send({ userGroup: userGroups[i] });
          }
        
        let processedCount = 0;
        cluster.on('message', async (worker, message) => {
            if (message.type === 'processed') {
              processedCount++;
              if (processedCount === numCPUs) {
                console.log('All commands processed successfully. Getting DUMPLOG...');
                await parseCommand(dumpLogNonUser!);
                console.log('DUMPLOG complete. Exiting...')
                process.exit(0);
              }
            }
            })
        
}
} else {
    process.on('message', async (message: any) => {
        const userGroup: any = message.userGroup;
        await Promise.all(userGroup.map(async (userCommands: any) => {
            await runUserCommands(userCommands);

        }))
        process.send!({ type: 'processed' });
    })
    
}

async function runUserCommands(userCommands: string[]) {
    for(const command of userCommands) {
        await parseCommand(command);
    }
}

async function parseCommand(command: string) {
    //console.log(command);
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
            //console.log(addResponse.data);
            return;
        case 'QUOTE':
            const quoteResponse = await axios.get(`http://${url}/api/QUOTE?userId=${args[0]}&stockSymbol=${args[1]}`);
            //console.log(quoteResponse.data);
            return;
        case 'BUY':
            const buyBody = {
                userId:  args[0],
                stockSymbol: args[1],
                amount:  parseFloat(args[2]),
            }
            const buyResponse = await axios.post(`http://${url}/api/BUY`, buyBody);
            //console.log(buyResponse.data);
            return;
        case 'COMMIT_BUY':
            const commitBuyBody = {
                userId:  args[0],
            }
            const commitBuyResponse = await axios.post(`http://${url}/api/COMMIT_BUY`, commitBuyBody);
            //console.log(commitBuyResponse.data);
            return;
        case 'CANCEL_BUY':
            const cancelBuyBody = {
                userId:  args[0],
            }
            const cancelBuyResponse = await axios.post(`http://${url}/api/CANCEL_BUY`, cancelBuyBody);
            //console.log(cancelBuyResponse.data);
            return;
        case 'SELL':
            const sellBody = {
                userId:  args[0],
                stockSymbol: args[1],
                amount:  parseFloat(args[2]),
            }
            const sellResponse = await axios.post(`http://${url}/api/SELL`, sellBody);
            //console.log(sellResponse.data);
            return;
        case 'COMMIT_SELL':
            const commitSellBody = {
                userId:  args[0],
            }
            const commitSellResponse = await axios.post(`http://${url}/api/COMMIT_SELL`, commitSellBody);
            //console.log(commitSellResponse.data);
            return;
        case 'CANCEL_SELL':
            const cancelSellBody = {
                userId:  args[0],
            }
            const cancelSellResponse = await axios.post(`http://${url}/api/CANCEL_SELL`, cancelSellBody);
            //console.log(cancelSellResponse.data);
            return;
        case 'SET_BUY_AMOUNT':
            const setBuyAmountBody = {
                userId:  args[0],
                stockSymbol: args[1],
                amount:  parseFloat(args[2]),
            }
            const setBuyAmountResponse = await axios.post(`http://${url}/api/SET_BUY_AMOUNT`, setBuyAmountBody);
            //console.log(setBuyAmountResponse.data);
            return;
        case 'CANCEL_SET_BUY':
            const cancelSetBuyBody = {
                userId:  args[0],
                stockSymbol: args[1],
            }
            const cancelSetBuyResponse = await axios.post(`http://${url}/api/CANCEL_SET_BUY`, cancelSetBuyBody);
            //console.log(cancelSetBuyResponse.data);
            return;
        case 'SET_BUY_TRIGGER':
            const setBuyTriggerBody = {
                userId:  args[0],
                stockSymbol: args[1],
                amount:  parseFloat(args[2]),
            }
            const setBuyTriggerResponse = await axios.post(`http://${url}/api/SET_BUY_TRIGGER`, setBuyTriggerBody);
            //console.log(setBuyTriggerResponse.data);
            return;
        case 'SET_SELL_AMOUNT':
            const setSellAmountBody = {
                userId:  args[0],
                stockSymbol: args[1],
                amount:  parseFloat(args[2]),
            }
            const setSellAmountResponse = await axios.post(`http://${url}/api/SET_SELL_AMOUNT`, setSellAmountBody);
            //console.log(setSellAmountResponse.data);
            return;
        case 'SET_SELL_TRIGGER':
            const setSellTriggerBody = {
                userId:  args[0],
                stockSymbol: args[1],
                amount:  parseFloat(args[2]),
            }
            const setSellTriggerResponse = await axios.post(`http://${url}/api/SET_SELL_TRIGGER`, setSellTriggerBody);
            //.log(setSellTriggerResponse.data);
            return;
        case 'CANCEL_SET_SELL':
            const cancelSetSellBody = {
                userId:  args[0],
                stockSymbol: args[1],
            }
            const cancelSetSellResponse = await axios.post(`http://${url}/api/CANCEL_SET_SELL`, cancelSetSellBody);
            //console.log(cancelSetSellResponse.data);
            return;
        case 'DUMPLOG':
            let dumplogResponse;
            if(args.length > 1) {
                dumplogResponse = await axios.get(`http://${url}/api/DUMPLOG?userId=${args[0]}&fileName=${args[1]}`);
            } else {
                dumplogResponse = await axios.get(`http://${url}/api/DUMPLOG?fileName=${args[0]}`);
            }
            //console.log(dumplogResponse.data);
            return;
        case 'DISPLAY_SUMMARY':
            const displaySummaryResponse = await axios.get(`http://${url}/api/DISPLAY_SUMMARY?userId=${args[0]}`);
            //console.log(displaySummaryResponse.data);
            return;
    }
        



} 

