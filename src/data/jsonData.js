export const successMsgStyle = {
    id: "",
    position: "top-right",
    loading: true,
    // duration: 50000,
    style: {
      padding: "9px",
      background:
        "linear-gradient(321deg, rgb(73 223 13 / 86%) 34%, rgb(6, 217, 14) 68%, rgb(76, 217, 6) 82%)",
      color: "#fff",
   
      fontSize: "14px",
      fontWeight: "600",
      // width: "20%",
      // maxWidth: "400px",     // Set a max width
      wordWrap: "break-word", // Ensures long words wrap
      whiteSpace: "normal",   
    },
    iconTheme: {
      primary: "#FFF",
      secondary: "#4a8d00",
    },
  };
  
  export const errorMsgStyle = {
    id: "",
    position: "top-right",
    loading: true,
    style: {
      padding: "9px",
      background:
        "linear-gradient(321deg, rgb(255 0 0 / 86%) 34%, rgb(255 0 0) 68%, rgb(255 0 0) 82%)",
      color: "#fff",
  
      fontSize: "14px",
      fontWeight: "600",
      // width: "20%",
      wordWrap: "break-word", // Ensures long words wrap
      whiteSpace: "normal",  
    },
    iconTheme: {
      primary: "#FFF",
      secondary: "#ff0101",
    },
  };
  
  export const warningMsgStyle = {
    id: "",
    position: "top-right",
    loading: true,
    style: {
      padding: "9px",
      background:
        "linear-gradient(321deg, rgb(255 141 0 / 86%) 34%, rgb(255 153 0) 68%, rgb(255 165 0) 82%)",
      color: "#fff",
  
      fontSize: "14px",
      fontWeight: "600",
      // width: "20%",
      wordWrap: "break-word", // Ensures long words wrap
      whiteSpace: "normal",  
    },
    iconTheme: {
      primary: "#FFF",
      secondary: "#ff8201",
    },
  };

export  const brokerSetup = {
    1: {
      
      login: "https://kite.zerodha.com/",
      api_key: true,
      secret_key: true,
      request_token: true,
      redirect_text:
        "When creating the app, Copy and paste this url as your Redirect URL:",
      redirect_url: `${process.env.REACT_APP_PRODUCTION_FRONT_URL}BrokerResponse`,
      redirect: true,
      developer: true,
      test: true,
      customer_support: "https://support.zerodha.com/",
      customer_care: "Customer care at 080 4719 2020",
      api_charges: "2000/- Each month",
      note: "Note :- Broker Login timing is 08:30 AM to 3:00 PM For Mis trading",
      other_note:
        "Regarding any profit or loss displayed on the software, you will not incur any additional charges, positive or negative, such as exchange fees, broker fees, stamp duty, or any other fees. If your broker shuts down your application programming interface at any time, we will not be responsible for that.",
    },
    2: {
      login: "https://www.angelone.in/login/",
      api_key: true,
      secret_key: true,
      demat_code: true,
      demat_mpin: true,
      totp: true,
      developer: true,
      customer_care: "Support number is 1800 1020",
      api_charges: "Free",
      note: "Note :- Broker Login timing is 08:30 AM to 3:00 PM For Mis trading",
      other_note:
        "Regarding any profit or loss displayed on the software, you will not incur any additional charges, positive or negative, such as exchange fees, broker fees, stamp duty, or any other fees. If your broker shuts down your application programming interface at any time, we will not be responsible for that.",
    },
    3: {
      login: "https://ant.aliceblueonline.com/",
      api_key: true,
      demat_code: true,
      customer_support: "https://aliceblueonline.com/contact-us/",
      customer_care: "Support Contact - 07676444362",
      api_charges: "Free",
      note: "Note :- Broker Login timing is 08:30 AM to 3:00 PM For Mis trading",
      other_note:
        "Regarding any profit or loss displayed on the software, you will not incur any additional charges, positive or negative, such as exchange fees, broker fees, stamp duty, or any other fees. If your broker shuts down your application programming interface at any time, we will not be responsible for that.",
    },
    5: {
      
      login: "https://ant.aliceblueonline.com/",
      api_key: true,
      note: "Note :- Broker Login timing is NO need to login",
      other_note:
        "You are provided a demo account with the company's traffic, on which there is no real money, and any profit or loss you see from the order book trades in this account is only for demonstration purposes. Whatever trades occur on this account will have no impact on your real account.",
    },
    6: {
      login: "https://finx.choiceindia.com/auth/login",
      api_key: true,
      demat_code: true,
      demat_mpin: true,
      api_token: true,
      secret_key: true,
      request_token: true,
      totp: true,
      customer_support: "https://choiceindia.com/contact-us",
      customer_care: "Support number is 022-68079999",
      api_charges: "Free",
      note: "Note :- Broker Login timing is 08:30 AM to 3:00 PM For Mis trading",
      other_note:
        "Regarding any profit or loss displayed on the software, you will not incur any additional charges, positive or negative, such as exchange fees, broker fees, stamp duty, or any other fees. If your broker shuts down your application programming interface at any time, we will not be responsible for that.",
    },
    7: {
     
      login: "https://login.5paisa.com/",
      api_key: true,
      app_source: true,
      api_token: true,
      secret_key: true,
      request_token: true,
      redirect_text:
        "When creating the app, Copy and paste this url as your Redirect URL:",
      redirect_url: `${process.env.REACT_APP_PRODUCTION_FRONT_URL}BrokerResponse`,
      redirect: true,
      developer: true,
      test: true,
      customer_support: "https://www.5paisa.com/contact-us",
      customer_care: "Customer Care Number: +91 89766 89766",
      api_charges: "Free",
      note: "Note :- Broker Login timing is 08:30 AM to 3:00 PM For Mis trading",
      other_note:
        "Regarding any profit or loss displayed on the software, you will not incur any additional charges, positive or negative, such as exchange fees, broker fees, stamp duty, or any other fees. If your broker shuts down your application programming interface at any time, we will not be responsible for that.",
    },
    8: {
      
      login: "https://login.fyers.in/",
      api_key: true,
      demat_code: true,
      api_token: true,
      request_token: true,
      redirect_text:
        "When creating the app, Copy and paste this url as your Redirect URL:",
      redirect_url: `${process.env.REACT_APP_PRODUCTION_FRONT_URL}BrokerResponse`,
      redirect: true,
      developer: true,
      test: true,
      customer_support: "https://fyers.in/contact-us/",
      customer_care: "Customer Care Number: 080-60001111",
      api_charges: "Free",
      note: "Note :- Broker Login timing is 08:30 AM to 3:00 PM For Mis trading",
      other_note:
        "Regarding any profit or loss displayed on the software, you will not incur any additional charges, positive or negative, such as exchange fees, broker fees, stamp duty, or any other fees. If your broker shuts down your application programming interface at any time, we will not be responsible for that.",
    },
    9: {
      
      login: "https://login.upstox.com/",
      api_key: true,
      demat_code: true,
      secret_key: true,
      redirect_text:
        "When creating the app, Copy and paste this url as your Redirect URL:",
      redirect_url: `${process.env.REACT_APP_PRODUCTION_FRONT_URL}BrokerResponse`,
      redirect: true,
      test: true,
      customer_support: "https://help.upstox.com/support/home",
      customer_care: "Upstox customer care at 022-41792999",
      api_charges: "Free",
      note: "Note :- Broker Login timing is 08:30 AM to 3:00 PM For Mis trading",
      other_note:
        "Regarding any profit or loss displayed on the software, you will not incur any additional charges, positive or negative, such as exchange fees, broker fees, stamp duty, or any other fees. If your broker shuts down your application programming interface at any time, we will not be responsible for that.",
    },
    10: {
    
      login: "https://www.kotaksecurities.com/dtloginservice/login",
      api_key: true,
      demat_code: true,
      demat_mpin: true,
      c_mobile: true,
      c_password: true,
      c_nofi: true,
      otp: true,
      secret_key: true,
      developer: true,
      customer_support: "https://www.kotaksecurities.com/support/",
      customer_care: "Customer care at 18002099191",
      api_charges: "Free",
      note: "Note :- Broker Login timing is 08:30 AM to 3:00 PM For Mis trading",
      other_note:
        "Regarding any profit or loss displayed on the software, you will not incur any additional charges, positive or negative, such as exchange fees, broker fees, stamp duty, or any other fees. If your broker shuts down your application programming interface at any time, we will not be responsible for that.",
    },
    11: {
      
      login: "https://login.dhan.co/",
      api_key: true,
      demat_code: true,
      secret_key: true,
      request_token: true,
      redirect_text:
        "When creating the app, Copy and paste this url as your Redirect URL:",
      redirect_url: `${process.env.REACT_APP_PRODUCTION_FRONT_URL}BrokerResponse`,
      redirect: true,
      test: true,
      customer_support: "https://dhan.co/contact/",
      customer_care: "Dhan customer care at (+91) 9987761000",
      api_charges: "Free",
      note: "Note :- Broker Login timing is 08:30 AM to 3:00 PM For Mis trading",
      other_note:
        "Regarding any profit or loss displayed on the software, you will not incur any additional charges, positive or negative, such as exchange fees, broker fees, stamp duty, or any other fees. If your broker shuts down your application programming interface at any time, we will not be responsible for that.",
    },
    12: {
  
      login: "https://exchange.goodwill.org/",
      api_key: true,
      demat_code: true,
      secret_key: true,
      request_token: true,
      test: true,
      customer_support: "https://gwcindia.in/contact-us/",
      customer_care: "Customer care at 044 40205050",
      api_charges: "Free",
      note: "Note :- Broker Login timing is 08:30 AM to 3:00 PM For Mis trading",
      other_note:
        "Regarding any profit or loss displayed on the software, you will not incur any additional charges, positive or negative, such as exchange fees, broker fees, stamp duty, or any other fees. If your broker shuts down your application programming interface at any time, we will not be responsible for that.",
    },
  };