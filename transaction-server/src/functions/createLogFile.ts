import {FindCursor, WithId, Document } from 'mongodb';
import { LogAccountTransaction, LogDebugEvent, LogErrorEvent, LogMongo, LogQuoteServer, LogSystemEvent, LogUserCommand } from '../mongoTypes';
import {create, createCB} from 'xmlbuilder2';
import * as fs from 'fs'
import path from 'path';

export async function createLogFile(filename: string, MongoData: FindCursor<WithId<Document>>) {
    const ws = fs.createWriteStream(path.resolve(__dirname, '..' , `logs`, filename + '.xml'));
      
    const xml = createCB({
        data: (text: any) => {
          ws.write(text);
        }, prettyPrint: true});

    xml.on('end', () => {
        ws.end();
        ws.close();
    });

    xml.dec().ele('log');

    await MongoData.forEach((log) => {
        switch(log.type){
            case 'User':
                const userLog = log as LogUserCommand;
                const userLogXml = xml.ele('userCommand');

                userLogXml.ele('timestamp').txt(userLog.timestamp.toString()).up();
                userLogXml.ele('server').txt(userLog.server).up();
                userLogXml.ele('transactionNum').txt(userLog.transactionNumber.toString()).up();
                userLogXml.ele('command').txt(userLog.command).up();
                if(userLog.userId) {
                    userLogXml.ele('username').txt(userLog.userId).up();
                }
                if(userLog.stockSymbol) {
                    userLogXml.ele('stockSymbol').txt(userLog.stockSymbol).up();
                }
                if(userLog.filename) {
                    userLogXml.ele('filename').txt(userLog.filename).up();
                }
                if(userLog.funds) {
                    userLogXml.ele('funds').txt(userLog.funds.toString()).up();
                }
                userLogXml.up();
                return;
            case 'Quote':
                const quoteLog = log as LogQuoteServer;
                const quoteLogXml = xml.ele('quoteServer');

                quoteLogXml.ele('timestamp').txt(quoteLog.timestamp.toString()).up();
                quoteLogXml.ele('server').txt(quoteLog.server).up();
                quoteLogXml.ele('transactionNum').txt(quoteLog.transactionNumber.toString()).up();
                quoteLogXml.ele('price').txt(quoteLog.price.toString()).up();
                quoteLogXml.ele('stockSymbol').txt(quoteLog.stockSymbol).up();
                quoteLogXml.ele('username').txt(quoteLog.userId).up();
                quoteLogXml.ele('quoteServerTime').txt(quoteLog.quoteServerTime.toString()).up();
                quoteLogXml.ele('cryptokey').txt(quoteLog.cryptokey.toString()).up();
                quoteLogXml.up();
                return;
            case 'Account':
                const accountLog = log as LogAccountTransaction;
                const accountLogXml = xml.ele('accountTransaction');

                accountLogXml.ele('timestamp').txt(accountLog.timestamp.toString()).up();
                accountLogXml.ele('server').txt(accountLog.server).up();
                accountLogXml.ele('transactionNum').txt(accountLog.transactionNumber.toString()).up();
                accountLogXml.ele('action').txt(accountLog.action).up();
                accountLogXml.ele('username').txt(accountLog.userId).up();
                accountLogXml.ele('funds').txt(accountLog.funds.toString()).up();
                accountLogXml.up();
                return;
            case 'System':
                const systemLog = log as LogSystemEvent;
                const systemLogXml = xml.ele('systemEvent');

                systemLogXml.ele('timestamp').txt(systemLog.timestamp.toString()).up();
                systemLogXml.ele('server').txt(systemLog.server).up();
                systemLogXml.ele('transactionNum').txt(systemLog.transactionNumber.toString()).up();
                systemLogXml.ele('command').txt(systemLog.command).up();
                if(systemLog.userId) {
                    systemLogXml.ele('username').txt(systemLog.userId).up();
                }
                if(systemLog.stockSymbol) {
                    systemLogXml.ele('stockSymbol').txt(systemLog.stockSymbol).up();
                }
                if(systemLog.filename) {
                    systemLogXml.ele('filename').txt(systemLog.filename).up();
                }
                if(systemLog.funds) {
                    systemLogXml.ele('funds').txt(systemLog.funds.toString()).up();
                }
                systemLogXml.up();
                return;
            case 'Error':
                const errorLog = log as LogErrorEvent;
                const errorLogXml = xml.ele('errorEvent');

                errorLogXml.ele('timestamp').txt(errorLog.timestamp.toString()).up();
                errorLogXml.ele('server').txt(errorLog.server).up();
                errorLogXml.ele('transactionNum').txt(errorLog.transactionNumber.toString()).up();
                errorLogXml.ele('command').txt(errorLog.command).up();
                if(errorLog.userId) {
                    errorLogXml.ele('username').txt(errorLog.userId).up();
                }
                if(errorLog.stockSymbol) {
                    errorLogXml.ele('stockSymbol').txt(errorLog.stockSymbol).up();
                }
                if(errorLog.filename) {
                    errorLogXml.ele('filename').txt(errorLog.filename).up();
                }
                if(errorLog.funds) {
                    errorLogXml.ele('funds').txt(errorLog.funds.toString()).up();
                }
                if(errorLog.errorMessage) {
                    errorLogXml.ele('errorMessage').txt(errorLog.errorMessage).up();
                }
                errorLogXml.up();
                return;
            case 'Debug':
                const debugLog = log as LogDebugEvent;
                const debugLogXml = xml.ele('debugEvent');

                debugLogXml.ele('timestamp').txt(debugLog.timestamp.toString()).up();
                debugLogXml.ele('server').txt(debugLog.server).up();
                debugLogXml.ele('transactionNum').txt(debugLog.transactionNumber.toString()).up();
                debugLogXml.ele('command').txt(debugLog.command).up();
                if(debugLog.userId) {
                    debugLogXml.ele('username').txt(debugLog.userId).up();
                }
                if(debugLog.stockSymbol) {
                    debugLogXml.ele('stockSymbol').txt(debugLog.stockSymbol).up();
                }
                if(debugLog.filename) {
                    debugLogXml.ele('filename').txt(debugLog.filename).up();
                }
                if(debugLog.funds) {
                    debugLogXml.ele('funds').txt(debugLog.funds.toString()).up();
                }
                if(debugLog.debugMessage) {
                    debugLogXml.ele('debugMessage').txt(debugLog.debugMessage).up();
                }
                debugLogXml.up();
                return;
        }
    })
    xml.up().end();
    return path.resolve(__dirname, `logs`, filename + '.xml');

}