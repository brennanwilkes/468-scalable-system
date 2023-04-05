import http from "k6/http";
import exec from "k6/execution";
import { check, sleep } from "k6";

http.setResponseCallback(http.expectedStatuses(500, { min: 200, max: 399}));

const stocks = ['QJR', 'DMW', 'FOE', 'GJP', 'TRH', 'XIL', 'MOP', 'SVF', 'LNB', 'CZY', 'KTA', 'JIR', 'EWY', 'XWV', 'NPL', 'BRM', 'AUH', 'VZL', 'SDC', 'LGD', 'YXN', 'QOG', 'TKN', 'IWP', 'HCF', 'EXB', 'ZDU', 'YMQ', 'PAK', 'JVB']
export const options = {
    scenarios: {

        spike: {
    
          executor: "ramping-arrival-rate",
    
          preAllocatedVUs: 1000,

          maxVUs: 2000,
    
          timeUnit: "1s",
            stages: [
                { duration: "10s", target: 10 }, //ramp up to 10 iterations/s in 10 seconds

                { duration: "10s", target: 400 }, //ramp up to 400 iterations/s in 10 seconds

                { duration: "3m", target: 400 }, //stay at 400 iterations/s for 3 minutes

                { duration: "1m", target: 0 }, //ramp down to 0 iterations/s in 1 minute

            ],
            
        },

    },
}

export default async function() {
    const BASE_URL = "http://localhost:5001/api";
    const stock = stocks[Math.round(Math.random() * 29)]
    let res0 = await http.asyncRequest("POST", `${BASE_URL}/ADD`, JSON.stringify({ userId: `${exec.vu.idInInstance}`, amount: 10000 }),  {headers: { 'Content-Type': 'application/json' }},)
    let res1 = await http.asyncRequest("GET", `${BASE_URL}/QUOTE?userId=${exec.vu.idInInstance}&stockSymbol=${stock}`);
    let res2 = await http.asyncRequest("POST", `${BASE_URL}/BUY`, JSON.stringify({ userId: `${exec.vu.idInInstance}`, stockSymbol: stock, amount: 100 }), {headers: { 'Content-Type': 'application/json' }});
    let res3 = await http.asyncRequest("POST", `${BASE_URL}/COMMIT_BUY`, JSON.stringify({ userId: `${exec.vu.idInInstance}` }), {headers: { 'Content-Type': 'application/json' }});
    let res4 = await http.asyncRequest("POST", `${BASE_URL}/BUY`, JSON.stringify({ userId: `${exec.vu.idInInstance}`, stockSymbol: stock, amount: 100 }), {headers: { 'Content-Type': 'application/json' }});
    let res5 = await http.asyncRequest("POST", `${BASE_URL}/CANCEL_BUY`, JSON.stringify({ userId: `${exec.vu.idInInstance}` }), {headers: { 'Content-Type': 'application/json' }});
    let res6 = await http.asyncRequest("POST", `${BASE_URL}/COMMIT_BUY`, JSON.stringify({ userId: `${exec.vu.idInInstance}` }), {headers: { 'Content-Type': 'application/json' }});
    let res7 = await http.asyncRequest("GET", `${BASE_URL}/QUOTE?userId=${exec.vu.idInInstance}&stockSymbol=${stock}`);
    let res8 = await http.asyncRequest("POST", `${BASE_URL}/SELL`, JSON.stringify({ userId: `${exec.vu.idInInstance}`, stockSymbol: stock, amount: 10 }), {headers: { 'Content-Type': 'application/json' }});
    let res9 = await http.asyncRequest("POST", `${BASE_URL}/COMMIT_SELL`, JSON.stringify({ userId: `${exec.vu.idInInstance}` }), {headers: { 'Content-Type': 'application/json' }});
    let res10 = await http.asyncRequest("POST", `${BASE_URL}/SELL`, JSON.stringify({ userId: `${exec.vu.idInInstance}`, stockSymbol: stock, amount: 10 }), {headers: { 'Content-Type': 'application/json' }});
    let res11 = await http.asyncRequest("POST", `${BASE_URL}/CANCEL_SELL`, JSON.stringify({ userId: `${exec.vu.idInInstance}` }), {headers: { 'Content-Type': 'application/json' }});
}