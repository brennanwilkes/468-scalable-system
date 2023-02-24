import * as figlet from 'figlet'
import {Command } from 'commander'
import * as fs from 'fs'
import path from 'path';
import { createInterface } from 'readline';


const program = new Command();

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
    let args = command.split(',');
    const transactionCommand = args[0];
    args.splice(0, 1);
    switch(transactionCommand){
        case 'ADD': 
            //handle add
            return;
        case 'QUOTE':
            //handle quote
            return;
        case 'BUY':
            //handle buy
            return;
        case 'COMMIT_BUY':
            //handle commit_buy
            return;
        case 'CANCEL_BUY':
            //handle cancel_buy
            return;
        case 'SELL':
            //handle sell
            return;
        case 'COMMIT_SELL':
            //handle commit_sell
            return;
        case 'CANCEL_SELL':
            //handle cancel_sell
            return;
        case 'SET_BUY_AMOUNT':
            //handle set_buy_amount
            return;
        case 'CANCEL_SET_BUY':
            //handle cancel_set_buy
            return;
        case 'SET_BUY_TRIGGER':
            //handle set_buy_trigger
            return;
        case 'SET_SELL_AMOUNT':
            //handle set_sell_amount
            return;
        case 'SET_SELL_TRIGGER':
            //handle set_sell_trigger
            return;
        case 'CANCEL_SET_SELL':
            //handle cancel_set_sell
            return;
        case 'DUMPLOG':
            //handle dumplog
            return;
        case 'DISPLAY_SUMMARY':
            //handle display_summary
            return;
    }
        



} 

