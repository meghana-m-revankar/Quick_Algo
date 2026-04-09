import React from "react";
import { useNavigate } from "react-router-dom";
import { IconRegistry } from "#components";
import dayjs from "dayjs";
import useKycList from "./kycList";
import "./kycList.scss";

const KycList = () => {
  const navigate = useNavigate();
  const {
    list,
    loading,
    downloadingId,
    handleDownloadDocument,
  } = useKycList();

  const getStatusBadgeClass = (item) => {
    const status = (item?.status || "").toLowerCase();
    if (status === "completed") {
      if (item?.isExpired) return "kyc-badge-expired";
      return "kyc-badge-completed";
    }
    if (status === "pending") return "kyc-badge-pending";
    if (status === "failed") return "kyc-badge-failed";
    return "kyc-badge-pending";
  };

  const formatDate = (dateStr) => {
    if (!dateStr) return "—";
    const d = dayjs(dateStr);
    return d.isValid() ? d.format("DD-MM-YYYY") : "—";
  };

  const formatDateTime = (dateStr) => {
    if (!dateStr) return "—";
    const d = dayjs(dateStr);
    return d.isValid() ? d.format("DD-MM-YYYY HH:mm") : "—";
  };

  const downloadFinalSignedContract = (item) => {
    const base64 = item?.final_signed_document;
    if (!base64) return;
    try {
      const binary = atob(base64);
      const bytes = new Uint8Array(binary.length);
      for (let i = 0; i < binary.length; i++) bytes[i] = binary.charCodeAt(i);
      const blob = new Blob([bytes], { type: "application/pdf" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const name = (item?.name || "KYC").replace(/\s+/g, "_").replace(/[^a-zA-Z0-9_-]/g, "");
      const dateStr = item?.updatedAt ? dayjs(item.updatedAt).format("DD-MM-YYYY") : dayjs().format("DD-MM-YYYY");
      a.download = `KYC_Final_Signed_Contract_${name}_${dateStr}.pdf`;
      document.body.appendChild(a);
      a.click();
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    } catch (e) {
      console.error("Download final contract error:", e);
    }
  };

  return (
    <section className="content kyc-list_page">
      <div className="kyc-list-header">
        <h1 className="kyc-list-title">KYC List</h1>
        <div className="kyc-list-actions">
          <button
            type="button"
            className="btn-kyc-register"
            onClick={() => navigate("/kyc")}
          >
            <IconRegistry name="file-text" />
            Register / Complete KYC
          </button>
        </div>
      </div>

      {loading ? (
        <div className="kyc-list-loading">
          <div className="kyc-list-spinner" />
        </div>
      ) : list.length === 0 ? (
        <div className="kyc-list-empty">
          <div className="kyc-empty-icon">
            <IconRegistry name="file-text" />
          </div>
          <h2 className="kyc-empty-title">No KYC found</h2>
          <p className="kyc-empty-desc">
            You have not submitted KYC yet. Complete KYC to access all features.
          </p>
          <button
            type="button"
            className="btn-kyc-register"
            onClick={() => navigate("/kyc")}
          >
            <IconRegistry name="file-text" />
            Complete KYC
          </button>
        </div>
      ) : (
        <div className="kyc-list-cards">
          {list.map((item) => (
            <div key={item?.id || item?.updatedAt} className="kyc-card">
              <div className="kyc-card-header">
                <h2 className="kyc-card-name">{item?.name || "—"}</h2>
                <div className="kyc-card-badges">
                  <span className={`kyc-badge ${getStatusBadgeClass(item)}`}>
                    {item?.status || "pending"}
                  </span>
                  {item?.contract_expiry && (
                    <span className="kyc-badge kyc-badge-expiry-date">
                      Expires: {formatDate(item.contract_expiry)}
                    </span>
                  )}
                </div>
              </div>
              <div className="kyc-card-body">
                <div className="kyc-details-grid">
                  <div className="kyc-detail-item">
                    <label>Email</label>
                    <span>{item?.email || "—"}</span>
                  </div>
                  <div className="kyc-detail-item">
                    <label>Phone</label>
                    <span>{item?.phone_no || "—"}</span>
                  </div>
                  <div className="kyc-detail-item">
                    <label>PAN</label>
                    <span>{item?.pan_no || "—"}</span>
                  </div>
                  <div className="kyc-detail-item">
                    <label>Father Name</label>
                    <span>{item?.father_name || "—"}</span>
                  </div>
                  <div className="kyc-detail-item">
                    <label>DOB</label>
                    <span>{item?.dob ? formatDate(item.dob) : "—"}</span>
                  </div>
                  <div className="kyc-detail-item">
                    <label>Address</label>
                    <span>{item?.address || "—"}</span>
                  </div>
                  <div className="kyc-detail-item">
                    <label>Country</label>
                    <span>{item?.country || "—"}</span>
                  </div>
                  <div className="kyc-detail-item">
                    <label>State</label>
                    <span>{item?.state || "—"}</span>
                  </div>
                  <div className="kyc-detail-item">
                    <label>City</label>
                    <span>{item?.city || "—"}</span>
                  </div>
                  <div className="kyc-detail-item">
                    <label>Last Updated</label>
                    <span>{formatDateTime(item?.updatedAt)}</span>
                  </div>
                </div>
                <div className="kyc-card-actions">
                  <button
                    type="button"
                    className="btn-download"
                    onClick={() => handleDownloadDocument(item)}
                    disabled={downloadingId === (item?.id || "current")}
                  >
                    {downloadingId === (item?.id || "current") ? (
                      "Downloading..."
                    ) : (
                      <>
                        <IconRegistry name="download" />
                        Download KYC Agreement
                      </>
                    )}
                  </button>
                  {item?.final_signed_document ? (
                    <button
                      type="button"
                      className="btn-download btn-download-signed"
                      onClick={() => downloadFinalSignedContract(item)}
                    >
                      <IconRegistry name="download" />
                      Download final signed contract
                    </button>
                  ) : null}
                  {(item?.status || "").toLowerCase() === "pending" &&
                    item?.workflowUrl && (
                      <button
                        type="button"
                        className="btn-complete-kyc"
                        onClick={() => (window.location.href = item.workflowUrl)}
                      >
                        <IconRegistry name="check-circle" />
                        Complete KYC (E-sign)
                      </button>
                    )}
                  {(item?.status || "").toLowerCase() === "pending" &&
                    !item?.workflowUrl && (
                      <button
                        type="button"
                        className="btn-complete-kyc"
                        onClick={() => navigate("/kyc")}
                      >
                        <IconRegistry name="file-text" />
                        Complete KYC
                      </button>
                    )}
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </section>
  );
};

export default KycList;
