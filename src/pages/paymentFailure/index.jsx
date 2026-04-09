import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import paymentService from "../../services/paymentService";
import "./paymentFailure.scss";

const PaymentFailure = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const txnid = searchParams.get("txnid");
  const errorParam = searchParams.get("error");

  useEffect(() => {
    const verifyPayment = async () => {
      if (!txnid) {
        setPaymentStatus({
          success: false,
          message: errorParam || "Transaction ID not found",
        });
        setLoading(false);
        return;
      }

      try {
        const response = await paymentService.getPaymentStatus(txnid);

        if (response.success && response.data) {
          setPaymentStatus({
            success: false,
            message:
              response.data.errorMessage || errorParam || "Payment failed",
            amount: response.data.amount,
            planType: response.data.planType,
          });
        } else {
          setPaymentStatus({
            success: false,
            message: errorParam || "Payment could not be processed",
          });
        }
      } catch (err) {
        console.error("Payment verification error:", err);
        setPaymentStatus({
          success: false,
          message: errorParam || "Unable to verify payment status",
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [txnid, errorParam]);

  const handleTryAgain = () => navigate("/plans");
  const handleGoToDashboard = () => navigate("/dashboard");

  if (loading) {
    return (
      <div className="payment-failure-page">
        <div className="payment-failure-card payment-failure-card--loading">
          <div className="payment-failure-loading">
            <span className="payment-failure-loading-dot" />
            <span className="payment-failure-loading-dot" />
            <span className="payment-failure-loading-dot" />
            <p>Verifying...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="payment-failure-page">
      <div className="payment-failure-card payment-failure-card--failed">
        <span className="payment-failure-badge">Failed</span>
        <div className="payment-failure-icon">
          <svg width="88" height="88" viewBox="0 0 24 24" fill="none">
            <circle cx="12" cy="12" r="10" fill="#EF4444" />
            <path
              d="M15 9l-6 6M9 9l6 6"
              stroke="white"
              strokeWidth="2"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        </div>
        <h1 className="payment-failure-title">Payment Failed</h1>
        <p className="payment-failure-message">
          {paymentStatus?.message ||
            "Your payment could not be processed. Please try again."}
        </p>
        {(paymentStatus?.amount != null && paymentStatus?.amount > 0) ||
        paymentStatus?.planType ||
        txnid ? (
          <div className="payment-failure-details">
            {paymentStatus?.amount != null && paymentStatus?.amount > 0 && (
              <p>
                <strong>Amount:</strong> ₹
                {paymentStatus.amount.toLocaleString("en-IN")}
              </p>
            )}
            {paymentStatus?.planType && (
              <p>
                <strong>Plan:</strong>{" "}
                {paymentStatus.planType.charAt(0).toUpperCase() +
                  paymentStatus.planType.slice(1)}
              </p>
            )}
            {txnid && (
              <p>
                <strong>Transaction ID:</strong> {txnid}
              </p>
            )}
          </div>
        ) : null}
        <div className="payment-failure-reasons">
          <h3>Common reasons for payment failure</h3>
          <ul>
            <li>Insufficient funds in your account</li>
            <li>Incorrect card details entered</li>
            <li>Card expired or blocked</li>
            <li>Network connectivity issues</li>
            <li>Bank security restrictions</li>
          </ul>
        </div>
        <div className="payment-failure-actions">
          <button
            type="button"
            className="payment-failure-btn payment-failure-btn--primary"
            onClick={handleTryAgain}
          >
            Try Again
          </button>
          <button
            type="button"
            className="payment-failure-btn payment-failure-btn--secondary"
            onClick={handleGoToDashboard}
          >
            Go to Dashboard
          </button>
        </div>
      </div>
    </div>
  );
};

export default PaymentFailure;
