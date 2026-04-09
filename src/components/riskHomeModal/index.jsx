import React, { useEffect, useState } from "react";
import Button from "react-bootstrap/Button";
import Modal from "react-bootstrap/Modal";
import { NavLink } from "react-router-dom";
import { IconRegistry } from "#components";
import "./riskModa.scss";

const RiskHomeModal = () => {
  const [show, setShow] = useState(false);
  const [isChecked, setIsChecked] = useState(false);

  const handleCloseModal = () => {
    if (isChecked) {
      setShow(false);
      localStorage.setItem("riskHomeModal", true);
    }
  };

  const handleCheckboxChange = (e) => {
    setIsChecked(e.target.checked);
  };

  useEffect(() => {
    if (localStorage.getItem("riskHomeModal") == "true") {
      setShow(false);
    } else {
      setShow(true);
    }
  }, []);

  return (
    <Modal
      show={show}
      className="home_terms_modal"
      aria-labelledby="example-custom-modal-styling-title"
      backdrop="static"
      keyboard={false}
      centered
    >
      <Modal.Header className="risk-modal-header">
        <Modal.Title id="example-custom-modal-styling-title" className="risk-modal-title">
          <IconRegistry name="file-text" size={20} className="risk-modal-icon" />
          <span>Risk disclosures on derivatives</span>
        </Modal.Title>
      </Modal.Header>
      <Modal.Body className="risk-modal-body">
        <div className="risk-disclosure-list">
          <div className="risk-disclosure-item">
            <span className="risk-bullet"></span>
            <p>9 out of 10 individual traders in equity Futures and Options Segment, incurred net losses.</p>
          </div>
          <div className="risk-disclosure-item">
            <span className="risk-bullet"></span>
            <p>On an average, loss makers registered net trading loss close to ₹50,000.</p>
          </div>
          <div className="risk-disclosure-item">
            <span className="risk-bullet"></span>
            <p>Over and above the net trading losses incurred, loss makers expended an additional 28% of net trading losses as transaction costs.</p>
          </div>
          <div className="risk-disclosure-item">
            <span className="risk-bullet"></span>
            <p>Those making net trading profits, incurred between 15% to 50% of such profits as transaction cost.</p>
          </div>
        </div>
        
        <div className="risk-source-section">
          <p className="risk-source-label">Source:</p>
          <p className="risk-source-text">
            <NavLink
              to="https://www.sebi.gov.in/legal/circulars/may-2023/risk-disclosure-with-respect-to-trading-by-individual-traders-in-equity-futures-and-options-segment_71426.html"
              target="_blank"
              className="risk-sebi-link"
            >
              SEBI
            </NavLink>
            {" "}study dated January 25, 2023 on "Analysis of Profit and Loss of Individual Traders dealing in equity Futures and Options (F&O) Segment", wherein Aggregate Level findings are based on annual Profit/Loss incurred by individual traders in equity F&O during FY 2021-22.
          </p>
        </div>
      </Modal.Body>
      <Modal.Footer className="risk-modal-footer">
        <div className="risk-footer-content">
          <label className="risk-checkbox-label">
            <input
              type="checkbox"
              checked={isChecked}
              onChange={handleCheckboxChange}
              className="risk-checkbox"
            />
            <span className="risk-checkbox-text">
              I accept all the{" "}
              <a 
                href="https://github.com/QuickAlgoPlus/quickalgoplus_agreements/blob/main/PrivacyPolicy.md" 
                target="_blank" 
                rel="noopener noreferrer"
                className="risk-terms-link"
              >
                terms & conditions
              </a>
            </span>
          </label>
          <Button
            className={`risk-understand-btn ${!isChecked ? 'disabled' : ''}`}
            onClick={handleCloseModal}
            disabled={!isChecked}
          >
            I Understand
          </Button>
        </div>
      </Modal.Footer>
    </Modal>
  );
};

export default RiskHomeModal;
