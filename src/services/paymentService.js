import chartAxios from "./chartAxios";
import Storage from "./storage";

class PaymentService {
  async createPayment(paymentData) {
    try {
      const response = await chartAxios.post("/api/payment/create", paymentData);
      return response.data;
    } catch (error) {
      console.error("Create Payment Error:", error);
      throw error;
    }
  }


  async getLastBillingDetails() {
    try {
      const response = await chartAxios.get("/api/payment/last-billing-details");
      return response.data;
    } catch (error) {
      console.error("Get Last Billing Details Error:", error);
      throw error;
    }
  }

  async getPaymentStatus(txnid) {
    try {
      const response = await chartAxios.get(`/api/payment/status/${txnid}`);
      return response.data;
    } catch (error) {
      console.error("Get Payment Status Error:", error);
      throw error;
    }
  }

 
  async getPaymentHistory(params = {}) {
    try {
      const response = await chartAxios.get("/api/payment/history", { params });
      return response.data;
    } catch (error) {
      console.error("Get Payment History Error:", error);
      throw error;
    }
  }

  /**
   * Get active subscription for current customer
   */
  async getActiveSubscription() {
    try {
      const response = await chartAxios.get("/api/payment/active-subscription");
      return response.data;
    } catch (error) {
      console.error("Get Active Subscription Error:", error);
      console.error("Error Details:", {
        message: error.message,
        status: error.response?.status,
        data: error.response?.data,
        url: error.config?.url
      });
      // Return null data instead of throwing if 404 or no subscription
      if (error.response?.status === 404 || error.response?.status === 200) {
        return {
          success: true,
          data: null,
          message: "No active subscription found"
        };
      }
      throw error;
    }
  }

  submitPayUForm(payuUrl, paymentData) {
    // Create a form element
    const form = document.createElement("form");
    form.method = "POST";
    form.action = payuUrl;
    form.style.display = "none";

    // Add all payment data as hidden inputs
    Object.keys(paymentData).forEach((key) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = paymentData[key];
      form.appendChild(input);
    });

    // Append form to body and submit
    document.body.appendChild(form);
    form.submit();
  }
}

export default new PaymentService();


