// BEFORE
import chartAxios from "./chartAxios";

// AFTER
import axios from "#axios";

class PaymentService {
  async getActiveSubscription(customerId) {
    const id = customerId ? String(customerId):"";
    if (!id || isNaN(id)) return { success: false, data: null };

    try {
      const response = await axios.get("/GetCustomerSubscription", {
        params: { customerId: id }
      });
      return response.data;
    } catch (error) {
      if (error.response?.status === 404) {
        return { success: true, data: null, message: "No active subscription found" };
      }
      throw error;
    }
  }

  async createPayment(paymentData) {
    const response = await axios.post("/api/payment/create", paymentData);
    return response.data;
  }

  async getLastBillingDetails() {
    const response = await axios.get("/api/payment/last-billing-details");
    return response.data;
  }

  async getPaymentStatus(txnid) {
    const response = await axios.get(`/api/payment/status/${txnid}`);
    return response.data;
  }

  async getPaymentHistory(params = {}) {
    const response = await axios.get("/api/payment/history", { params });
    return response.data;
  }

  submitPayUForm(payuUrl, paymentData) {
    const form = document.createElement("form");
    form.method = "POST";
    form.action = payuUrl;
    form.style.display = "none";
    Object.keys(paymentData).forEach((key) => {
      const input = document.createElement("input");
      input.type = "hidden";
      input.name = key;
      input.value = paymentData[key];
      form.appendChild(input);
    });
    document.body.appendChild(form);
    form.submit();
  }
}

export default new PaymentService();