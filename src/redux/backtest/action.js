import { NODE_API_ENDPOINTS } from "#constant/endPoint";
import Storage from "#services/storage";
import axios from "axios";
const {  REACT_APP_CHART_SECRET_TOKEN } = process.env;

const isDevelopment = process.env.REACT_APP_ENV === "development";
const REACT_APP_CHART_API_ENDPOINT = isDevelopment
  ? process.env.REACT_APP_CHART_API_ENDPOINT
  : process.env.REACT_APP_CHART_PRODUCTION_API_ENDPOINT;
// Async action to Add Broker
export const asyncPostStartBacktest = async ({ formData }) => {
    // Get cusToken from localStorage, fallback to static token
    const cusToken = Storage.decryptData(localStorage.getItem("cusToken"));
    const token = cusToken || REACT_APP_CHART_SECRET_TOKEN;
    
    // Make the API call using axios
    const response = await axios.post(`${REACT_APP_CHART_API_ENDPOINT}/${NODE_API_ENDPOINTS?.startBacktest}`, 
        { ...formData },
        {
            headers: {
                Authorization: `Bearer ${token}`,
                'Content-Type': 'application/json',
            },
        }
    );

    // Return the response data directly (success or failure response)
    return response;
};

// Admin strategy backtest: optional fromDate, toDate (YYYY-MM-DD), symbol; backtestType 'full'|'spot' (spot uses strike from selectedSymbols)
export const asyncPostStartStrategyBacktest = async ({ strategyId, fromDate, toDate, symbol, backtestType }) => {
    const cusToken = Storage.decryptData(localStorage.getItem("cusToken"));
    const token = cusToken || REACT_APP_CHART_SECRET_TOKEN;
    const body = { strategyId };
    if (fromDate) body.fromDate = fromDate;
    if (toDate) body.toDate = toDate;
    if (symbol) body.symbol = symbol;
    if (backtestType === 'spot' || backtestType === 'full') body.backtestType = backtestType;
    const response = await axios.post(
        `${REACT_APP_CHART_API_ENDPOINT}/${NODE_API_ENDPOINTS?.startStrategyBacktest}`,
        body,
        {
            headers: {
                Authorization: `Bearer ${token}`,
                "Content-Type": "application/json",
            },
        }
    );
    return response;
};