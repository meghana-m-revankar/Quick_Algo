export const toastLoading = "Loading..."
export const resolveTime = 500
export const validation_message = "This Field is required"; 
export const defaultRow = 10; 
export const PerPageItem = 10; 
export const DefaultPage = 1; 
export const DefaultOrder = "asc" 
export const CompanyID = 1
export const SebiLink = "https://www.sebi.gov.in/sebiweb/home/HomeAction.do?doListing=yes&sid=1&ssid=7&smid=0"

export const tooltipDesign = {
    tooltip: {
      sx: {
        fontSize: "0.9rem",
        backgroundColor: "black", 
        color: "white",           // Tooltip text color
        "& .MuiTooltip-arrow": {
          color: "black",         // Arrow color
        },
      },
    },
  } ;

export const TextData={
   mtm_text:"The Total MTM shown here is not real. It only indicates what your profit or loss would be if you clicked the Buy or Sell button at this point — it's for live analysis purposes only.Your actual profit or loss will reflect in your demat account only after you place the order and it gets executed.",
   stop_loss:"Due to client trade risk, the company is setting a default Stop Loss (SL) of 25% from the buy point.This is because only 2 out of 10 clients use a stop loss when taking a trade. To help minimize your losses, the company has fixed a default SL at 25%.You cannot edit it"
}

export const toolTipData = {
  tradeLimit : "If the number of trades reaches the value you set here, then no more trades will be placed in these symbols for the rest of the day.If you want to allow more trades after the limit is hit, simply increase the Trade Limit value above the previous one, and trades will start again.👉 Important: Do not set values like 1, 3, 5, 7, etc. Instead, use even numbers like 2, 4, 6, 8, 10, and so on.",
  maxLoss:"If your total profit for the day reaches the value you set here, your system will auto-exit running trades, and no new trades will be placed for the rest of the day in these symbols only.",
  maxProfit:"If you want to allow more trades after hitting this profit or loss, simply increase the Max Profit or Max Loss For Day value — and the system will start taking trades again.",
  oP:"This setting lets you choose how far from the current price (ATM) you want to trade options based on your available funds.For example, if the ATM option is priced at ₹300, and buying 1 lot requires ₹22,500, but you only have ₹20,000, you can select OTM 1 or OTM 2 in Op Type. This will choose a cheaper option strike (further out-of-the-money), so the trade can be placed within your budget.",

}

export const chartObj = {
  interval : 30, //For 1 min
  resolution : ['1', '3', '5', '15', '30', '60'],
  session  : "0915-1530",
  timezone  : "Asia/Kolkata",
  minmov: 10,
  pricescale:100
}