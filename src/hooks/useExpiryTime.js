// Hook to calculate remaining days
export const daysRemaining = (expiryArray) => {
    const expiry = expiryArray.join("");
    const getMonthIndex = (monthStr) => {
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      return months.indexOf(monthStr.toUpperCase());
    };
  
   
    if (!expiry) return "Invalid Date";
  
    const today = new Date();
    const expiryDate = new Date(`20${expiry.slice(5, 7)}`, getMonthIndex(expiry.slice(2, 5)), expiry.slice(0, 2));
    const diffTime = expiryDate - today;
    const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));
  

    if (diffDays == 0) return "Today";
    if (diffDays == 1) return "Tomorrow";
    if (diffDays > 1) return `${diffDays}`;
    return "expiry";
  };
  
  // Hook to get the day name from expiry date
  export const dayName = (expiryArray) => {
    const expiry = expiryArray.join("");
    const getMonthIndex = (monthStr) => {
      const months = ["JAN", "FEB", "MAR", "APR", "MAY", "JUN", "JUL", "AUG", "SEP", "OCT", "NOV", "DEC"];
      return months.indexOf(monthStr.toUpperCase());
    };
  
    if (!expiry) return "";
  
    const expiryDate = new Date(`20${expiry.slice(5, 7)}`, getMonthIndex(expiry.slice(2, 5)), expiry.slice(0, 2));
    return new Intl.DateTimeFormat("en-US", { weekday: "long" }).format(expiryDate);
  };
  