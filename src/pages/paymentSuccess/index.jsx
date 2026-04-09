import React, { useEffect, useState } from "react";
import { useSearchParams, useNavigate } from "react-router-dom";
import paymentService from "../../services/paymentService";
import "./paymentSuccess.scss";

const PaymentSuccess = () => {
  const [searchParams] = useSearchParams();
  const navigate = useNavigate();
  const [paymentStatus, setPaymentStatus] = useState(null);
  const [loading, setLoading] = useState(true);

  const txnid = searchParams.get("txnid");
  const status = searchParams.get("status");
  const isTrial = searchParams.get("trial") === "1";

  useEffect(() => {
    const verifyPayment = async () => {
      // Trial: redirected from checkout after assign-trial success (no txnid)
      if (isTrial) {
        setPaymentStatus({
          success: true,
          isTrial: true,
          message:
            "Trial activated successfully! Your subscription is now active.",
          planType: "trial",
          amount: 0,
        });
        setLoading(false);
        return;
      }

      if (!txnid) {
        setPaymentStatus({
          success: false,
          message: "Transaction ID not found",
        });
        setLoading(false);
        return;
      }

      try {
        const response = await paymentService.getPaymentStatus(txnid);

        if (response.success && response.data) {
          setPaymentStatus({
            success: response.data.status === "success",
            message:
              response.data.status === "success"
                ? "Payment successful! Your subscription has been activated."
                : response.data.errorMessage || "Payment verification failed",
            amount: response.data.amount,
            planType: response.data.planType,
          });
        } else {
          setPaymentStatus({
            success: false,
            message: "Unable to verify payment status",
          });
        }
      } catch (error) {
        console.error("Payment verification error:", error);
        setPaymentStatus({
          success: status === "success",
          message:
            status === "success"
              ? "Payment appears successful. Please check your subscription status."
              : "Unable to verify payment status",
        });
      } finally {
        setLoading(false);
      }
    };

    verifyPayment();
  }, [txnid, status, isTrial]);

  const handleGoToDashboard = () => navigate("/dashboard");
  const handleGoToPlans = () => navigate("/plans");

  if (loading) {
    return (
      <div className="payment-success-page">
        <div className="payment-card payment-card--loading">
          <div className="payment-loading">
            <span className="payment-loading-dot" />
            <span className="payment-loading-dot" />
            <span className="payment-loading-dot" />
            <p>Verifying...</p>
          </div>
        </div>
      </div>
    );
  }

  const isSuccess = paymentStatus?.success;

  return (
    <div className="payment-success-page">
      <div
        className={`payment-card ${isSuccess ? "payment-card--success" : "payment-card--failed"}`}
      >
        {isSuccess ? (
          <>
            <span className="payment-card-badge">
              {paymentStatus?.isTrial ? "Trial Activated" : "Success"}
            </span>
            <div className="payment-icon payment-icon--success">
              <svg width="88" height="88" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="url(#paySuccessGrad)" />
                <defs>
                  <linearGradient
                    id="paySuccessGrad"
                    x1="2"
                    y1="2"
                    x2="22"
                    y2="22"
                  >
                    <stop stopColor="#10B981" />
                    <stop offset="1" stopColor="#059669" />
                  </linearGradient>
                </defs>
                <path
                  d="M8 12l2 2 4-4"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />
              </svg>
            </div>
            <h1 className="payment-title">
              {paymentStatus?.isTrial
                ? "Trial Activated!"
                : "Payment Successful!"}
            </h1>
            <p className="payment-message">{paymentStatus?.message}</p>
            <div className="payment-details">
              {!paymentStatus?.isTrial &&
                paymentStatus?.amount != null &&
                paymentStatus?.amount > 0 && (
                  <p>
                    <strong>Amount Paid:</strong> ₹
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
              {paymentStatus?.isTrial && (
                <p className="payment-trial-note">
                  No payment was required. Your trial period has started.
                </p>
              )}
            </div>
            <div className="payment-actions">
              <button
                type="button"
                className="payment-btn payment-btn--primary"
                onClick={handleGoToDashboard}
              >
                Go to Dashboard
              </button>
              <button
                type="button"
                className="payment-btn payment-btn--secondary"
                onClick={handleGoToPlans}
              >
                View Plans
              </button>
            </div>
          </>
        ) : (
          <>
            <span className="payment-card-badge payment-card-badge--error">
              Failed
            </span>
            <div className="payment-icon payment-icon--error">
              <svg width="88" height="88" viewBox="0 0 24 24" fill="none">
                <circle cx="12" cy="12" r="10" fill="#EF4444" />
                <path
                  d="M12 8v4M12 16h.01"
                  stroke="white"
                  strokeWidth="2"
                  strokeLinecap="round"
                />
              </svg>
            </div>
            <h1 className="payment-title">Payment Failed</h1>
            <p className="payment-message">
              {paymentStatus?.message || "Payment could not be processed"}
            </p>
            {txnid && (
              <div className="payment-details">
                <p>
                  <strong>Transaction ID:</strong> {txnid}
                </p>
              </div>
            )}
            <div className="payment-actions">
              <button
                type="button"
                className="payment-btn payment-btn--primary"
                onClick={handleGoToPlans}
              >
                Try Again
              </button>
              <button
                type="button"
                className="payment-btn payment-btn--secondary"
                onClick={handleGoToDashboard}
              >
                Go to Dashboard
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  );
};

export default PaymentSuccess;
