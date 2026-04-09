import React, { useEffect, useMemo, useState } from "react";
import { Modal } from "react-bootstrap";
import { useSelector } from "react-redux";
import paymentService from "../../services/paymentService";
import "./paymentHistory.scss";
import {
  buildInvoiceNumber,
  downloadInvoicePdf,
  extractInvoiceFeatures,
  formatDate,
  formatDateTime,
  safeText,
} from "#utils/invoicePdf";

const DEFAULT_LIMIT = 10;

const formatAmountINR = (value) => {
  if (value === null || value === undefined) return "-";
  const n = typeof value === "number" ? value : Number(value);
  if (Number.isNaN(n)) return "-";
  return `₹${n.toLocaleString("en-IN")}`;
};

const getStatusClass = (status) => {
  const s = (status || "").toLowerCase();
  if (s === "success") return "success";
  if (s === "failed") return "failed";
  if (s === "cancelled") return "cancelled";
  return "pending";
};

const PaymentHistory = () => {
  const companyDetails = useSelector(
    (state) => state?.companyDetails?.companyDetails,
  );

  const [payments, setPayments] = useState([]);
  const [meta, setMeta] = useState({
    page: 1,
    limit: DEFAULT_LIMIT,
    total: 0,
    totalPages: 1,
  });
  const [page, setPage] = useState(1);
  const [limit, setLimit] = useState(DEFAULT_LIMIT);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [invoiceOpen, setInvoiceOpen] = useState(false);
  const [selectedPayment, setSelectedPayment] = useState(null);

  const fetchHistory = async (nextPage = page, nextLimit = limit) => {
    try {
      setLoading(true);
      setError("");
      const response = await paymentService.getPaymentHistory({
        page: nextPage,
        limit: nextLimit,
      });

      if (!response?.success) {
        throw new Error(response?.message || "Failed to load payment history");
      }

      setPayments(Array.isArray(response.data) ? response.data : []);
      setMeta(
        response.meta || {
          page: nextPage,
          limit: nextLimit,
          total: 0,
          totalPages: 1,
        },
      );
    } catch (e) {
      const msg =
        e?.response?.data?.message ||
        e?.message ||
        "Unable to load payment history";
      setError(msg);
      setPayments([]);
      setMeta((prev) => ({ ...prev, total: 0, totalPages: 1 }));
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchHistory(page, limit);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [page, limit]);

  const filteredPayments = useMemo(() => {
    const q = search.trim().toLowerCase();
    return (payments || []).filter((p) => {
      const status = (p?.status || "").toLowerCase();
      if (statusFilter !== "all" && status !== statusFilter) return false;
      if (!q) return true;

      const haystack = [
        p?.txnid,
        p?.planType,
        p?.productinfo,
        p?.status,
        p?.paymentId,
        p?.bankRefNum,
      ]
        .filter(Boolean)
        .join(" ")
        .toLowerCase();

      return haystack.includes(q);
    });
  }, [payments, search, statusFilter]);

  const canPrev = (meta?.page || page) > 1;
  const canNext = (meta?.page || page) < (meta?.totalPages || 1);

  return (
    <section className="content payment-history-page">
      <div className="payment-history-container">
        <div className="payment-history-header">
          <div className="header-left">
            <h1 className="page-title">Payment Transactions</h1>
            <p className="page-subtitle">Your payment history (latest first)</p>
          </div>
          <div className="header-right">
            <button
              type="button"
              className="btn-outline"
              onClick={() => fetchHistory(page, limit)}
              disabled={loading}
            >
              Refresh
            </button>
          </div>
        </div>

        <div className="payment-history-controls">
          <div className="control">
            <label>Search</label>
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Txnid / plan / status / reference..."
            />
          </div>

          <div className="control">
            <label>Status</label>
            <select
              value={statusFilter}
              onChange={(e) => setStatusFilter(e.target.value)}
            >
              <option value="all">All</option>
              <option value="success">Success</option>
              <option value="pending">Pending</option>
              <option value="failed">Failed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </div>

          <div className="control">
            <label>Rows</label>
            <select
              value={limit}
              onChange={(e) => {
                setPage(1);
                setLimit(Number(e.target.value));
              }}
            >
              <option value={10}>10</option>
              <option value={25}>25</option>
              <option value={50}>50</option>
            </select>
          </div>
        </div>

        {error ? <div className="alert-error">{error}</div> : null}

        <div className="payment-history-table-wrap">
          <table className="payment-history-table">
            <thead>
              <tr>
                <th>Date</th>
                <th>Transaction ID</th>
                <th>Plan</th>
                <th>Amount</th>
                <th>Status</th>
                <th>Paid At</th>
                <th>Expiry</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan={8} className="table-state">
                    Loading...
                  </td>
                </tr>
              ) : filteredPayments.length === 0 ? (
                <tr>
                  <td colSpan={8} className="table-state">
                    No payment transactions found.
                  </td>
                </tr>
              ) : (
                filteredPayments.map((p) => (
                  <tr key={p?._id || p?.txnid}>
                    <td>{formatDateTime(p?.createdAt)}</td>
                    <td className="mono">{p?.txnid || "-"}</td>
                    <td className="cap">
                      {p?.planType
                        ? p.planType.charAt(0).toUpperCase() +
                          p.planType.slice(1)
                        : "-"}
                    </td>
                    <td>{formatAmountINR(p?.amount)}</td>
                    <td>
                      <span
                        className={`status-badge ${getStatusClass(p?.status)}`}
                      >
                        {p?.status || "pending"}
                      </span>
                    </td>
                    <td>{formatDateTime(p?.paidAt)}</td>
                    <td>{formatDateTime(p?.subscriptionExpiryDate)}</td>
                    <td className="actions-cell">
                      <button
                        type="button"
                        className="btn-outline btn-sm"
                        onClick={() => {
                          setSelectedPayment(p);
                          setInvoiceOpen(true);
                        }}
                      >
                        View
                      </button>
                      <button
                        type="button"
                        className="btn-primary btn-sm"
                        onClick={async () => {
                          try {
                            await downloadInvoicePdf({
                              payment: p,
                              companyDetails,
                            });
                          } catch (e) {
                            // eslint-disable-next-line no-console
                            console.error("Invoice download failed:", e);
                            setError(
                              e?.message ||
                                "Invoice download failed. Please try again.",
                            );
                          }
                        }}
                      >
                        Download
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        <div className="payment-history-footer">
          <div className="meta">
            <span>
              Page <b>{meta?.page || page}</b> of <b>{meta?.totalPages || 1}</b>
            </span>
            <span className="meta-sep">•</span>
            <span>
              Total <b>{meta?.total || 0}</b>
            </span>
          </div>

          <div className="pager">
            <button
              type="button"
              className="btn-outline"
              onClick={() => setPage((p) => Math.max(1, p - 1))}
              disabled={loading || !canPrev}
            >
              Prev
            </button>
            <button
              type="button"
              className="btn-outline"
              onClick={() => setPage((p) => p + 1)}
              disabled={loading || !canNext}
            >
              Next
            </button>
          </div>
        </div>
      </div>

      <Modal
        show={invoiceOpen}
        onHide={() => setInvoiceOpen(false)}
        centered
        size="lg"
      >
        <Modal.Header closeButton>
          <Modal.Title>Invoice</Modal.Title>
        </Modal.Header>
        <Modal.Body>
          {!selectedPayment ? (
            <div>Invoice not available.</div>
          ) : (
            <div className="invoice-preview">
              {companyDetails?.companyLogo ? (
                <div className="invoice-logo-row">
                  <img src={companyDetails.companyLogo} alt="company-logo" />
                </div>
              ) : null}
              <div className="invoice-top">
                <div className="invoice-company">
                  <div className="company-name">
                    {companyDetails?.companyName || "Company"}
                  </div>
                  <div className="company-meta">
                    {companyDetails?.addressStreet ? (
                      <div>{companyDetails.addressStreet}</div>
                    ) : null}
                    <div className="meta-row">
                      {companyDetails?.gstn ? (
                        <span>GSTIN: {companyDetails.gstn}</span>
                      ) : null}
                      {companyDetails?.cin ? (
                        <span>CIN: {companyDetails.cin}</span>
                      ) : null}
                    </div>
                  </div>
                </div>

                <div className="invoice-title">
                  <div className="title">Tax Invoice</div>
                  <div className="inv-no">
                    Invoice No: {buildInvoiceNumber(selectedPayment)}
                  </div>
                  <div className="inv-date">
                    Invoice Date:{" "}
                    {formatDate(
                      selectedPayment?.paidAt || selectedPayment?.createdAt,
                    )}
                  </div>
                </div>
              </div>

              <div className="invoice-sections">
                <div className="invoice-block">
                  <div className="block-title">Billed To</div>
                  <div className="block-body">
                    <div>{safeText(selectedPayment?.firstname)}</div>
                    <div>{safeText(selectedPayment?.email)}</div>
                    <div>Phone: {safeText(selectedPayment?.phone)}</div>
                  </div>
                </div>

                <div className="invoice-block">
                  <div className="block-title">Payment</div>
                  <div className="block-body">
                    <div>Txn ID: {safeText(selectedPayment?.txnid)}</div>
                    <div>Status: {safeText(selectedPayment?.status)}</div>
                    <div>
                      Paid At: {formatDateTime(selectedPayment?.paidAt)}
                    </div>
                    {selectedPayment?.bankRefNum ? (
                      <div>Bank Ref: {selectedPayment.bankRefNum}</div>
                    ) : null}
                  </div>
                </div>
              </div>

              <div className="invoice-items">
                <div className="items-head">
                  <div>Description</div>
                  <div>Plan</div>
                  <div className="right">Amount</div>
                </div>
                <div className="items-row">
                  <div className="desc">
                    {selectedPayment?.productinfo ||
                      (selectedPayment?.planType
                        ? `${
                            selectedPayment.planType.charAt(0).toUpperCase() +
                            selectedPayment.planType.slice(1)
                          } Plan`
                        : "Subscription")}
                  </div>
                  <div className="cap">
                    {safeText(selectedPayment?.planType)}
                  </div>
                  <div className="right">
                    {safeText(selectedPayment?.currency || "INR")}{" "}
                    {Number(selectedPayment?.amount || 0).toLocaleString(
                      "en-IN",
                    )}
                  </div>
                </div>
                <div className="items-total">
                  <div className="label">Total</div>
                  <div className="value">
                    {safeText(selectedPayment?.currency || "INR")}{" "}
                    {Number(selectedPayment?.amount || 0).toLocaleString(
                      "en-IN",
                    )}
                  </div>
                </div>
              </div>

              {extractInvoiceFeatures(selectedPayment).length > 0 ? (
                <div className="invoice-features">
                  <div className="features-title">Plan Features</div>
                  <div className="features-grid">
                    {extractInvoiceFeatures(selectedPayment).map((f, idx) => (
                      <div className="feature-row" key={`${f.feature}-${idx}`}>
                        <div className="feature-name">
                          {safeText(f.feature)}
                        </div>
                        <div className="feature-value">{safeText(f.value)}</div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : null}

              <div className="invoice-note">
                This is a system generated invoice. No signature required.
              </div>
            </div>
          )}
        </Modal.Body>
        <Modal.Footer>
          <button
            type="button"
            className="btn-outline"
            onClick={() => setInvoiceOpen(false)}
          >
            Close
          </button>
          <button
            type="button"
            className="btn-primary"
            disabled={!selectedPayment}
            onClick={async () => {
              if (!selectedPayment) return;
              try {
                await downloadInvoicePdf({
                  payment: selectedPayment,
                  companyDetails,
                });
              } catch (e) {
                // eslint-disable-next-line no-console
                console.error("Invoice download failed:", e);
                setError(
                  e?.message || "Invoice download failed. Please try again.",
                );
              }
            }}
          >
            Download PDF
          </button>
        </Modal.Footer>
      </Modal>
    </section>
  );
};

export default PaymentHistory;
