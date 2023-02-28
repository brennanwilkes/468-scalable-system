/**
 * Returns the latest quote for a certain symbol. Checks the redis
 * cache before calling the quote server. 
 * @param stockSymbol Symbol of the Stock to get a quote of
 */
export async function getQuote(stockSymbol: string, byPassRedis?: boolean): Promise<{price: number; cryptokey: string}> {
    return {price: 1,  cryptokey: "testCryptoKey"};
}