import CryptoJS from "crypto-js";

export default class Storage {
  static saveSessionCustomerID(customerID) {
    localStorage.setItem("customerID", this.encryptData(customerID));
  }

  static encryptData(value) {
    return CryptoJS.AES.encrypt(
      JSON.stringify(value),
      process.env.REACT_APP_SECRET_KEY
    ).toString();
  }

  static encryptFormatData(value) {
    const encrypted = CryptoJS.AES.encrypt(
      JSON.stringify(value),
      process.env.REACT_APP_SECRET_KEY
    ).toString();

    // Convert Base64 to a URL-safe format
    return encrypted.replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
  }

  static decryptData(value) {
    try {
      const bytes = CryptoJS.AES.decrypt(
        value,
        process.env.REACT_APP_SECRET_KEY
      );
      return JSON.parse(bytes.toString(CryptoJS.enc.Utf8));
    } catch (error) {
      return null;
    }
  }

  static decryptFormatData(value) {
    try {
      let base64 = value.replace(/-/g, "+").replace(/_/g, "/");

      // Add padding if needed
      while (base64.length % 4 !== 0) {
        base64 += "=";
      }

      const bytes = CryptoJS.AES.decrypt(
        base64,
        process.env.REACT_APP_SECRET_KEY
      );

      return JSON?.parse(bytes?.toString(CryptoJS.enc.Utf8));
    } catch {
      return null;
    }
  }

  static removeData() {
    localStorage.removeItem("customerID");
    localStorage.removeItem("UserName");
    localStorage.removeItem("tokenID");
    localStorage.removeItem("persist:root");
    localStorage.removeItem("riskHomeModal");
    localStorage.removeItem("brokerConfigId");
  }

  // Broker-specific localStorage methods
  static saveBrokerSetupData(brokerId) {
    const encryptedBrokerId = this.encryptData(brokerId);
    localStorage.setItem("brokerConfigId", encryptedBrokerId);
  }

  static getBrokerSetupData() {
    const encryptedData = localStorage.getItem("brokerConfigId");
    if (encryptedData) {
      return this.decryptData(encryptedData);
    }
    return null;
  }

  static clearBrokerSetupData() {
    localStorage.removeItem("brokerConfigId");
  }

  static hasBrokerSetupData() {
    return localStorage.getItem("brokerConfigId") !== null;
  }

  // Form data storage methods
  static saveBrokerFormData(formData) {
    const encryptedFormData = this.encryptData(formData);
    localStorage.setItem("brokerFormData", encryptedFormData);
  }

  static getBrokerFormData() {
    const encryptedData = localStorage.getItem("brokerFormData");
    if (encryptedData) {
      return this.decryptData(encryptedData);
    }
    return null;
  }

  static clearBrokerFormData() {
    localStorage.removeItem("brokerFormData");
  }

  static hasBrokerFormData() {
    return localStorage.getItem("brokerFormData") !== null;
  }
}
