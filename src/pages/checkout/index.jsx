import React, { useEffect, useMemo, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";
import { useSelector } from "react-redux";
import Joi from "joi";
import paymentService from "../../services/paymentService";
import "./checkout.scss";

const countries = ["India"];
const GST_RATE = 0.18;

const parseINR = (value) => {
  if (value === null || value === undefined) return null;
  if (typeof value === "number") return Number.isFinite(value) ? value : null;
  const s = String(value)
    .replace(/[₹,\s]/g, "")
    .trim();
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
};

const formatINR = (n) => {
  const num = typeof n === "number" ? n : Number(n);
  if (!Number.isFinite(num)) return "-";
  return `₹${num.toLocaleString("en-IN", {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
};

const Checkout = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { userDetail } = useSelector((state) => state.userDetails);

  const checkoutState = location?.state || {};
  const {
    subscriptionId,
    planType,
    planName,
    priceLabel,
    priceValue,
    duration,
    isTrial,
  } = checkoutState;

  const [submitting, setSubmitting] = useState(false);
  const [formErrors, setFormErrors] = useState({});
  const [pageError, setPageError] = useState("");

  const [form, setForm] = useState({
    fullName: userDetail?.fullName || "",
    country: "India",
    state: "",
    city: "",
    zip: "",
    addressLine1: "",
    addressLine2: "",
    pan: "",
    gstin: "",
  });

  useEffect(() => {
    // If user refreshes / opens directly, we may lose route state
    if (!planType || !subscriptionId) {
      navigate("/plans");
    }
  }, [navigate, planType, subscriptionId]);

  useEffect(() => {
    const hydrateFromLastPayment = async () => {
      try {
        if (!userDetail) return;
        const resp = await paymentService.getLastBillingDetails();
        if (!resp?.success || !resp?.data?.billingDetails) return;

        const b = resp.data.billingDetails;
        setForm((prev) => ({
          ...prev,
          fullName: b.fullName || prev.fullName,
          country: b.country || prev.country,
          state: b.state || prev.state,
          city: b.city || prev.city,
          zip: b.zip || prev.zip,
          addressLine1: b.addressLine1 || prev.addressLine1,
          addressLine2: b.addressLine2 || prev.addressLine2,
          pan: b.pan || prev.pan,
          gstin: b.gstin || prev.gstin,
        }));
      } catch (e) {
        // If no previous billing details, ignore silently
      }
    };

    hydrateFromLastPayment();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userDetail]);

  const summary = useMemo(() => {
    const planTitle = planName || `${planType || ""}`.toUpperCase();
    const isDayPlan = (planType || "").toLowerCase() === "day";
    const isTrialPlan = Boolean(isTrial) || parseINR(priceValue) === 0;

    const durationLabel =
      typeof duration === "number" && duration >= 0
        ? isDayPlan
          ? `${duration || 1} day${(duration || 1) !== 1 ? "s" : ""}`
          : `${duration} month${duration !== 1 ? "s" : ""}`
        : isDayPlan
          ? "1 day"
          : "";

    const base = isTrialPlan
      ? 0
      : (parseINR(priceValue) ??
        parseINR(priceLabel) ??
        {
          day: 0,
          monthly: 12585,
          quarterly: 37750,
          yearly: 151000,
        }[planType] ??
        null);
    const gst = base !== null ? Math.round(base * GST_RATE * 100) / 100 : null;
    const total = base !== null && gst !== null ? base + gst : null;

    return {
      planTitle,
      durationLabel,
      base,
      gst,
      total,
      isTrialPlan,
      baseLabel: base !== null ? formatINR(base) : "-",
      gstLabel: gst !== null ? formatINR(gst) : "-",
      totalLabel: isTrialPlan
        ? "No charges"
        : total !== null
          ? formatINR(total)
          : priceLabel || "-",
    };
  }, [planName, planType, priceLabel, priceValue, duration, isTrial]);

  const onChange = (key) => (e) => {
    setForm((prev) => ({ ...prev, [key]: e.target.value }));
    setFormErrors((prev) => ({
      ...prev,
      [key]: "",
    }));
    setPageError("");
  };

  const billingSchema = useMemo(
    () =>
      Joi.object({
        fullName: Joi.string().trim().min(2).max(150).required().messages({
          "any.required": "Full name is required.",
          "string.empty": "Full name is required.",
        }),
        country: Joi.string().trim().min(2).max(60).required().messages({
          "any.required": "Country is required.",
          "string.empty": "Country is required.",
        }),
        state: Joi.string().trim().min(1).max(80).required().messages({
          "any.required": "State/Region is required.",
          "string.empty": "State/Region is required.",
        }),
        city: Joi.string().trim().min(1).max(80).required().messages({
          "any.required": "City is required.",
          "string.empty": "City is required.",
        }),
        zip: Joi.string()
          .trim()
          .pattern(/^[0-9]{6}$/)
          .required()
          .messages({
            "any.required": "Zip/Postal code is required.",
            "string.empty": "Zip/Postal code is required.",
            "string.pattern.base": "Zip/Postal code must be 6 digits.",
          }),
        addressLine1: Joi.string().trim().min(3).max(200).required().messages({
          "any.required": "Address line 1 is required.",
          "string.empty": "Address line 1 is required.",
        }),
        addressLine2: Joi.string().trim().max(200).allow("").messages({
          "string.max": "Address line 2 is too long.",
        }),
        pan: Joi.string()
          .trim()
          .uppercase()
          .pattern(/^[A-Z]{5}[0-9]{4}[A-Z]{1}$/)
          .required()
          .messages({
            "any.required": "PAN is required.",
            "string.empty": "PAN is required.",
            "string.pattern.base": "PAN format is invalid (e.g. AAACQ7173R).",
          }),
        gstin: Joi.string()
          .trim()
          .uppercase()
          .allow("")
          .pattern(/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/)
          .messages({
            "string.pattern.base":
              "GSTIN format is invalid (e.g. 23AAACQ7173R1ZV).",
          }),
      }).unknown(false),
    [],
  );

  const validateBilling = () => {
    const { error } = billingSchema.validate(form, { abortEarly: false });
    if (!error) {
      setFormErrors({});
      return { ok: true, errors: {} };
    }

    const nextErrors = {};
    error.details.forEach((d) => {
      const key = d.path?.[0];
      if (!key || nextErrors[key]) return;
      nextErrors[key] = d.message.replace(/"/g, "");
    });

    setFormErrors(nextErrors);
    return { ok: false, errors: nextErrors };
  };

  const handleNext = async () => {
    setPageError("");

    if (!userDetail) {
      navigate("/login");
      return;
    }
    if (!userDetail?.emailid || !userDetail?.mobileNo) {
      setPageError(
        "Please complete your profile (Email/Phone) before checkout.",
      );
      navigate("/profile");
      return;
    }

    const billingValidation = validateBilling();
    if (!billingValidation.ok) {
      const firstKey = Object.keys(billingValidation.errors || {})[0];
      const firstError =
        (firstKey && billingValidation.errors[firstKey]) ||
        "Please check the form and try again.";
      setPageError(firstError);
      if (firstKey) {
        // Focus first invalid input for better UX
        setTimeout(() => {
          const el = document.querySelector(`[name="${firstKey}"]`);
          if (el && typeof el.focus === "function") el.focus();
        }, 0);
      }
      return;
    }

    try {
      setSubmitting(true);

      const firstname = form.fullName.split(" ")[0] || form.fullName;
      const billingDetails = {
        fullName: form.fullName.trim(),
        country: form.country.trim(),
        state: form.state.trim(),
        city: form.city.trim(),
        zip: form.zip.trim(),
        addressLine1: form.addressLine1.trim(),
        addressLine2: form.addressLine2.trim(),
        pan: form.pan.trim().toUpperCase(),
        gstin: form.gstin.trim().toUpperCase(),
      };

      // Same API: createPayment. Backend returns redirectUrl for trial, payuUrl for paid
      const response = await paymentService.createPayment({
        planType,
        subscriptionId,
        firstname,
        email: userDetail.emailid,
        phone: userDetail.mobileNo,
        billingDetails,
      });

      if (response?.success && response?.data) {
        if (response.data.isTrial && response.data.redirectUrl) {
          navigate("/payment-success?trial=1", { replace: true });
          return;
        }
        if (response.data.payuUrl && response.data.paymentData) {
          paymentService.submitPayUForm(
            response.data.payuUrl,
            response.data.paymentData,
          );
          return;
        }
      }

      throw new Error(response?.message || "Failed to create payment");
    } catch (error) {
      console.error("Checkout Error:", error);
      setPageError(
        error?.response?.data?.message ||
          error?.message ||
          "Failed to proceed. Please try again.",
      );
    } finally {
      setSubmitting(false);
    }
  };

  const isKycError =
    pageError &&
    (pageError.toLowerCase().includes("kyc") ||
      pageError.toLowerCase().includes("know your customer"));

  return (
    <section className="content checkout-page">
      <div className="checkout-container">
        <div className="checkout-top">
          <button
            className="checkout-back"
            onClick={() => navigate(-1)}
            disabled={submitting}
          >
            ← Back
          </button>
        </div>

        {pageError ? (
          <div className="checkout-error-wrap">
            <div className="checkout-error">{pageError}</div>
            {isKycError && (
              <button
                type="button"
                className="checkout-kyc-btn"
                onClick={() => navigate("/kyc")}
              >
                Complete KYC
              </button>
            )}
          </div>
        ) : null}

        <div className="checkout-grid">
          <div className="checkout-left">
            <h2 className="checkout-title">Enter your name and address</h2>

            <div className={`field ${formErrors.fullName ? "has-error" : ""}`}>
              <label>Full name*</label>
              <input
                name="fullName"
                value={form.fullName}
                onChange={onChange("fullName")}
                placeholder="First and last name"
              />
              {formErrors.fullName ? (
                <div className="error-text">{formErrors.fullName}</div>
              ) : null}
            </div>

            <div className="field-row">
              <div className={`field ${formErrors.country ? "has-error" : ""}`}>
                <label>Country*</label>
                <select value={form.country} onChange={onChange("country")}>
                  {countries.map((c) => (
                    <option key={c} value={c}>
                      {c}
                    </option>
                  ))}
                </select>
                {formErrors.country ? (
                  <div className="error-text">{formErrors.country}</div>
                ) : null}
              </div>

              <div className={`field ${formErrors.state ? "has-error" : ""}`}>
                <label>State/Region*</label>
                <input
                  name="state"
                  value={form.state}
                  onChange={onChange("state")}
                  placeholder="Select state/region"
                />
                {formErrors.state ? (
                  <div className="error-text">{formErrors.state}</div>
                ) : null}
              </div>
            </div>

            <div className="field-row">
              <div className={`field ${formErrors.city ? "has-error" : ""}`}>
                <label>City*</label>
                <input
                  name="city"
                  value={form.city}
                  onChange={onChange("city")}
                />
                {formErrors.city ? (
                  <div className="error-text">{formErrors.city}</div>
                ) : null}
              </div>
              <div className={`field ${formErrors.zip ? "has-error" : ""}`}>
                <label>Zip/postal code*</label>
                <input name="zip" value={form.zip} onChange={onChange("zip")} />
                {formErrors.zip ? (
                  <div className="error-text">{formErrors.zip}</div>
                ) : null}
              </div>
            </div>

            <div
              className={`field ${formErrors.addressLine1 ? "has-error" : ""}`}
            >
              <label>Address line 1*</label>
              <input
                name="addressLine1"
                value={form.addressLine1}
                onChange={onChange("addressLine1")}
                placeholder="Street address"
              />
              {formErrors.addressLine1 ? (
                <div className="error-text">{formErrors.addressLine1}</div>
              ) : null}
            </div>

            <div className="field">
              <label>Address line 2</label>
              <input
                name="addressLine2"
                value={form.addressLine2}
                onChange={onChange("addressLine2")}
                placeholder="Apt/Suite/Unit, etc"
              />
            </div>

            <div className="field-row">
              <div className={`field ${formErrors.pan ? "has-error" : ""}`}>
                <label>PAN*</label>
                <input
                  name="pan"
                  value={form.pan}
                  onChange={onChange("pan")}
                  placeholder="AAACQ7173R"
                  style={{ textTransform: "uppercase" }}
                />
                {formErrors.pan ? (
                  <div className="error-text">{formErrors.pan}</div>
                ) : null}
              </div>

              <div className={`field ${formErrors.gstin ? "has-error" : ""}`}>
                <label>GSTIN (Optional)</label>
                <input
                  name="gstin"
                  value={form.gstin}
                  onChange={onChange("gstin")}
                  placeholder="23AAACQ7173R1ZV"
                  style={{ textTransform: "uppercase" }}
                />
                {formErrors.gstin ? (
                  <div className="error-text">{formErrors.gstin}</div>
                ) : null}
              </div>
            </div>
          </div>

          <div className="checkout-right">
            <div className="summary-card">
              <div className="summary-row">
                <div className="summary-label">Plan</div>
                <div className="summary-value">
                  {summary.planTitle}
                  {summary.durationLabel ? (
                    <span className="summary-sub">
                      ({summary.durationLabel})
                    </span>
                  ) : null}
                </div>
              </div>

              <div className="divider" />

              <div className="summary-row">
                <div className="summary-label">Subtotal</div>
                <div className="summary-value">{summary.baseLabel}</div>
              </div>
              <div className="summary-row">
                <div className="summary-label">GST (18%)</div>
                <div className="summary-value">{summary.gstLabel}</div>
              </div>

              <div className="divider" />

              <div className="summary-row total">
                <div className="summary-label">Total</div>
                <div className="summary-total">{summary.totalLabel}</div>
              </div>

              <button
                className="next-btn"
                onClick={handleNext}
                disabled={submitting}
              >
                {submitting ? "Please wait..." : "Next"}
              </button>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
};

export default Checkout;
