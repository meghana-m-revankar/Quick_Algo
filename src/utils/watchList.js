import { asyncGetLotSizeBysymbol, asyncGetSymbolExpiryList, asyncGetWatchListByUserId } from "#redux/symbol/symbolAction.js";
import { handleCatchErrors } from "./validation";

export const fetchWatchList = async (data, navigate) => {
    try {
        const result = await asyncGetWatchListByUserId({sendData:data});
        return result?.data?.result; // Return the fetched data
    } catch (err) {
        handleCatchErrors(err, navigate);
        return null; // Return null or handle errors gracefully
    }
};

export const fetchSymbolExpiryList = async (data, navigate) => {
    try {
        const result = await asyncGetSymbolExpiryList({sendData:data});
        return result?.data?.result; // Return the fetched data
    } catch (err) {
        handleCatchErrors(err, navigate);
        return null; // Return null or handle errors gracefully
    }
};


export const fetchSymbolLotSize = async (sendData, navigate) => {
    try {
        const result = await asyncGetLotSizeBysymbol({sendData});
        return result?.data?.result; // Return the fetched data
    } catch (err) {
        handleCatchErrors(err, navigate);
        return null; // Return null or handle errors gracefully
    }
};




